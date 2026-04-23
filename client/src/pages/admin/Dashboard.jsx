import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => {
      setStats(r.data.stats);
      setCategoryData(r.data.categoryBreakdown);
      setTrend(r.data.dailyTrend);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-muted" style={{ padding:60 }}><div className="animate-spin" style={{ fontSize:32 }}>⚙️</div><p style={{ marginTop:12 }}>Loading Intelligence...</p></div>;

  const s = stats || {};
  const statCards = [
    { label:'Total Reports', value: s.totalComplaints, icon:'📋', color:'var(--color-text-primary)' },
    { label:'Pending', value: s.pending, icon:'⏳', color:'var(--color-warning)' },
    { label:'In Progress', value: (s.assigned||0)+(s.inProgress||0), icon:'🔄', color:'var(--color-info)' },
    { label:'Resolved', value: s.resolved, icon:'✅', color:'var(--color-success)' },
    { label:'Rejected', value: s.rejected, icon:'❌', color:'var(--color-error)' },
    { label:'Citizens', value: s.totalUsers, icon:'👥', color:'var(--color-primary)' },
    { label:'Avg Resolution', value: `${s.avgResolutionHours}h`, icon:'⏱️', color:'var(--color-info)' },
    { label:'Resolution Rate', value: `${s.resolutionRate}%`, icon:'📈', color:'var(--color-success)' }
  ];

  const maxCat = Math.max(...categoryData.map(c => c.count), 1);

  return (
    <div className="admin-dashboard">
      <h1 style={{ marginBottom: 4 }}>📊 Governance Terminal</h1>
      <p className="text-secondary body-sm" style={{ marginBottom: 28 }}>Real-time civic intelligence overview</p>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <motion.div key={card.label} className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: i * 0.05 }} style={{ padding:20, textAlign:'center' }}>
            <div style={{ fontSize:28 }}>{card.icon}</div>
            <p style={{ fontWeight:800, fontSize:28, color:card.color, marginTop:4 }}>{card.value ?? 0}</p>
            <p className="micro text-muted">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="card" style={{ marginTop: 24, padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Category Breakdown</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {categoryData.map((cat) => (
            <div key={cat._id} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ width:100, fontSize:13, fontWeight:600, textTransform:'capitalize' }}>{cat._id}</span>
              <div style={{ flex:1, height:24, background:'var(--color-border)', borderRadius:12, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(cat.count / maxCat) * 100}%`, background:'var(--color-primary)',
                  borderRadius:12, transition:'width 0.8s ease', display:'flex', alignItems:'center', paddingLeft:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#000' }}>{cat.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Trend */}
      {trend.length > 0 && (
        <div className="card" style={{ marginTop: 16, padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>7-Day Trend</h3>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120 }}>
            {trend.map((d) => {
              const maxT = Math.max(...trend.map(t => t.count), 1);
              const h = (d.count / maxT) * 100;
              return (
                <div key={d._id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <span className="micro text-muted">{d.count}</span>
                  <div style={{ width:'100%', height:`${h}%`, minHeight:4, background:'var(--color-primary)',
                    borderRadius:'6px 6px 0 0', transition:'height 0.5s ease' }} />
                  <span className="micro text-muted">{d._id.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .admin-dashboard { max-width: 900px; }
        .stats-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:12px; }
        @media (max-width:600px) { .stats-grid { grid-template-columns:1fr 1fr; } }
      `}</style>
    </div>
  );
}
