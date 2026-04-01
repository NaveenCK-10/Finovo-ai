import React, { useState } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinovo } from '../context/FinovoContext';

const INITIAL_CHAT_MESSAGE = {
  id: 1,
  text: "Finovo Central Intelligence is online. All agents synchronized with your financial profile. How can our neural networks assist you today?",
  sender: 'ai',
  agent: { name: '🧠 Advisor Node', color: 'var(--purple)' },
  isHistory: true,
  timestamp: new Date().toISOString()
};

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { fetchUserData, setCurrentUser } = useFinovo();

  const initializeNewUser = async (user) => {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      income: 60000,
      spent: 20000,
      savings: 40000,
      userType: 'Saver',
      personality: 'Balanced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'chats', user.uid), {
      history: [INITIAL_CHAT_MESSAGE]
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isFirebaseConfigured) {
        const fakeUser = { uid: 'demo_user_123', email: email || 'demo@finovo.ai' };
        await new Promise(r => setTimeout(r, 800));
        setCurrentUser(fakeUser);
        setLoading(false);
        console.warn("Running in Demo Mode — Firebase API keys not configured.");
        onLoginSuccess();
        return;
      }

      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await fetchUserData(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await initializeNewUser(user);
        await fetchUserData(user);
      }
      onLoginSuccess();
    } catch (err) {
      const msg = err.message
        .replace(/Firebase: Error \(auth\//g, '')
        .replace(/\)/g, '')
        .replace(/-/g, ' ');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      if (!isFirebaseConfigured) {
        const fakeUser = { uid: 'demo_google_user', email: 'google@finovo.ai' };
        await new Promise(r => setTimeout(r, 800));
        setCurrentUser(fakeUser);
        console.warn("Running in Demo Mode — Firebase not configured.");
        onLoginSuccess();
        return;
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // initialize doc only if new user (getDoc check is handled in fetchUserData)
      const { getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) {
        await initializeNewUser(user);
      }
      await fetchUserData(user);
      onLoginSuccess();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace(/Firebase: /g, ''));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Animated background blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />
      <div className="grid-overlay" />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#lg)" />
              <path d="M7 18L11 13L14 16L18 10L21 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8B5CF6"/>
                  <stop offset="1" stopColor="#06B6D4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="auth-title">Finovo AI</h1>
          <p className="auth-subtitle">Your Financial Intelligence System</p>
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <span className="auth-spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
            </svg>
          )}
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">OR</span>
          <span className="auth-divider-line" />
        </div>

        {/* Email / Password form */}
        <form onSubmit={handleAuth} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="auth-input"
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="auth-input"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                className="auth-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || googleLoading}
          >
            {loading ? (
              <><span className="auth-spinner" /> Authenticating...</>
            ) : (
              isLogin ? 'Login to Finovo' : 'Create Intelligence Profile'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="auth-toggle-row">
          <span className="auth-toggle-text">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
