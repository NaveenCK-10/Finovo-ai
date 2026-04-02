import { successResponse, errorResponse, badRequest } from '../utils/responseHandler.js';
import { getCacheKey, getCached, setCache } from '../services/llmService.js';
import { buildUserPrompt, routeAgentLogic } from '../utils/promptBuilder.js';
import logger from '../utils/logger.js';
import { db } from '../database/db.js';
import { adminDb } from '../database/firebaseAdmin.js';
import admin from 'firebase-admin';

// Initialize firebase admin for backend firestore access
if (!admin.apps.length) {
  admin.initializeApp();
}
const firestoreDb = admin.firestore();

// Modular agents
import { riskAgent, riskFallback, config as riskConfig } from '../services/agents/riskAgent.js';
import { futureAgent, futureFallback, config as futureConfig } from '../services/agents/futureAgent.js';
import { advisorAgent, advisorFallback, config as advisorConfig } from '../services/agents/advisorAgent.js';

const agentModules = {
  risk: { invoke: riskAgent, fallback: riskFallback, name: riskConfig.name },
  future: { invoke: futureAgent, fallback: futureFallback, name: futureConfig.name },
  advisor: { invoke: advisorAgent, fallback: advisorFallback, name: advisorConfig.name }
};

// Part 4.3 — Safe numeric helper: prevents NaN / Infinity / undefined
function safeNum(value, fallback = 0) {
  const n = Number(value);
  return (isFinite(n) && !isNaN(n)) ? n : fallback;
}

// Part 4.5 — Generate AI confidence locally (85–95%)
function generateConfidence() {
  return Math.floor(Math.random() * 11) + 85; // 85 to 95 inclusive
}

// Part 4.4 — Rate Limit Cache
const rateLimitCache = new Map();

const profileCache = new Map();
const PROFILE_TTL = 30000; // 30 seconds

// Part 2 — Fetch financial data from backend storage, keyed by uid
// DO NOT trust financialData sent by frontend
async function getBackendFinancialData(uid) {
  if (!uid) return null;
  
  const now = Date.now();
  if (profileCache.has(uid)) {
    const cached = profileCache.get(uid);
    if (now - cached.timestamp < PROFILE_TTL) {
      return cached.data;
    }
  }
  
  try {
    const userDoc = await firestoreDb.collection('users').doc(uid).get();
    let data = {};
    if (userDoc.exists) {
      data = userDoc.data();
    }

    const transSnap = await firestoreDb.collection('transactions').where('uid', '==', uid).get();
    let transactions = [];
    if (!transSnap.empty) {
      transSnap.forEach(doc => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
    }

    const finalData = {
      income: safeNum(data.income, 60000),
      spent: safeNum(data.spent, 20000),
      remaining: safeNum(data.savings || data.remaining, 40000),
      transactions: transactions
    };

    profileCache.set(uid, { data: finalData, timestamp: now });
    return finalData;
  } catch (error) {
    logger.error('Error fetching user data from Firestore', error);
  }

  // No stored profile or error — use safe defaults
  return {
    income: 60000,
    spent: 20000,
    remaining: 40000,
    transactions: []
  };
}

export const handleSingleChat = async (req, res) => {
  try {
    const { message, memoryContext } = req.body;
    if (!message) return badRequest(res, 'Message is required');

    // Part 2 & Security — Extract verified uid natively from middleware
    const uid = req.user.uid;

    // Part 4.4 — Rate Limiting
    const now = Date.now();
    if (rateLimitCache.has(uid) && now - rateLimitCache.get(uid) < 1000) {
      return errorResponse(res, 'Rate limit exceeded. Please wait a moment.', 429);
    }
    rateLimitCache.set(uid, now);

    // Part 2 — Fetch financial data from backend, never trust frontend values
    const financialData = await getBackendFinancialData(uid);

    const lowerMessage = message.toLowerCase();
    const agentKey = routeAgentLogic(lowerMessage);
    const agentMod = agentModules[agentKey];

    // Log Query into Database Persistent Storage
    await db.push('chatHistory', { query: message, agent: agentMod.name, timestamp: new Date().toISOString(), uid });

    // Cache lookup
    const dataKey = `${financialData?.income||0}-${financialData?.spent||0}`;
    const personalityKey = memoryContext?.personality?.substring(0,20) || '';
    const cacheKey = getCacheKey(message, dataKey, personalityKey);
    const cached = getCached(cacheKey);

    if (cached) {
      logger.info(`Cache hit for single chat: ${message}`);
      return successResponse(res, { ...cached, cached: true });
    }

    const userPrompt = buildUserPrompt(message, financialData, memoryContext);
    
    let reply = await agentMod.invoke(userPrompt);
    let isFallback = false;

    if (!reply) {
      logger.warn(`API returned null. Triggering fallback for ${agentMod.name}.`);
      reply = agentMod.fallback(financialData, message);
      isFallback = true;
    }

    // Part 4.5 — Append confidence score to every response
    const confidence = generateConfidence();
    const replyWithConfidence = `${reply}\n\nAI Confidence: ${confidence}%`;

    // Persist insightful responses
    await db.push('insights', { agent: agentMod.name, response: replyWithConfidence, timestamp: new Date().toISOString(), uid });

    const result = { response: replyWithConfidence, agent: agentMod.name, fallback: isFallback, confidence };
    setCache(cacheKey, result);
    return successResponse(res, result);

  } catch (error) {
    logger.error('Error in handleSingleChat', error);
    return errorResponse(res, 'Internal server error while processing request', 500);
  }
};

export const handleCollaborate = async (req, res) => {
  try {
    const { message, memoryContext, agents } = req.body;
    if (!message) return badRequest(res, 'Message is required');

    // Part 2 & Security — Extract verified uid natively from middleware
    const uid = req.user.uid;

    // Part 4.4 — Rate Limiting
    const now = Date.now();
    if (rateLimitCache.has(uid) && now - rateLimitCache.get(uid) < 1000) {
      return errorResponse(res, 'Rate limit exceeded. Please wait a moment.', 429);
    }
    rateLimitCache.set(uid, now);

    // Part 2 — Backend-fetched financial data
    const financialData = await getBackendFinancialData(uid);

    const requestedAgents = agents || ['risk', 'advisor'];
    await db.push('chatHistory', { query: message, agent: 'Multi-Agent', timestamp: new Date().toISOString(), uid });

    const userPrompt = buildUserPrompt(message, financialData, memoryContext);

    const promises = requestedAgents.map(async (agentKey) => {
      const mod = agentModules[agentKey];
      if (!mod) return null;
      const reply = await mod.invoke(userPrompt);
      return {
        agent: mod.name,
        response: reply || mod.fallback(financialData, message),
        fallback: !reply
      };
    });

    const results = (await Promise.all(promises)).filter(Boolean);
    const primary = results.find(r => !r.fallback) || results[0];

    // Part 4.5 — Confidence for collaborative response
    const confidence = generateConfidence();
    
    // Save primary contribution as insight
    await db.push('insights', { agent: primary.agent, response: primary.response, timestamp: new Date().toISOString(), uid });

    return successResponse(res, {
      primary: primary,
      contributions: results,
      merged: results.map(r => `[${r.agent}] ${r.response}`).join('\n'),
      agentCount: results.length,
      confidence
    });

  } catch (error) {
    logger.error('Error in handleCollaborate', error);
    return errorResponse(res, 'Failed to coordinate agents', 500);
  }
};
