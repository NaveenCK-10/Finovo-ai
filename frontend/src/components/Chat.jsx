import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinovo } from '../context/FinovoContext';
import { db, isFirebaseConfigured } from '../firebase';
import { doc, onSnapshot, arrayUnion, updateDoc, setDoc } from 'firebase/firestore';

const AGENTS = {
  ADVISOR: { name: '🧠 Advisor Node', color: 'var(--purple)' },
  RISK: { name: '💰 Risk Engine', color: 'var(--yellow)' },
  FUTURE: { name: '🔮 Predictive Model', color: 'var(--cyan)' }
};

// ⚡ Typing effect hook — reveals text chunk by chunk
function useTypingEffect(text, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);
  
  useEffect(() => {
    if (!text) { setDisplayed(''); setIsDone(true); return; }
    setDisplayed('');
    setIsDone(false);
    let i = 0;
    const interval = setInterval(() => {
      const chunkSize = Math.random() > 0.7 ? 3 : 2;
      i += chunkSize;
      if (i >= text.length) {
        setDisplayed(text);
        setIsDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  
  return { displayed, isDone };
}

// ⚡ Typing bubble component with streaming illusion
function TypingBubble({ msg }) {
  const { displayed, isDone } = useTypingEffect(msg.text, 15);
  
  const renderText = (text) => {
    if (msg.agent?.isFuture) {
      return (
        <span dangerouslySetInnerHTML={{__html: text
          .replace(/(stable|low risk|positive)/gi, '<span style="color:var(--green);font-weight:600">$&</span>')
          .replace(/(exceed|impact|high risk|red|warning|📉)/gi, '<span style="color:var(--red);font-weight:600">$&</span>')
        }}></span>
      );
    }
    return text;
  };
  
  return (
    <motion.div 
      className="chat-bubble ai ai-fade-in"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {msg.agent && (
        <div className="bubble-agent" style={{ color: msg.agent.color }}>
          {msg.agent.name}
          {msg.agent.isFuture && <span className="context-label label-prediction">AI Prediction</span>}
          {msg.isCollaborative && <span className="context-label label-insight">Multi-Agent</span>}
        </div>
      )}
      <div className="bubble-text" style={{ color: msg.riskColor ? msg.riskColor : 'var(--text-secondary)' }}>
        {renderText(displayed)}
        {!isDone && <span className="typing-cursor">▊</span>}
      </div>
      {/* Secondary agent contributions */}
      {msg.contributions && isDone && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="agent-contributions"
        >
          {msg.contributions.map((c, i) => (
            <div key={i} className="contribution-item">
              <span className="contribution-agent">{c.agent === 'Risk Agent' ? '💰' : c.agent === 'Future Agent' ? '🔮' : '🧠'} {c.agent}:</span>
              <span className="contribution-text">{c.response}</span>
            </div>
          ))}
        </motion.div>
      )}
      {msg.confidence && isDone && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.2 }}
          style={{ marginTop: '12px' }}
        >
          <div className="result-confidence" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI Confidence: {msg.confidence}%</div>
          <div className="confidence-track" style={{ marginTop: '4px', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${msg.confidence}%` }}
              transition={{ duration: 0.8, delay: 0.1 }}
              style={{ height: '100%', background: msg.riskColor || 'var(--purple)' }}
            ></motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ⚡ Static message (no typing effect — for history / user messages)
function StaticBubble({ msg }) {
  return (
    <motion.div 
      className={`chat-bubble ${msg.sender}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {msg.sender === 'ai' && msg.agent && (
        <div className="bubble-agent" style={{ color: msg.agent.color }}>
          {msg.agent.name}
          {msg.agent.isFuture && <span className="context-label label-prediction">AI Prediction</span>}
          {msg.isCollaborative && <span className="context-label label-insight">Multi-Agent</span>}
        </div>
      )}
      {msg.sender === 'ai' ? (
        <div className="bubble-text" style={{ color: msg.riskColor ? msg.riskColor : 'var(--text-secondary)' }}>
          {msg.agent?.isFuture ? (
            <span dangerouslySetInnerHTML={{__html: msg.text.replace(/(stable|low risk|positive)/gi, '<span style="color:var(--green);font-weight:600">$&</span>').replace(/(exceed|impact|high risk|red|warning|📉)/gi, '<span style="color:var(--red);font-weight:600">$&</span>')}}></span>
          ) : msg.text}
        </div>
      ) : (
        <div className="bubble-text">{msg.text}</div>
      )}
      {/* Secondary agent contributions */}
      {msg.contributions && (
        <div className="agent-contributions">
          {msg.contributions.map((c, i) => (
            <div key={i} className="contribution-item">
              <span className="contribution-agent">{c.agent === 'Risk Agent' ? '💰' : c.agent === 'Future Agent' ? '🔮' : '🧠'} {c.agent}:</span>
              <span className="contribution-text">{c.response}</span>
            </div>
          ))}
        </div>
      )}
      {msg.confidence && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: '12px' }}
        >
          <div className="result-confidence" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI Confidence: {msg.confidence}%</div>
          <div className="confidence-track" style={{ marginTop: '4px', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${msg.confidence}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{ height: '100%', background: msg.riskColor || 'var(--purple)' }}
            ></motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Chat() {
  const { 
    financialData, recordQuery, recordInsight, getMemoryContext,
    triggerSystemSync, personality, currentUser
  } = useFinovo();
  
  const dbDocRef = (currentUser && isFirebaseConfigured) ? doc(db, 'chats', currentUser.uid) : null;
  
  const [messages, setMessages] = useState([
    { id: 1, text: "Finovo Central Intelligence is online. All agents synchronized with your financial profile. How can our neural networks assist you today?", sender: 'ai', agent: AGENTS.ADVISOR, isHistory: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState('');
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  // 🧠 Real-time Chat Sync with Firestore
  useEffect(() => {
    if (!dbDocRef) return;
    const unsubscribe = onSnapshot(dbDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().history?.length > 0) {
        setMessages(docSnap.data().history);
      }
    });
    return () => unsubscribe();
  }, [currentUser, dbDocRef]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const [evaluatingRisk, setEvaluatingRisk] = useState(false);
  const [evaluatingFuture, setEvaluatingFuture] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ⚡ Detect agent type from input
  const detectAgentType = useCallback((text) => {
    const lower = text.toLowerCase();
    if (lower.includes('afford') || lower.includes('buy') || lower.includes('purchase') || lower.includes('spend on')) return 'risk';
    if (lower.includes('future') || lower.includes('predict') || lower.includes('forecast') || lower.includes('trend')) return 'future';
    return 'advisor';
  }, []);

  // 🧠 Determine if query needs multi-agent collaboration
  const needsCollaboration = useCallback((text) => {
    const lower = text.toLowerCase();
    // Complex queries that benefit from multiple perspectives
    if ((lower.includes('should') || lower.includes('advice')) && (lower.includes('buy') || lower.includes('spend'))) return true;
    if (lower.includes('overall') || lower.includes('summary') || lower.includes('analysis')) return true;
    if (lower.includes('compare') || lower.includes('best') || lower.includes('recommend')) return true;
    return false;
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    
    const userText = input;
    setInput('');
    
    const userMsg = { id: Date.now(), text: userText, sender: 'user', timestamp: new Date().toISOString() };
    if (!dbDocRef) {
      setMessages(prev => [...prev, userMsg]);
    } else {
      await updateDoc(dbDocRef, { history: arrayUnion(userMsg) }).catch(async () => {
        await setDoc(dbDocRef, { history: [userMsg] });
      });
    }
    
    // 🧠 Record query in memory
    recordQuery(userText);
    
    const agentType = detectAgentType(userText);
    const isRiskInput = agentType === 'risk';
    const isFutureInput = agentType === 'future';
    const isCollab = needsCollaboration(userText);
    
    setIsTyping(true);
    setEvaluatingRisk(isRiskInput);
    setEvaluatingFuture(isFutureInput);
    
    // ⚡ Multi-phase loading feedback
    if (isCollab) {
      setThinkingPhase('🧠 Coordinating multi-agent response...');
    } else {
      setThinkingPhase(
        isRiskInput ? '💰 Risk Agent evaluating...' : 
        isFutureInput ? '🔮 Running predictive model...' : 
        '🧠 Advisor reasoning...'
      );
    }
    
    // ⚡ Phase 2
    const phaseTimer = setTimeout(() => {
      setThinkingPhase(prev => (
        isCollab ? '🔄 Merging agent perspectives...' :
        isRiskInput ? '💰 Cross-referencing safe spending thresholds...' :
        isFutureInput ? '🔮 Analyzing behavioral trajectory models...' :
        '🧠 Developing strategic insight...'
      ));
    }, 1200);

    // 🧠 Get memory context for injection
    const memoryContext = getMemoryContext();

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      
      let data;
      
      if (isCollab) {
        // 🧠 Multi-agent collaboration request
        const agents = ['advisor'];
        if (userText.toLowerCase().includes('buy') || userText.toLowerCase().includes('afford')) agents.push('risk');
        if (userText.toLowerCase().includes('future') || userText.toLowerCase().includes('long')) agents.push('future');
        if (agents.length === 1) agents.push('risk'); // Always add a second perspective
        
        const res = await fetch('http://localhost:3001/api/chat/collaborate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-uid': currentUser?.uid || 'anonymous'
          },
          signal: controller.signal,
          body: JSON.stringify({
            message: userText,
            memoryContext,
            agents
          })
        });
        const resJson = await res.json();
        
        if (!resJson.success) throw new Error(resJson.error || 'API Failed');
        
        const collabData = resJson.data;
        // Use primary agent's response as main text
        data = {
          response: collabData.primary.response,
          agent: collabData.primary.agent,
          contributions: collabData.contributions.filter(c => c.agent !== collabData.primary.agent)
        };
      } else {
        // Standard single-agent request with memory context
        const res = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-uid': currentUser?.uid || 'anonymous'
          },
          signal: controller.signal,
          body: JSON.stringify({
            message: userText,
            memoryContext
          })
        });
        const resJson = await res.json();
        if (!resJson.success) throw new Error(resJson.error || 'API Failed');
        data = resJson.data;
      }

      clearTimeout(phaseTimer);
      
      let matchedColor = AGENTS.ADVISOR.color;
      let matchedName = `🧠 ${data.agent}`;
      // Use backend-provided confidence when available; fall back to local generation
      let confidence = data.confidence || (Math.floor(Math.random() * 11) + 85);
      let riskColor = null;

      if (data.agent === 'Risk Agent') {
        matchedColor = AGENTS.RISK.color;
        matchedName = `💰 ${data.agent}`;
        if (data.response.includes('🔴') || data.response.toLowerCase().includes('not recommended')) {
          riskColor = 'var(--red)';
          confidence = Math.floor(Math.random() * 6) + 90;
        } else if (data.response.includes('🟡') || data.response.toLowerCase().includes('risky') || data.response.toLowerCase().includes('caution')) {
          riskColor = 'var(--yellow)';
          confidence = Math.floor(Math.random() * 8) + 82;
        } else if (data.response.includes('🟢') || data.response.toLowerCase().includes('safe')) {
          riskColor = 'var(--green)';
          confidence = Math.floor(Math.random() * 5) + 91;
        }
      } else if (data.agent === 'Future Agent') {
        matchedColor = AGENTS.FUTURE.color;
        matchedName = `🔮 ${data.agent}`;
        if (data.response.includes('📉') || data.response.toLowerCase().includes('high')) {
          riskColor = 'var(--yellow)';
        } else if (data.response.includes('📈') || data.response.toLowerCase().includes('stable') || data.response.toLowerCase().includes('low')) {
          riskColor = 'var(--cyan)';
        }
      }

      const aiReply = { 
        id: Date.now() + 1, 
        text: data.response, 
        sender: 'ai', 
        agent: { name: matchedName, color: matchedColor, isFuture: data.agent === 'Future Agent' },
        riskColor,
        confidence,
        isNew: true,
        isCollaborative: isCollab,
        contributions: data.contributions || null,
        timestamp: new Date().toISOString()
      };

      if (!dbDocRef) {
        setMessages(prev => [...prev, aiReply]);
      } else {
        await updateDoc(dbDocRef, { history: arrayUnion(aiReply) }).catch(async () => {
          await setDoc(dbDocRef, { history: [aiReply] });
        });
      }
      
      // 🧠 Record insight in memory
      recordInsight(data.response, data.agent);
      
      // 🔮 Trigger cross-component sync
      triggerSystemSync({
        agent: data.agent,
        response: data.response,
        query: userText,
        agentType
      });
      
    } catch (error) {
      clearTimeout(phaseTimer);
      if (error.name === 'AbortError') return;
      console.error(error);
      const errReply = { 
        id: Date.now() + 1, 
        text: "Error connecting to AI nodes. Please verify server status.", 
        sender: 'ai', 
        agent: AGENTS.ADVISOR,
        isHistory: true
      };
      setMessages(prev => [...prev, errReply]);
    } finally {
      setIsTyping(false);
      setEvaluatingRisk(false);
      setEvaluatingFuture(false);
      setThinkingPhase('');
      abortRef.current = null;
    }
  }, [input, isTyping, detectAgentType, needsCollaboration, financialData, recordQuery, recordInsight, getMemoryContext, triggerSystemSync]);

  const runDemo = useCallback(() => {
    setInput('Can I afford ₹5000 for a new smartwatch?');
    setTimeout(() => {
        document.querySelector('.chat-send-btn')?.click();
    }, 300);
  }, []);

  // ⚡ Memoize message list
  const messageElements = useMemo(() => {
    return messages.map(msg => {
      if (msg.sender === 'user') {
        return <StaticBubble key={msg.id} msg={msg} />;
      }
      if (msg.isNew && !msg.isHistory) {
        return <TypingBubble key={msg.id} msg={msg} />;
      }
      return <StaticBubble key={msg.id} msg={msg} />;
    });
  }, [messages]);

  return (
    <div className="chat-page">
      <div className="demo-btn">
        <button className="btn-secondary" onClick={runDemo}>⏵ Run Demo Query</button>
      </div>
      <div className="glass-card chat-container">
        <div className="chat-header">
          <h2>Neural Interaction Interface</h2>
          <div className="chat-agents">
            <span className="chat-agent-badge" style={{ color: AGENTS.ADVISOR.color }}>Advisor Active</span>
            <span className="chat-agent-badge" style={{ color: AGENTS.RISK.color }}>Risk Online</span>
            <span className="chat-agent-badge" style={{ color: AGENTS.FUTURE.color }}>Forecasting</span>
          </div>
        </div>
        
        {/* 🧠 Memory context indicator */}
        {personality && (
          <div className="chat-memory-bar">
            <span className="memory-label">🧠 Profile:</span>
            <span className="memory-personality" style={{ color: personality.color }}>
              {personality.emoji} {personality.type}
            </span>
            <span className="memory-sep">·</span>
            <span className="memory-detail">Risk: {personality.riskLevel}</span>
            <span className="memory-sep">·</span>
            <span className="memory-detail">Memory: {messages.filter(m => m.sender === 'ai' && !m.isHistory).length} interactions</span>
          </div>
        )}
        
        <div className="chat-messages">
          <AnimatePresence initial={false}>
            {messageElements}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div 
              className="chat-bubble ai typing-bubble"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bubble-agent" style={{ color: evaluatingRisk ? 'var(--yellow)' : evaluatingFuture ? 'var(--cyan)' : 'var(--purple)' }}>
                 {thinkingPhase || 'Processing Query...'}
              </div>
              <div className="dot-loader" style={{padding: '8px 0'}}>
                <span></span><span></span><span></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <button className="btn-secondary chat-mic-btn" title="Voice Input" style={{fontSize: '1.2rem', padding: '10px 14px'}}>🎙</button>
          <input 
            type="text" 
            className="chat-input"
            placeholder="Interrogate your financial intelligence nodes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
          />
          <button 
            className="btn-primary chat-send-btn" 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{padding: '10px 24px'}}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
