import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';

// ═══════════════════════════════════════════════
// 🧠 FINOVO INTELLIGENCE CONTEXT
// Central brain that connects all components
// ═══════════════════════════════════════════════

const FinovoContext = createContext(null);

// ── Financial Data (simulated user profile) ──
const DEFAULT_FINANCIAL_DATA = {
  income: 80000,
  spent: 45000,
  remaining: 35000,
  transactions: [
    { amount: 1500, category: 'Food', date: '2026-03-28' },
    { amount: 5000, category: 'Rent', date: '2026-03-01' },
    { amount: 120, category: 'Subscriptions', date: '2026-03-15' },
    { amount: 800, category: 'Shopping', date: '2026-03-22' },
    { amount: 350, category: 'Transport', date: '2026-03-25' },
    { amount: 2200, category: 'Food', date: '2026-03-20' },
    { amount: 450, category: 'Entertainment', date: '2026-03-18' },
  ]
};

// ── Personality Classification Engine ──
function classifyPersonality(financialData, recentTopics) {
  const { income, spent, remaining } = financialData;

  // Zero-income safety guard
  if (income <= 0) {
    return {
      type: 'Balanced',
      emoji: '⚖️',
      color: 'var(--blue)',
      riskLevel: 'High',
      saversIndex: 0,
      topCategory: 'General',
      savingsRate: 0,
    };
  }

  const savingsRate = (income - spent) / income;
  const spendRatio = spent / income;

  // Category spending analysis
  const categoryTotals = {};
  (financialData.transactions || []).forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  
  const topCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0];

  // Determine personality type based on strict rules
  let personality = 'Balanced';
  let personalityEmoji = '⚖️';
  let personalityColor = 'var(--blue)';
  
  if (savingsRate > 0.4 && spendRatio < 0.3) {
    personality = 'Investor';
    personalityEmoji = '📈';
    personalityColor = 'var(--purple)';
  } else if (savingsRate > 0.4) {
    personality = 'Saver';
    personalityEmoji = '🛡️';
    personalityColor = 'var(--green)';
  } else if (spendRatio > 0.7) {
    personality = 'Spender';
    personalityEmoji = '💸';
    personalityColor = 'var(--red)';
  }

  // Check if purchase queries dominate recent topics
  const purchaseQueries = recentTopics.filter(t => 
    t.includes('buy') || t.includes('afford') || t.includes('purchase')
  ).length;
  if (purchaseQueries > 2) {
    personality = 'Smart Spender';
    personalityEmoji = '🎯';
    personalityColor = 'var(--cyan)';
  }

  // Risk tolerance
  let riskLevel = 'Low';
  if (spendRatio > 0.7) riskLevel = 'Medium';
  if (spendRatio > 0.85) riskLevel = 'High';

  // Savers index (0-100)
  const saversIndex = Math.round(savingsRate * 100 + (remaining > 20000 ? 10 : 0));

  return {
    type: personality,
    emoji: personalityEmoji,
    color: personalityColor,
    riskLevel,
    saversIndex: Math.min(saversIndex, 99),
    topCategory: topCategory ? topCategory[0] : 'General',
    savingsRate: Math.round(savingsRate * 100),
  };
}

// ── Anomaly Detection Engine ──
function detectAnomalies(financialData) {
  const anomalies = [];
  const { income, spent, transactions } = financialData;
  
  // Zero-income guard
  if (!income || income <= 0) return anomalies;
  
  const spendRatio = spent / income;

  // Category analysis
  const categoryTotals = {};
  (transactions || []).forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  // Detect overspending categories (>25% of total spend)
  Object.entries(categoryTotals).forEach(([cat, total]) => {
    const pct = total / spent * 100;
    if (pct > 25 && cat !== 'Rent') {
      anomalies.push({
        type: 'overspend',
        severity: pct > 40 ? 'high' : 'medium',
        text: `${cat} spending at ${Math.round(pct)}% of total — above recommended threshold.`,
        category: cat,
        amount: total
      });
    }
  });

  // Detect budget risk
  if (spendRatio > 0.8) {
    anomalies.push({
      type: 'budget_risk',
      severity: 'high',
      text: `Spent ${Math.round(spendRatio * 100)}% of income — high budget exhaustion risk.`,
      category: 'Budget',
      amount: spent
    });
  }

  // Detect subscription creep
  const subs = categoryTotals['Subscriptions'] || 0;
  if (subs > income * 0.03) {
    anomalies.push({
      type: 'subscription_creep',
      severity: 'low',
      text: `Subscriptions exceed 3% of income. Review for unused services.`,
      category: 'Subscriptions',
      amount: subs
    });
  }

  return anomalies;
}

// ── Spending Pattern Summary Generator ──
function generatePatternSummary(financialData, queryHistory) {
  const { income, spent, remaining, transactions } = financialData;
  const categoryTotals = {};
  (transactions || []).forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  
  const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategories = sorted.slice(0, 3).map(([c, a]) => `${c}: $${a}`).join(', ') || 'none';
  
  const safeIncome = income > 0 ? income : 1;
  return `Income: $${income}, Spent: $${spent} (${Math.round(spent/safeIncome*100)}%), Balance: $${remaining}. Top spending: ${topCategories}. Recent queries: ${queryHistory.slice(-3).join('; ') || 'none'}.`;
}

// ── 🧠 Structured Behavioral Memory Generator (Upgrade 1) ──
// Builds precise structured data then converts to readable, AI-injectable string
function generateBehaviorSummary(financialData) {
  const { income, spent, transactions } = financialData;
  if (!income || income <= 0 || !transactions || transactions.length === 0) {
    return 'User behavior not yet established.';
  }

  const safeIncome = income > 0 ? income : 1;
  const spendRatio = spent / safeIncome;

  // ── topCategory: weighted scoring (Upgrade 1) ──
  // score = (count * 0.6) + (normalizedAmount * 0.4)
  // This prevents many micro-transactions from dominating over large important expenses
  const categoryCounts = {};
  const categoryAmounts = {};
  transactions.forEach(t => {
    if (t.category && t.amount > 0) {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      categoryAmounts[t.category] = (categoryAmounts[t.category] || 0) + t.amount;
    }
  });
  // Normalize amounts to 0–1 range relative to the highest-spend category
  const maxAmount = Math.max(...Object.values(categoryAmounts), 1);
  const topCategory = Object.keys(categoryCounts)
    .map(cat => ({
      cat,
      score: (categoryCounts[cat] * 0.6) + ((categoryAmounts[cat] / maxAmount) * 0.4)
    }))
    .sort((a, b) => b.score - a.score)[0]?.cat || 'General';

  // ── riskPattern: detect spending spikes vs steady behavior ──
  let riskPattern = 'Stable pattern';
  if (transactions.length >= 3) {
    const amounts = transactions.map(t => t.amount).filter(a => a > 0);
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((s, a) => s + Math.pow(a - avg, 2), 0) / amounts.length);
    // High variance relative to average → spiky spending
    if (stdDev / avg > 0.7) riskPattern = 'High spending pattern';
    else if (stdDev / avg > 0.35) riskPattern = 'Moderate spending variance';
  }

  // ── savingTrend: compare spend ratio brackets ──
  let savingTrend = 'stable savings trend';
  if (spendRatio < 0.4) savingTrend = 'improving savings trend';
  else if (spendRatio > 0.78) savingTrend = 'declining savings trend';

  // ── Build structured object first, then convert to string ──
  const structured = { topCategory, riskPattern, savingTrend };
  return `User spends mostly on ${structured.topCategory} with a ${structured.riskPattern.toLowerCase()} and ${structured.savingTrend}.`;
}

// ── 📈 Spend Trend Detector (Upgrade 2) ──
// Compares last two distinct months in monthlyGrouping
// Returns: { label, emoji, color, direction }
function computeSpendTrend(monthlyGrouping) {
  const months = Object.entries(monthlyGrouping); // [{"March 2026": 32000}, ...]
  if (months.length < 2) return { label: 'Not enough data', emoji: '➡️', color: 'var(--text-muted)', direction: 'stable' };

  const [, prev] = months[months.length - 2];
  const [, curr] = months[months.length - 1];

  if (!prev || prev === 0) return { label: 'Stable', emoji: '➡️', color: 'var(--text-muted)', direction: 'stable' };

  const changePct = ((curr - prev) / prev) * 100;

  // ±5% is considered stable to avoid noise
  if (changePct > 5)  return { label: `Increasing ${Math.round(changePct)}%`, emoji: '📈', color: 'var(--red)',   direction: 'up' };
  if (changePct < -5) return { label: `Decreasing ${Math.abs(Math.round(changePct))}%`, emoji: '📉', color: 'var(--green)', direction: 'down' };
  return { label: 'Stable', emoji: '➡️', color: 'var(--cyan)', direction: 'stable' };
}

// ── 📅 Monthly Transaction Grouper ──
// Groups transactions by month/year and aggregates total spend per month
function groupTransactionsByMonth(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return {};
  const groups = {};
  transactions.forEach(t => {
    if (!t.amount || t.amount <= 0) return;
    // Support both `date` (YYYY-MM-DD) and `timestamp` (ISO string) fields
    const raw = t.timestamp || t.date || null;
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return;
    const key = d.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g. "March 2026"
    groups[key] = (groups[key] || 0) + t.amount;
  });
  return groups;
}

// Part 4.3 — Safe numeric helper to prevent NaN / Infinity / undefined in UI and prompts
function safeNum(val, fallback = 0) {
  const n = Number(val);
  return (isFinite(n) && !isNaN(n)) ? n : fallback;
}

export function FinovoProvider({ children }) {
  // ── Core Financial State ──
  const [financialData, setFinancialData] = useState(DEFAULT_FINANCIAL_DATA);
  
  // ── Memory System (last 5 queries + last 3 insights) ──
  const [queryHistory, setQueryHistory] = useState([]);
  const [insightHistory, setInsightHistory] = useState([]);

  // 🧠 Behavioral Memory Summary (persisted to Firestore)
  const [behaviorSummary, setBehaviorSummary] = useState('User behavior not yet established.');

  // 📅 Monthly Grouping + 📈 Spend Trend (Upgrade 2)
  const [monthlyGrouping, setMonthlyGrouping] = useState({});
  const [spendTrend, setSpendTrend] = useState({ label: 'Not enough data', emoji: '➡️', color: 'var(--text-muted)', direction: 'stable' });

  // Helper: update both grouping and derived trend atomically
  const updateMonthlyData = useCallback((transactions) => {
    const grouped = groupTransactionsByMonth(transactions);
    setMonthlyGrouping(grouped);
    setSpendTrend(computeSpendTrend(grouped));
  }, []);

  // Internal counter to trigger behavior refresh every N transactions
  const txCountRef = useRef(0);
  
  // ── Authentication State ──
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 🧠 Fetch user profile and chat history from Firestore
  const fetchUserData = async (user) => {
    try {
      if (!user || !isFirebaseConfigured) return;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFinancialData(prev => ({
          ...prev,
          income:    safeNum(data.income, prev.income),
          spent:     safeNum(data.spent, prev.spent),
          remaining: safeNum(data.savings, prev.remaining)
        }));
        // 🧠 Load persisted behavior summary
        if (data.behaviorSummary) setBehaviorSummary(data.behaviorSummary);
      }

      // Fetch user's real transactions to replace hardcoded fallback
      const transQ = query(collection(db, 'transactions'), where('uid', '==', user.uid));
      const transSnap = await getDocs(transQ);
      if (!transSnap.empty) {
        const fetchedList = transSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // oldest first
        const recent = fetchedList.slice(-10);
        setFinancialData(prev => ({ ...prev, transactions: recent }));
        // Generate summary from loaded transactions
        setBehaviorSummary(generateBehaviorSummary({ ...DEFAULT_FINANCIAL_DATA, transactions: recent }));
        // Build monthly grouping + trend from full history (not just recent 10)
        updateMonthlyData(fetchedList);
      }
      
      const chatDoc = await getDoc(doc(db, 'chats', user.uid));
      if (chatDoc.exists()) {
        const historyData = chatDoc.data().history || [];
        setQueryHistory(historyData.map(h => h.message).slice(-5));
        setInsightHistory(historyData.filter(h => h.sender === 'ai').map(h => ({text: h.message, agent: h.agent, time: h.timestamp})).slice(-3));
      }
    } catch (err) {
      console.error('Failed to load user data from Firestore', err);
    }
  };

  // 🧠 Global Auth Listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserData(user);
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  // ── AI Personality (dynamic) ──
  const [personality, setPersonality] = useState(() => 
    classifyPersonality(DEFAULT_FINANCIAL_DATA, [])
  );
  
  // ── System Sync State ── 
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [lastAIEvent, setLastAIEvent] = useState(null);
  
  // ── Stability Score (reactive to chat) ──
  const [stabilityScore, setStabilityScore] = useState(84);
  
  // ── Dynamic Insights (event-driven) ──
  const [dynamicInsights, setDynamicInsights] = useState([
    { type: 'warning', text: 'Anomalous subscription spending growth detected (+15%).' },
    { type: 'saving', text: 'Optimization opportunity: Consolidate active liabilities to yield $120/mo surplus.' },
    { type: 'positive', text: 'Liquidity reserve target achieved for current fiscal quarter.' },
    { type: 'warning', text: 'Projected discretionary spending exceeds safe threshold.' }
  ]);
  
  // ── Forecast Data (reactive) ──
  const [forecastData, setForecastData] = useState([
    { name: 'Jan', current: 4000, predicted: 4000 },
    { name: 'Feb', current: 3000, predicted: 3000 },
    { name: 'Mar', current: 2000, predicted: 2000 },
    { name: 'Apr', current: 2780, predicted: 2780 },
    { name: 'May', current: 1890, predicted: 1890 },
    { name: 'Jun', current: 2390, predicted: 2390 },
    { name: 'Jul', current: null, predicted: 3490 },
    { name: 'Aug', current: null, predicted: 2000 },
  ]);

  // ── Anomalies (auto-detected) ──
  const [anomalies, setAnomalies] = useState(() => detectAnomalies(DEFAULT_FINANCIAL_DATA));

  // Debounce ref for sync indicator
  const syncTimerRef = useRef(null);

  // ═══════════════════════════════════════════════
  // 🧠 RECORD QUERY (Memory System)
  // ═══════════════════════════════════════════════
  const recordQuery = useCallback((query) => {
    setQueryHistory(prev => {
      const updated = [...prev, query.toLowerCase().trim()].slice(-5);
      // Re-classify personality with new data
      setPersonality(classifyPersonality(financialData, updated));
      return updated;
    });
  }, [financialData]);

  // ═══════════════════════════════════════════════
  // 🧠 RECORD AI INSIGHT (Memory System)  
  // ═══════════════════════════════════════════════
  const recordInsight = useCallback(async (insight, agentName) => {
    setInsightHistory(prev => [...prev, { text: insight, agent: agentName, time: Date.now() }].slice(-3));
    
    // Background sync to Firestore insights collection
    try {
      if (currentUser && isFirebaseConfigured) {
        await addDoc(collection(db, 'insights'), {
          uid: currentUser.uid,
          agent: agentName,
          insight: insight,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Insight sync failed:', err);
    }
  }, [currentUser]);

  // ═══════════════════════════════════════════════
  // 🔮 GET CONTEXT FOR AI PROMPT (Memory Injection)
  // ═══════════════════════════════════════════════
  const getMemoryContext = useCallback(() => {
    const patternSummary = generatePatternSummary(financialData, queryHistory);
    const recentInsights = insightHistory.map(i => `[${i.agent}]: ${i.text}`).join(' | ');
    const anomalyContext = anomalies.length > 0 
      ? `Active anomalies: ${anomalies.map(a => a.text).join('; ')}` 
      : 'No anomalies detected.';

    // 📅 Summarize monthly grouping for prompt injection
    const monthlySpend = Object.entries(monthlyGrouping)
      .slice(-2) // last 2 months only to keep prompt concise
      .map(([m, amt]) => `${m}: $${Math.round(amt)}`)
      .join(', ');
    
    return {
      patternSummary,
      recentInsights: recentInsights || 'No prior insights.',
      anomalyContext,
      personality: `User profile: ${personality.type} (Risk: ${personality.riskLevel}, Savings rate: ${personality.savingsRate}%)`,
      queryHistory: queryHistory.slice(-3),
      // 🧠 Behavioral memory injected for every AI call
      behaviorSummary: behaviorSummary || 'User behavior not yet established.',
      // 📅 Monthly spending trend injected if available
      monthlySpend: monthlySpend || null
    };
  }, [financialData, queryHistory, insightHistory, anomalies, personality, behaviorSummary, monthlyGrouping]);

  // ═══════════════════════════════════════════════
  // 🔮 CROSS-COMPONENT SYNC (Chat → Dashboard)
  // ═══════════════════════════════════════════════
  const triggerSystemSync = useCallback((aiEvent) => {
    setIsSyncing(true);
    setSyncMessage('AI updating system metrics...');
    setLastAIEvent(aiEvent);

    // Update stability score based on AI response
    if (aiEvent.agent === 'Risk Agent') {
      if (aiEvent.response?.includes('🟢') || aiEvent.response?.toLowerCase().includes('safe')) {
        setStabilityScore(prev => Math.min(prev + 2, 98));
      } else if (aiEvent.response?.includes('🔴') || aiEvent.response?.toLowerCase().includes('not recommended')) {
        setStabilityScore(prev => Math.max(prev - 3, 60));
      }
    }

    // Inject a new dynamic insight from chat AI response
    if (aiEvent.response && aiEvent.agent) {
      const shortInsight = aiEvent.response.length > 60 
        ? aiEvent.response.substring(0, 60) + '...' 
        : aiEvent.response;
      
      const insightType = aiEvent.response.includes('🟢') || aiEvent.response.includes('📈') ? 'positive'
        : aiEvent.response.includes('🔴') || aiEvent.response.includes('📉') ? 'warning'
        : 'saving';
      
      setDynamicInsights(prev => {
        const newInsight = { type: insightType, text: shortInsight, fromChat: true };
        return [...prev.slice(-4), newInsight]; // keep max 5
      });
    }

    // Update forecast predictions slightly based on AI intelligence
    if (aiEvent.agent === 'Future Agent') {
      setForecastData(prev => prev.map((d, i) => {
        if (d.predicted && i >= 5) {
          // Adjust future months based on AI analysis
          const jitter = aiEvent.response?.includes('📉') ? 200 : -150;
          return { ...d, predicted: d.predicted + jitter };
        }
        return d;
      }));
    }

    // Sync indicator fade-out
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      setIsSyncing(false);
      setSyncMessage('');
    }, 1800);
  }, []);

  // ═══════════════════════════════════════════════
  // 🎯 EVENT-DRIVEN TRIGGERS
  // ═══════════════════════════════════════════════
  const addTransaction = useCallback(async (transaction) => {
    setFinancialData(prev => {
      const updated = {
        ...prev,
        spent: prev.spent + transaction.amount,
        remaining: prev.remaining - transaction.amount,
        transactions: [...prev.transactions, transaction].slice(-10)
      };
      // Re-detect anomalies
      setAnomalies(detectAnomalies(updated));
      const newPersonality = classifyPersonality(updated, queryHistory);
      setPersonality(newPersonality);

      // 🧠 Update behavior summary every 3 transactions
      txCountRef.current += 1;
      if (txCountRef.current % 3 === 0 || txCountRef.current === 1) {
        const newSummary = generateBehaviorSummary(updated);
        setBehaviorSummary(newSummary);
        // Persist to Firestore asynchronously
        if (currentUser && isFirebaseConfigured) {
          updateDoc(doc(db, 'users', currentUser.uid), {
            behaviorSummary: newSummary,
            updatedAt: new Date().toISOString()
          }).catch(console.error);
        }
      }
      
      // Update User Model in Firestore dynamically
      if (currentUser && isFirebaseConfigured) {
        updateDoc(doc(db, 'users', currentUser.uid), {
          spent: updated.spent,
          savings: updated.remaining,
          userType: newPersonality.type,
          personality: newPersonality.type,
          updatedAt: new Date().toISOString()
        }).catch(console.error);

        addDoc(collection(db, 'transactions'), {
          uid: currentUser.uid,
          ...transaction,
          timestamp: new Date().toISOString()
        }).catch(console.error);
      }

      // 📅 Update monthly grouping + trend with new transaction (Upgrade 2)
      updateMonthlyData(updated.transactions);

      // Trigger AI sync
      triggerSystemSync({ agent: 'System', response: `New ${transaction.category} expense: $${transaction.amount}` });
      return updated;
    });
  }, [queryHistory, triggerSystemSync, currentUser, updateMonthlyData]);

  // ═════════════════════════════════════════════
  // 🗑️ RESET DATA — clears all transactions (Feature 2)
  // ═════════════════════════════════════════════
  const resetData = useCallback(async () => {
    // 🔒 Fix 1 — Confirmation guard (runs before ANY state or Firestore mutation)
    if (!window.confirm('Are you sure you want to reset all your financial data? This cannot be undone.')) {
      return; // user cancelled — abort everything
    }

    // 1️⃣ Reset local financial state (keep income, zero out spent/remaining/transactions)
    const reset = {
      ...DEFAULT_FINANCIAL_DATA,
      spent: 0,
      remaining: DEFAULT_FINANCIAL_DATA.income,
      transactions: []
    };
    setFinancialData(reset);
    setBehaviorSummary('User behavior not yet established.');
    updateMonthlyData([]);
    txCountRef.current = 0;

    // 2️⃣ Delete all Firestore transactions using batch (Fix 2 — atomic, single round-trip)
    if (currentUser && isFirebaseConfigured) {
      try {
        const transQ = query(collection(db, 'transactions'), where('uid', '==', currentUser.uid));
        const snap = await getDocs(transQ);

        // 🛡️ Scalability guard — Firestore batch limit is 500 ops
        if (snap.size > 450) {
          console.warn(`Finovo: Large dataset detected (${snap.size} transactions). Consider chunked deletion for scalability.`);
        }

        // writeBatch: all deletes committed atomically in one network call
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();

        // Reset user spending fields in Firestore
        await updateDoc(doc(db, 'users', currentUser.uid), {
          spent: 0,
          savings: DEFAULT_FINANCIAL_DATA.income,
          behaviorSummary: 'User behavior not yet established.',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Reset data Firestore cleanup failed:', err);
      }
    }
  }, [currentUser, updateMonthlyData]);

  const value = {
    // State
    financialData,
    queryHistory,
    insightHistory,
    personality,
    isSyncing,
    syncMessage,
    lastAIEvent,
    stabilityScore,
    dynamicInsights,
    forecastData,
    anomalies,
    currentUser,
    authLoading,
    behaviorSummary,
    monthlyGrouping,
    spendTrend,
    
    // Actions
    recordQuery,
    recordInsight,
    getMemoryContext,
    triggerSystemSync,
    addTransaction,
    resetData,
    setStabilityScore,
    fetchUserData,
    setCurrentUser,
  };

  return (
    <FinovoContext.Provider value={value}>
      {children}
    </FinovoContext.Provider>
  );
}

export function useFinovo() {
  const ctx = useContext(FinovoContext);
  if (!ctx) throw new Error('useFinovo must be used within FinovoProvider');
  return ctx;
}
