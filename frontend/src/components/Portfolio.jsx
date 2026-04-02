import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Portfolio() {
  const [assets, setAssets] = useState([
    { id: 1, type: 'Stock', symbol: 'NVDA', qty: 10, buyPrice: 750, currentPrice: 890, logo: '🟢' },
    { id: 2, type: 'Crypto', symbol: 'BTC', qty: 0.05, buyPrice: 42000, currentPrice: 66000, logo: '₿' }
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'Stock', symbol: '', qty: '', buyPrice: '' });

  const totalValue = assets.reduce((acc, a) => acc + (a.qty * a.currentPrice), 0);
  const totalCost = assets.reduce((acc, a) => acc + (a.qty * a.buyPrice), 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = (totalGain / totalCost) * 100;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.symbol || !form.qty || !form.buyPrice) return;
    const currentPrice = parseFloat(form.buyPrice) * (1 + (Math.random() * 0.1 - 0.05)); // mock live price
    const newAsset = {
      id: Date.now(),
      type: form.type,
      symbol: form.symbol.toUpperCase(),
      qty: parseFloat(form.qty),
      buyPrice: parseFloat(form.buyPrice),
      currentPrice,
      logo: form.type === 'Crypto' ? '₿' : '📈'
    };
    setAssets([...assets, newAsset]);
    setShowAdd(false);
    setForm({ type: 'Stock', symbol: '', qty: '', buyPrice: '' });
  };

  return (
    <div className="portfolio-page" style={{ paddingBottom: '40px' }}>
      <div className="portfolio-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Portfolio Tracker</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor your investments backed by AI intelligence.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Add Asset</button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            className="glass-card" 
            initial={{ opacity: 0, height: 0, padding: 0 }} 
            animate={{ opacity: 1, height: 'auto', padding: '24px' }} 
            exit={{ opacity: 0, height: 0, padding: 0, overflow: 'hidden' }}
            style={{ marginBottom: '24px' }}
          >
            <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Type</label>
                <select className="form-input" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  <option>Stock</option>
                  <option>Crypto</option>
                  <option>ETF</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Symbol/Ticker</label>
                <input className="form-input" placeholder="e.g. AAPL" value={form.symbol} onChange={(e) => setForm({...form, symbol: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Quantity</label>
                <input type="number" className="form-input" placeholder="0" value={form.qty} onChange={(e) => setForm({...form, qty: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mkt Buy Price ($)</label>
                <input type="number" className="form-input" placeholder="0.00" value={form.buyPrice} onChange={(e) => setForm({...form, buyPrice: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>Confirm</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {assets.map((asset) => {
            const val = asset.qty * asset.currentPrice;
            const cost = asset.qty * asset.buyPrice;
            const gn = val - cost;
            const gnPct = (gn / cost) * 100;
            const isPos = gn >= 0;

            return (
              <motion.div key={asset.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '2rem', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {asset.logo}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{asset.symbol}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{asset.qty} {asset.type} • Avg ${asset.buyPrice.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
                  <div style={{ fontSize: '0.9rem', color: isPos ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    {isPos ? '↑' : '↓'} ${Math.abs(gn).toFixed(2)} ({Math.abs(gnPct).toFixed(2)}%)
                  </div>
                </div>
              </motion.div>
            );
          })}
          {assets.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No assets tracked. Add your first stock or crypto asset!
            </div>
          )}
        </div>

        <div className="glass-card" style={{ height: 'fit-content', padding: '24px' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Total Balance</h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', background: 'linear-gradient(135deg, #fff, #A78BFA)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}
          </div>
          <div style={{ fontSize: '1rem', color: totalGain >= 0 ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <span style={{ padding: '4px 8px', borderRadius: '4px', background: totalGain >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {totalGain >= 0 ? '+' : '-'}${Math.abs(totalGain).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}
            </span>
            <span>({totalGainPct > 0 ? '+' : ''}{totalGainPct.toFixed(2)}% All Time)</span>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', marginBottom: '24px' }} />

          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>AI Portfolio Insight</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--purple)', marginRight: '8px' }}>✦</span>
            High exposure to tech sector detected. Consider diversifying into ETFs to lower beta risk.
          </p>
        </div>
      </div>
    </div>
  );
}
