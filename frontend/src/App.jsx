import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinovoProvider, useFinovo } from './context/FinovoContext';
import Dashboard from './components/Dashboard';
import Predictor from './components/Predictor';
import Chat from './components/Chat';
import Auth from './components/Auth';
import { auth, isFirebaseConfigured } from './firebase';
import { signOut } from 'firebase/auth';
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    "🧠 Advisor analyzing behavioral patterns",
    "💰 Risk engine evaluating parameters",
    "🔮 Prediction models updating"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % statuses.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const [showIntro, setShowIntro] = useState(true);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const { isSyncing, syncMessage, currentUser, authLoading } = useFinovo();

  // Cinematic Intro
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  // Cursor glow effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (authLoading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="pulse-dot"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLoginSuccess={() => {}} />;
  }



  return (
    <div className="app">
      {/* Background Intelligence Layer */}
      <div className="grid-overlay"></div>
      <div className="cursor-glow" style={{ left: mousePos.x, top: mousePos.y }}></div>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <AnimatePresence>
        {showIntro && (
          <motion.div 
            className="cinematic-intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div className="intro-grid-overlay"></div>
            <motion.div className="intro-content">
              <motion.h1 
                className="intro-title"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1, textShadow: "0 0 40px rgba(124,58,237,0.8)" }}
                transition={{ duration: 1.5 }}
              >
                Finovo AI
              </motion.h1>
              <motion.p 
                className="intro-subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
              >
                Initializing Financial Intelligence...
              </motion.p>
              <motion.div 
                className="intro-loader"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI System Status Bar */}
      <div className="ai-status-bar">
        <div className="status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="pulse-dot"></div>
          {statuses[statusIndex]}
        </div>
        <div className="api-badge">SYSTEM ACTIVE</div>
        
        {/* 🧠 AI Sync Indicator */}
        <AnimatePresence>
          {isSyncing && (
            <motion.div
              className="status-item sync-indicator"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <span className="status-dot dot-sync pulse"></span>
              <span className="sync-text">{syncMessage || '⚡ Syncing...'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="main-content">
        <header className="app-header">
          <div className="app-logo">
            <img src="/favicon.ico" alt="Finovo AI" />
            Finovo AI
          </div>
          <nav className="navigation">
            <div className="nav-pills">
              {['dashboard', 'predictor', 'chat'].map((tab) => (
                <button
                  key={tab}
                  className={`nav-pill ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTabBadge" 
                      className="nav-pill-bg"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="nav-pill-text">
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </span>
                </button>
              ))}
              <button className="nav-pill" style={{marginLeft: '10px'}} onClick={() => {
                if (isFirebaseConfigured) signOut(auth);
                else window.location.reload();
              }}>
                Logout
              </button>
            </div>
          </nav>
        </header>

        {/* Hero Section (Only in Dashboard) */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.header
              key="hero"
              className="hero-section"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="hero-glow"></div>
              <h1 className="hero-title">Financial Intelligence</h1>
              <h2 className="hero-subtitle">
                AI models continuously learning from your financial behavior.
              </h2>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Dynamic Content area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'predictor' && <Predictor />}
            {activeTab === 'chat' && <Chat />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FinovoProvider>
      <AppContent />
    </FinovoProvider>
  );
}