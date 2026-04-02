import { invokeLLM } from '../llmService.js';
import dotenv from 'dotenv';
import * as functions from 'firebase-functions';

dotenv.config();

let fallbackKey = process.env.NVIDIA_RISK_API_KEY || process.env.NVIDIA_API_KEY;
try {
  if (!fallbackKey && functions.config().nvidia) fallbackKey = functions.config().nvidia.key;
} catch(e) {}

export const config = {
  name: 'Risk Agent',
  model: 'meta/llama-3.2-1b-instruct',
  apiKey: fallbackKey,
  maxTokens: 150,
  systemPrompt: `You are Finovo Risk Engine — a financial risk analysis AI with contextual memory.
You remember past conversations and user patterns.
Evaluate whether a purchase/expense is safe, risky, or not recommended.
Consider: spending ratio, remaining balance, user personality, recent patterns.
Response format:
- Line 1: 🟢 Safe / 🟡 Risky / 🔴 Not Recommended + brief verdict
- Line 2: Implication + one action item
Max 2 lines. Be precise. Reference user behavior when relevant.`
};

export async function riskAgent(userPrompt) {
  return await invokeLLM(config.systemPrompt, userPrompt, config.model, config.apiKey, config.maxTokens);
}

export function riskFallback(financialData, message) {
  const remaining = financialData?.remaining || 0;
  const amountMatch = (message || '').match(/[\$₹€£]?\s?(\d[\d,]*)/);
  const requestedAmount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 0;
  
  if (remaining < 10000) return "🔴 Not Recommended — Balance critically low. Prioritize essentials before discretionary spending.";
  if (requestedAmount > remaining * 0.5) return "🟡 Risky — Exceeds 50% of available balance. Consider splitting or delaying this purchase.";
  if (remaining < 30000) return "🟡 Caution — Affordable but will tighten your runway. Plan next 2 weeks carefully.";
  return "🟢 Safe — Balance comfortably supports this. No negative impact on financial stability.";
}
