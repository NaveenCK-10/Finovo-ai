import { invokeLLM } from '../llmService.js';

export const config = {
  name: 'Advisor Agent',
  model: 'meta/llama-3.3-70b-instruct',
  maxTokens: 200,
  systemPrompt: `You are Finovo Advisor — an elite financial intelligence AI with contextual memory.
You remember past conversations, detect patterns, and give personalized advice.
Response format:
- Line 1: Key insight based on user's specific situation
- Line 2: Clear action item with expected outcome
Max 2 lines. Be data-driven. Reference user personality and past behavior.`
};

export async function advisorAgent(userPrompt) {
  return await invokeLLM(config.systemPrompt, userPrompt, config.model, null, config.maxTokens);
}

export function advisorFallback(financialData) {
  const spent = financialData?.spent || 0;
  const income = financialData?.income || 0;
  const savings = income - spent;
  
  if (savings > income * 0.3) {
    return `Savings rate at ${Math.round((savings/income)*100)}% — excellent. Action: Allocate surplus to high-yield instruments for compound growth.`;
  } else if (savings > 0) {
    return `Saving ${Math.round((savings/income)*100)}% of income. Action: Target 20-30% by reducing top discretionary category.`;
  }
  return "⚠️ Over-budget this period. Action: Immediately review and pause non-essential subscriptions.";
}
