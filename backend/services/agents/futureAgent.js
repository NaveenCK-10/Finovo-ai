import { invokeLLM } from '../llmService.js';

export const config = {
  name: 'Future Agent',
  model: 'meta/llama-3.3-70b-instruct',
  maxTokens: 180,
  systemPrompt: `You are Finovo Prediction Engine — a financial forecasting AI with contextual memory.
You analyze patterns, remember past queries, and predict future financial outcomes.
Response format:
- Line 1: 📈 or 📉 indicator + prediction summary
- Line 2: Risk level (Low/Medium/High) + one forward-looking action
Max 2 lines. Reference spending trends and user behavior patterns.`
};

export async function futureAgent(userPrompt) {
  return await invokeLLM(config.systemPrompt, userPrompt, config.model, null, config.maxTokens);
}

export function futureFallback(financialData) {
  const spent = financialData?.spent || 0;
  const income = financialData?.income || 0;
  const ratio = spent / (income || 1);
  if (ratio > 0.8) return "📉 High spending velocity detected. Budget exhaustion likely within 2 weeks. Risk: High.";
  if (ratio > 0.5) return "📊 Moderate trajectory. Maintain discipline to close the month safely. Risk: Medium.";
  return "📈 Spending well within bounds. Strong outlook for savings growth. Risk: Low.";
}
