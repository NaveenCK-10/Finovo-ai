// Part 4.3 — Safe numeric: prevents NaN / Infinity / undefined propagating into prompts
function safeNum(val, fallback = 0) {
  const n = Number(val);
  return (isFinite(n) && !isNaN(n)) ? n : fallback;
}

export function buildUserPrompt(message, financialData, memoryContext) {
  const income    = safeNum(financialData?.income, 60000);
  const spent     = safeNum(financialData?.spent, 20000);
  const remaining = safeNum(financialData?.remaining, 40000);

  const txList = (Array.isArray(financialData?.transactions) ? financialData.transactions : [])
    .map(t => `${t.category || 'Other'}:$${safeNum(t.amount)}`)
    .join(', ');
  
  let prompt = `<<CORE PROFILE>>\n• Income: $${income}\n• Spend: $${spent}\n• Bal: $${remaining}\n• TXs: [${txList || 'none'}]\n\n<<USER QUERY>>\n${message}\n\n<<SYSTEM DIRECTIVE>>\nAnalyze deterministically based ONLY on provided figures. Maximize actionable clarity.`;

  if (memoryContext) {
    if (memoryContext.personality) prompt += `\n${memoryContext.personality}`;
    // 🧠 Behavioral memory injection — long-term user pattern awareness (Upgrade 1)
    if (memoryContext.behaviorSummary && memoryContext.behaviorSummary !== 'User behavior not yet established.') {
      prompt += `\nUser Behavior: ${memoryContext.behaviorSummary}`;
    }
    // 📅 Monthly spend trend injection (Upgrade 2)
    if (memoryContext.monthlySpend) {
      prompt += `\nMonthly Spend Trend: ${memoryContext.monthlySpend}`;
    }
    if (memoryContext.patternSummary) prompt += `\nPattern: ${memoryContext.patternSummary}`;
    if (memoryContext.recentInsights && memoryContext.recentInsights !== 'No prior insights.') {
      prompt += `\nPrevious AI insights: ${memoryContext.recentInsights}`;
    }
    if (memoryContext.anomalyContext) prompt += `\n${memoryContext.anomalyContext}`;
  }

  return prompt;
}

export function routeAgentLogic(lowerMessage) {
  if (lowerMessage.includes('afford') || lowerMessage.includes('buy') || lowerMessage.includes('purchase') || lowerMessage.includes('spend on')) {
    return 'risk';
  }
  if (lowerMessage.includes('future') || lowerMessage.includes('predict') || lowerMessage.includes('forecast') || lowerMessage.includes('trend') || lowerMessage.includes('projection')) {
    return 'future';
  }
  return 'advisor';
}
