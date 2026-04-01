import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinovo } from '../context/FinovoContext';
import TransactionForm from './TransactionForm';

// ── Smart Count-Up Hook ──
function useCountUp(endValue, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = null;
    let animationFrame;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const ratio = Math.min(progress / duration, 1);
      const easing = ratio === 1 ? 1 : 1 - Math.pow(2, -10 * ratio);
      setValue(endValue * easing);
      if (ratio < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);
  return value;
}

export default function Dashboard() {
  const { 
    financialData, personality, stabilityScore, dynamicInsights, 
    forecastData, anomalies, lastAIEvent, isSyncing, currentUser, behaviorSummary,
    spendTrend, addTransaction, resetData
  } = useFinovo();
  
  const [insightIndex, setInsightIndex] = useState(0);
  const [liveScore, setLiveScore] = useState(stabilityScore);
  const [totalSpend, setTotalSpend] = useState(financialData.spent);
  const [scoreFlash, setScoreFlash] = useState(false);

  // Feature 1 — Onboarding panel (dismissed once via localStorage)
  const [showHowItWorks, setShowHowItWorks] = useState(
    () => !localStorage.getItem('finovo_onboarding_dismissed')
  );
  const dismissOnboarding = useCallback(() => {
    localStorage.setItem('finovo_onboarding_dismissed', '1');
    setShowHowItWorks(false);
  }, []);

  // Feature 3 — Rotating smart tips
  const TIPS = [
    '💡 Add expenses regularly for better AI predictions.',
    '💡 Use the Chat tab to ask the AI financial questions.',
    '💡 The Predictor tab models the impact of big purchases.',
    '💡 AI analyzes your spending pattern after every 3 transactions.',
  ];
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTipIndex(p => (p + 1) % TIPS.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Feature 5 — Scroll to TransactionForm
  const txFormRef = useRef(null);

  // ―――――――――――――――――――――――――――――――――――
  // Upgrade 1 — Auto-highlight TransactionForm on first load
  // ―――――――――――――――――――――――――――――――――――
  const [glowActive, setGlowActive] = useState(false);
  useEffect(() => {
    if (financialData.transactions.length === 0) {
      // Wait for layout to fully paint before scrolling
      const scrollTimer = setTimeout(() => {
        txFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setGlowActive(true);
        // Remove glow after 2.5 seconds
        setTimeout(() => setGlowActive(false), 2500);
      }, 600);
      return () => clearTimeout(scrollTimer);
    }
  // Run only once on mount — empty dep array is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ―――――――――――――――――――――――――――――――――――
  // Upgrade 2 — Demo Data population
  // Feature 1 — Demo Mode Badge
  // ―――――――――――――――――――――――――――――――――――
  const DEMO_TRANSACTIONS = [
    { category: 'Rent',          amount: 1200, note: 'Monthly rent',        date: '2026-03-01' },
    { category: 'Food',          amount: 420,  note: 'Groceries & dining',  date: '2026-03-08' },
    { category: 'Transport',     amount: 180,  note: 'Fuel & Uber',         date: '2026-03-12' },
    { category: 'Shopping',      amount: 340,  note: 'Clothing & gadgets',  date: '2026-03-18' },
    { category: 'Entertainment', amount: 95,   note: 'Netflix, Spotify',    date: '2026-03-22' },
    { category: 'Travel',        amount: 860,  note: 'Weekend trip',        date: '2026-03-28' },
  ];
  const demoLoadingRef = useRef(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false); // Feature 1

  const handleDemoData = useCallback(() => {
    if (demoLoadingRef.current) return;
    demoLoadingRef.current = true;
    setDemoLoading(true);

    DEMO_TRANSACTIONS.forEach((tx, i) => {
      setTimeout(() => {
        addTransaction({ ...tx, timestamp: new Date(tx.date).toISOString() });
        if (i === DEMO_TRANSACTIONS.length - 1) {
          setDemoLoading(false);
          setIsDemoMode(true); // activate badge
        }
      }, i * 300);
    });
  }, [addTransaction]);

  // Feature 2 — Reset Data handler
  const handleReset = useCallback(async () => {
    await resetData();
    setIsDemoMode(false);
    demoLoadingRef.current = false; // allow demo button to reappear
  }, [resetData]);

  // Sync stability score from context
  useEffect(() => {
    if (stabilityScore !== liveScore) {
      setScoreFlash(true);
      setLiveScore(stabilityScore);
      setTimeout(() => setScoreFlash(false), 1000);
    }
  }, [stabilityScore]);

  useEffect(() => {
    const aiInterval = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % dynamicInsights.length);
      // Subtle real-time metric updates
      setLiveScore(prev => {
        const jitter = Math.floor(Math.random() * 3) - 1;
        return Math.max(75, Math.min(98, prev + jitter));
      });
      setTotalSpend(prev => prev + (Math.random() * 8 - 2)); 
    }, 4000);
    return () => clearInterval(aiInterval);
  }, [dynamicInsights.length]);

  // Current insight
  const currentInsight = dynamicInsights[insightIndex % dynamicInsights.length];

  return (
    <div className="dashboard">

      {/* ―――――――――――――――――――――――――――――――――――
          Feature 1 — Demo Mode Badge
          Slides in after demo data loads
          ――――――――――――――――――――――――――――――――――― */}
      <AnimatePresence>
        {isDemoMode && (
          <motion.div
            className="demo-mode-badge glass-card"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="demo-mode-icon">⚡</span>
            <span className="demo-mode-text">Demo Mode Active</span>
            <span className="demo-mode-divider" />
            <button className="demo-reset-btn" onClick={handleReset}>
              🗑️ Reset Data
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧠 AI Personality Badge */}
      <motion.div 
        className="glass-card personality-card"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="personality-badge-row">
          <div className="personality-main">
            <span className="personality-emoji">{personality.emoji}</span>
            <div>
              <div className="personality-label">{currentUser?.email || 'Authenticated User'}</div>
              <div className="personality-type" style={{ color: personality.color }}>
                {personality.type}
              </div>
            </div>
          </div>
          <div className="personality-stats">
            <div className="personality-stat">
              <span className="personality-stat-label">Risk</span>
              <span className="personality-stat-value" style={{ 
                color: personality.riskLevel === 'High' ? 'var(--red)' : 
                       personality.riskLevel === 'Medium' ? 'var(--yellow)' : 'var(--green)' 
              }}>{personality.riskLevel}</span>
            </div>
            <div className="personality-stat">
              <span className="personality-stat-label">Savings</span>
              <span className="personality-stat-value" style={{ color: 'var(--green)' }}>{personality.savingsRate}%</span>
            </div>
            <div className="personality-stat">
              <span className="personality-stat-label">Top Category</span>
              <span className="personality-stat-value">{personality.topCategory}</span>
            </div>
          </div>
        </div>
        {/* Anomaly alerts */}
        <AnimatePresence>
          {anomalies.length > 0 && (
            <motion.div 
              className="anomaly-alerts"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {anomalies.slice(0, 2).map((a, i) => (
                <div key={i} className={`anomaly-chip severity-${a.severity}`}>
                  {a.severity === 'high' ? '🔴' : a.severity === 'medium' ? '🟡' : '🔵'} {a.text}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─────────────────────────────────────────────
          Feature 1 — How Finovo AI Works (Onboarding)
          Shown once, dismissible, fades out smoothly
          ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            className="glass-card how-it-works-panel"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hiw-header">
              <span className="hiw-title">🧠 How Finovo AI works</span>
              <button className="hiw-dismiss" onClick={dismissOnboarding} aria-label="Dismiss">✕</button>
            </div>
            <ul className="hiw-list">
              <li><span className="hiw-dot hiw-dot-green" />Track your expenses with the <strong>Add Expense</strong> button</li>
              <li><span className="hiw-dot hiw-dot-blue" />AI analyzes your <strong>spending patterns</strong> over time</li>
              <li><span className="hiw-dot hiw-dot-purple" />Get personalized <strong>predictions & smart advice</strong> in Chat</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💸 Real Transaction Input */}
      <div ref={txFormRef} className={glowActive ? 'tx-form-glow' : ''}>
        <TransactionForm />
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{color: 'var(--blue)'}}>⏣</div>
            <div className="stat-label">Total Spend (YTD)</div>
          </div>
          <div className="stat-value count-up-value">
            ${useCountUp(totalSpend).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
          <div className="stat-diff diff-warning">↑ 12% vs last operating period</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{color: 'var(--green)'}}>⎈</div>
            <div className="stat-label">Savings Potential</div>
          </div>
          <div className="stat-value count-up-value">
            ${useCountUp(financialData.remaining * 0.09).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
          <div className="stat-diff diff-positive">↑ Optimal Allocation</div>
        </div>
        <div className={`glass-card stat-card ${scoreFlash ? 'stat-flash' : ''}`}>
          <div className="stat-header">
            <div className="stat-icon" style={{color: 'var(--cyan)'}}>✧</div>
            <div className="stat-label">Live Stability Index</div>
          </div>
          <div className="stat-value">
            {liveScore}<span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>/100</span>
          </div>
          <div className="stat-diff diff-positive">
            {isSyncing ? '⚡ AI Syncing…' : 'AI Monitoring Active'}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          Feature 2 — Empty State
          Shown only when user has no real transactions
          ───────────────────────────────────────── */}
      <AnimatePresence>
        {financialData.transactions.length === 0 && (
          <motion.div
            className="glass-card empty-state-card"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No transactions yet</div>
            <div className="empty-state-desc">Start by adding your first expense so the AI can learn your spending habits and give you personalized advice.</div>

            {/* Primary CTA */}
            <button
              className="btn-primary empty-state-btn"
              onClick={() => txFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            >
              + Add Your First Expense
            </button>

            {/* Upgrade 2 — Demo Data shortcut */}
            <button
              className="empty-state-demo-btn"
              onClick={handleDemoData}
              disabled={demoLoading}
            >
              {demoLoading ? (
                <><span className="demo-spinner" /> Loading demo...​</>
              ) : (
                <>⚡ Try Demo Data</>  
              )}
            </button>
            <div className="empty-state-demo-hint">Instantly see how the AI behaves with real spending data</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dashboard-middle-grid">
        <div className="glass-card forecast-graph" style={{ height: '340px' }}>
          {/* Feature 4 — Context label */}
          <div className="ctx-label-row">
            <span className="ctx-label ctx-label-prediction">⌖ Prediction</span>
          </div>
          <h3 className="card-title">⚲ AI Forecast (Predicted Spending)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="current" stroke="var(--blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" />
              <Area type="monotone" dataKey="predicted" stroke="var(--purple)" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card ai-insights-panel">
          {/* Feature 4 — Context label */}
          <div className="ctx-label-row">
            <span className="ctx-label ctx-label-insight">✦ AI Insight</span>
          </div>
          <h3 className="card-title">✦ Live Intelligence</h3>
          <div className="insight-content">
            <span className="insight-prefix">AI Status:</span>
            <span className={`highlight insight-${currentInsight?.type || 'positive'}`}>
              {currentInsight?.text || 'System monitoring active.'}
            </span>
            {currentInsight?.fromChat && (
              <span className="insight-source">via Chat AI</span>
            )}
            <span className="typing-cursor">_</span>
          </div>

          <div className="personality-tags" style={{ marginTop: '24px' }}>
            <h4 style={{fontSize: '0.8rem', color: 'var(--text-secondary)', width: '100%', marginBottom: '4px'}}>Financial Profile</h4>
            <div className="tag highlight" style={{ color: personality.color, borderColor: personality.color }}>
              {personality.type}
            </div>
            <div className="tag" style={{ 
              color: personality.riskLevel === 'Low' ? 'var(--green)' : 'var(--yellow)',
              borderColor: personality.riskLevel === 'Low' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'
            }}>
              {personality.riskLevel} Risk
            </div>
            <div className="tag highlight">{personality.topCategory} Spender</div>
            <div className="tag">Savers Index: {personality.saversIndex}</div>
          </div>

          {/* 🧠 Behavioral Memory Panel */}
          {behaviorSummary && behaviorSummary !== 'User behavior not yet established.' && (
            <motion.div
              className="behavior-memory-panel"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="behavior-memory-label">🧠 Behavioral Pattern</div>
              <div className="behavior-memory-text">{behaviorSummary}</div>
            </motion.div>
          )}

          {/* 📈 Upgrade 2 — Spend Trend Indicator */}
          {spendTrend.direction !== 'stable' || spendTrend.label !== 'Not enough data' ? (
            <motion.div
              className="spend-trend-indicator"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <span className="spend-trend-label">Monthly Trend</span>
              <span className="spend-trend-badge" style={{ color: spendTrend.color, borderColor: spendTrend.color }}>
                {spendTrend.emoji} {spendTrend.label}
              </span>
            </motion.div>
          ) : null}

          {/* Feature 3 — Rotating smart tip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              className="smart-tip"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35 }}
            >
              {TIPS[tipIndex]}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="glass-card">
          <h3 className="card-title">◴ AI Projection Timeline</h3>
          <ul className="projection-timeline">
            <li className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-time">Next 3 Days</div>
                <div className="timeline-title">Expected auto-pay debits: Spotify, Netflix, AWS. Total $124.</div>
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px'}}>Account balance sufficient.</div>
              </div>
            </li>
            <li className="timeline-item">
              <div className="timeline-dot" style={{borderColor: 'var(--cyan)'}}></div>
              <div className="timeline-content">
                <div className="timeline-time">Next 7 Days</div>
                <div className="timeline-title">Optimal window to transfer to high-yield savings.</div>
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px'}}>AI recommends $500 transfer.</div>
              </div>
            </li>
            <li className="timeline-item">
              <div className="timeline-dot" style={{borderColor: 'var(--text-muted)'}}></div>
              <div className="timeline-content">
                <div className="timeline-time">Next 14 Days</div>
                <div className="timeline-title">Credit card cycle ending. Potential interest risk.</div>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="glass-card">
           {/* Feature 4 — Context label */}
           <div className="ctx-label-row">
             <span className="ctx-label ctx-label-risk">⚠ Risk Analysis</span>
           </div>
           <h3 className="card-title">◈ Behavioral Insight</h3>
           <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px'}}>
             Our neural models indicate a high degree of discretionary spending velocity on weekends.
             By reallocating essential purchases to mid-week, historical data predicts a 14% reduction in transaction volume.
           </p>
           <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
             <strong>Actionable Insight:</strong> Shift scheduled grocery acquisition to Thursday evening. 
             Projected surplus: <span style={{color: 'var(--green)'}}>$84.00</span> per month.
           </p>
           
           {/* 🧠 Last AI Event Echo */}
           <AnimatePresence>
             {lastAIEvent && lastAIEvent.agent !== 'System' && (
               <motion.div
                 className="last-ai-event"
                 initial={{ opacity: 0, y: 8 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.4 }}
               >
                 <div className="event-label">Latest AI Intelligence:</div>
                 <div className="event-text">
                   [{lastAIEvent.agent}] {lastAIEvent.response?.substring(0, 80)}{lastAIEvent.response?.length > 80 ? '...' : ''}
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
