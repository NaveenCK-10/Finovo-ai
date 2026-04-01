import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

// Simple in-memory LRU Cache (max 100 entries)
const CACHE_MAX = 100;
const CACHE_TTL = 5 * 60 * 1000;
const responseCache = new Map();

export const getCacheKey = (message, dataKey, personalityKey) => 
  `${message.trim().toLowerCase()}|${dataKey}|${personalityKey}`;

export const getCached = (key) => {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry.data;
};

export const setCache = (key, data) => {
  if (responseCache.size >= CACHE_MAX) {
    const oldest = responseCache.keys().next().value;
    responseCache.delete(oldest);
  }
  responseCache.set(key, { data, timestamp: Date.now() });
};

async function fetchWithTimeout(url, options, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export function trimResponse(text) {
  if (!text) return text;
  let cleaned = text
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) cleaned = sentences.slice(0, 3).join(' ');
  return cleaned;
}

export async function invokeLLM(systemPrompt, userPrompt, modelName, apiKeyOverride = null, maxTokens = 200) {
  try {
    if (!NVIDIA_API_KEY && !apiKeyOverride) {
      throw new Error("Missing NVIDIA_API_KEY");
    }

    const response = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKeyOverride || NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: maxTokens,
        stream: false
      })
    }, 4000);

    if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);
    const data = await response.json();
    return trimResponse(data.choices[0].message.content);
  } catch (err) {
    logger.error('LLM Invocation Error', err);
    return null;
  }
}
