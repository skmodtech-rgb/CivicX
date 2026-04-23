import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useComplaintStore } from '../store';

const tierColors = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2' };
const categoryIcons = { garbage:'🗑️', pothole:'🕳️', streetlight:'💡', water:'💧', sewage:'🚰', noise:'📢', encroachment:'🏗️', traffic:'🚦', electrical:'⚡', other:'📌' };

export default function Home() {
  const user = useAuthStore(s => s.user);
  const { complaints, loading, fetchComplaints } = useComplaintStore();
  const navigate = useNavigate();

  useEffect(() => { fetchComplaints({ limit: 15 }); }, []);

  const levelProgress = user ? ((user.totalPointsEarned % 500) / 500) * 100 : 0;

  return (
    <div className="home-page">
      {/* Hero Stats */}
      <div className="stats-scroll">
        <motion.div className="stat-card glass-panel" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
          <p className="micro text-muted">Reputation Points</p>
          <h2 className="text-primary-brand">{user?.points || 0}</h2>
          <p className="micro" style={{ color: tierColors[user?.tier] || '#CD7F32' }}>
            {user?.tier?.toUpperCase() || 'BRONZE'} TIER
          </p>
        </motion.div>
        <motion.div className="stat-card glass-panel" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}>
          <p className="micro text-muted">Level Progress</p>
          <h2>Level {user?.level || 1}</h2>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${levelProgress}%` }} />
          </div>
          <p className="micro text-muted" style={{ marginTop: 4 }}>{Math.round(levelProgress)}% to next</p>
        </motion.div>
        <motion.div className="stat-card glass-panel" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3 }}>
          <p className="micro text-muted">Reports Filed</p>
          <h2>{user?.complaintsSubmitted || 0}</h2>
          <p className="micro text-success">{user?.complaintsResolved || 0} Resolved</p>
        </motion.div>
      </div>

      {/* Feed Header */}
      <div className="feed-header" style={{ marginTop: 24, marginBottom: 16 }}>
        <h2>Nearby Issues</h2>
        <button className="btn btn-sm btn-ghost" onClick={() => fetchComplaints({ limit: 15 })}>
          ↻ Refresh
        </button>
      </div>

      {/* Complaints Feed */}
      {loading ? (
        <div className="text-center text-muted" style={{ padding: 40 }}>
          <div className="animate-spin" style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
          <p>Scanning Civic Infrastructure...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="card text-center" style={{ padding: 40 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏙️</p>
          <h3>All Clear!</h3>
          <p className="text-secondary" style={{ marginTop: 8 }}>No issues reported yet. Be the first civic hero.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/submit')}>
            Report an Issue
          </button>
        </div>
      ) : (
        <div className="feed-list">
          {complaints.map((c, i) => (
            <motion.div
              key={c._id}
              className="complaint-card card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/complaint/${c._id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="cc-header">
                <div className="cc-category">
                  <span>{categoryIcons[c.category] || '📌'}</span>
                  <span className="micro">{c.category?.toUpperCase()}</span>
                </div>
                <span className={`badge badge-${c.status}`}>{c.status?.replace('_', ' ')}</span>
              </div>
              <h3 className="cc-title">{c.title}</h3>
              <p className="body-sm text-secondary cc-desc">{c.description?.substring(0, 100)}{c.description?.length > 100 ? '...' : ''}</p>
              <div className="cc-footer">
                <span className="micro text-muted">by {c.user?.name || 'Anonymous'}</span>
                <div className="cc-votes">
                  <span className="micro text-success">▲ {c.upvotes?.length || 0}</span>
                  <span className="micro text-error">▼ {c.downvotes?.length || 0}</span>
                </div>
              </div>
              {c.aiAnalysis?.urgency_score >= 8 && (
                <div className="cc-critical animate-strobe">⚠️ CRITICAL</div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <style>{`
        .home-page { padding-bottom: 20px; }
        .stats-scroll { display:flex; gap:12px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; }
        .stats-scroll::-webkit-scrollbar { display:none; }
        .stat-card { min-width:160px; flex-shrink:0; }
        .feed-header { display:flex; justify-content:space-between; align-items:center; }
        .feed-list { display:flex; flex-direction:column; gap:12px; }
        .complaint-card { position:relative; overflow:hidden; }
        .complaint-card:hover { transform:translateY(-2px); box-shadow:var(--shadow-medium); }
        .cc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .cc-category { display:flex; align-items:center; gap:6px; }
        .cc-title { margin-bottom:4px; font-size:16px; }
        .cc-desc { margin-bottom:12px; }
        .cc-footer { display:flex; justify-content:space-between; align-items:center; }
        .cc-votes { display:flex; gap:12px; }
        .cc-critical { position:absolute; top:12px; right:12px; font-size:11px; font-weight:700; color:var(--color-error); }
      `}</style>
    </div>
  );
}
