import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinovo } from '../context/FinovoContext';

const CATEGORIES = ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Subscriptions', 'Travel', 'Health', 'Other'];

const CATEGORY_ICONS = {
  Food: '🍜', Rent: '🏠', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎬', Subscriptions: '📱', Travel: '✈️', Health: '💊', Other: '💼'
};

export default function TransactionForm() {
  const { addTransaction } = useFinovo();

  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        amount: parsedAmount,
        category,
        note: note.trim() || '',
        date: new Date().toISOString().split('T')[0],
      });

      setSuccess(true);
      setAmount('');
      setNote('');
      setCategory('Food');

      // Close form after short success delay
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 1600);
    } catch (err) {
      console.error('Transaction failed:', err);
      setError('Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [amount, category, note, addTransaction]);

  return (
    <div className="tx-form-wrapper">
      {/* Toggle Button */}
      <button
        className="tx-toggle-btn"
        onClick={() => { setIsOpen(prev => !prev); setError(''); setSuccess(false); }}
        aria-expanded={isOpen}
      >
        <span className="tx-toggle-icon">{isOpen ? '✕' : '+'}</span>
        <span>{isOpen ? 'Cancel' : 'Add Expense'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="tx-form-panel glass-card"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="tx-form-header">
              <h3 className="tx-form-title">💸 Log Expense</h3>
              <p className="tx-form-subtitle">AI will learn from your real spending data.</p>
            </div>

            <AnimatePresence>
              {success && (
                <motion.div
                  className="tx-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  ✅ Transaction recorded — AI profile updated!
                </motion.div>
              )}
            </AnimatePresence>

            {!success && (
              <form onSubmit={handleSubmit} className="tx-form" noValidate>
                {/* Amount */}
                <div className="tx-field-group">
                  <label className="tx-label">Amount ($)</label>
                  <div className="tx-amount-row">
                    <span className="tx-currency-symbol">$</span>
                    <input
                      type="number"
                      className="tx-input tx-amount-input"
                      placeholder="0.00"
                      value={amount}
                      min="0.01"
                      step="0.01"
                      onChange={e => setAmount(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="tx-field-group">
                  <label className="tx-label">Category</label>
                  <div className="tx-category-grid">
                    {CATEGORIES.map(cat => (
                      <button
                        type="button"
                        key={cat}
                        className={`tx-cat-btn ${category === cat ? 'active' : ''}`}
                        onClick={() => setCategory(cat)}
                        disabled={loading}
                      >
                        <span>{CATEGORY_ICONS[cat]}</span>
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Note */}
                <div className="tx-field-group">
                  <label className="tx-label">Note <span className="tx-optional">(optional)</span></label>
                  <input
                    type="text"
                    className="tx-input"
                    placeholder="e.g. Dinner with team"
                    value={note}
                    maxLength={80}
                    onChange={e => setNote(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="tx-error"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      ⚠ {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="btn-primary tx-submit-btn"
                  disabled={loading || !amount}
                >
                  {loading ? (
                    <><span className="tx-spinner" />  Processing...</>
                  ) : (
                    `Add ${category} Expense${amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 ? ` · $${parseFloat(amount).toFixed(2)}` : ''}`
                  )}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
