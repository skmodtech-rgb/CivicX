import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function AdminInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/insights').then(r => {
      setInsights(r.data.insights);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-muted" style={{ padding:60 }}><div className="animate-spin" style={{ fontSize:32 }}>⚙️</div><p style={{ marginTop:12 }}>Generating Predictive Insights...</p></div>;

  const ins = insights || {};

  return (
    <div className="admin-insights">
      <h1 style={{ marginBottom: 4 }}>🧠 Predictive Insights</h1>
      <p className="text-secondary body-sm" style={{ marginBottom: 28 }}>AI-driven patterns and civic intelligence</p>

      {/* Critical Alert */}
      {ins.criticalUnresolved > 0 && (
        <motion.div className="card" initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ padding:20, borderLeft:'4px solid var(--color-error)', marginBottom:20, display:'flex', alignItems:'center', gap:16 }}>
          <div className="animate-strobe" style={{ fontSize:32 }}>🚨</div>
          <div>
            <h3 className="text-error">{ins.criticalUnresolved} Critical Unresolved Reports</h3>
            <p className="body-sm text-secondary">These require immediate attention from field teams.</p>
          </div>
        </motion.div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Trending Categories */}
        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.1 }} style={{ padding:24 }}>
          <h3 style={{ marginBottom:16 }}>📊 Trending This Week</h3>
          {(ins.recentByCategory || []).map((cat, i) => (
            <div key={cat._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'10px 0', borderBottom: i < (ins.recentByCategory.length - 1) ? '1px solid var(--color-border)' : 'none' }}>
              <div>
                <p style={{ fontWeight:600, textTransform:'capitalize' }}>{cat._id}</p>
                <p className="micro text-muted">Avg urgency: {cat.avgUrgency?.toFixed(1)}</p>
              </div>
              <span className="text-primary-brand" style={{ fontWeight:800, fontSize:20 }}>{cat.count}</span>
            </div>
          ))}
        </motion.div>

        {/* Peak Reporting Hours */}
        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.2 }} style={{ padding:24 }}>
          <h3 style={{ marginBottom:16 }}>⏰ Peak Reporting Hours</h3>
          {(ins.peakHours || []).map((h) => {
            const hour = h._id;
            const label = hour < 12 ? `${hour || 12} AM` : `${hour === 12 ? 12 : hour - 12} PM`;
            const maxH = Math.max(...(ins.peakHours || []).map(p => p.count), 1);
            return (
              <div key={hour} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                <span style={{ width:60, fontSize:13, fontWeight:600 }}>{label}</span>
                <div style={{ flex:1, height:20, background:'var(--color-border)', borderRadius:10, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(h.count / maxH) * 100}%`, background:'var(--color-primary)',
                    borderRadius:10, transition:'width 0.8s' }} />
                </div>
                <span className="micro text-muted">{h.count}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Top Reporters */}
        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.3 }} style={{ padding:24, gridColumn:'1 / -1' }}>
          <h3 style={{ marginBottom:16 }}>🏅 Top Civic Champions</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
            {(ins.topReporters || []).map((r, i) => (
              <div key={r._id} className="glass-panel" style={{ padding:16, textAlign:'center', minWidth:140, flex:1 }}>
                <p style={{ fontSize:28, fontWeight:800, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--color-text-muted)' }}>
                  #{i + 1}
                </p>
                <p style={{ fontWeight:700, marginTop:4 }}>{r.name}</p>
                <p className="micro text-muted">Level {r.level} • {r.tier?.toUpperCase()}</p>
                <p className="text-primary-brand" style={{ fontWeight:700, marginTop:4 }}>{r.totalPointsEarned} XP</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        .admin-insights { max-width: 900px; }
        @media (max-width: 768px) { .admin-insights > div:last-of-type { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
