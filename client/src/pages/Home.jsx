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
              style={{ cursor: 'pointer', backgroundImage: `linear-gradient(to top, rgba(18,18,18,1) 0%, rgba(18,18,18,0.7) 50%, rgba(18,18,18,0.3) 100%), url(/categories/cat_${c.category || 'other'}.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              {c.aiAnalysis?.urgency_score >= 8 && (
                <div className="cc-critical-ribbon animate-strobe">CRITICAL</div>
              )}
              <div className="cc-content">
                <div className="cc-header">
                  <div className="cc-category">
                    <span>{categoryIcons[c.category] || '📌'}</span>
                    <span className="micro" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{c.category?.toUpperCase()}</span>
                  </div>
                  <span className={`badge badge-${c.status}`}>{c.status?.replace('_', ' ')}</span>
                </div>
                <h3 className="cc-title" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{c.title}</h3>
                <p className="body-sm text-secondary cc-desc" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', color: '#ddd' }}>{c.description?.substring(0, 100)}{c.description?.length > 100 ? '...' : ''}</p>
                <div className="cc-footer">
                  <span className="micro text-muted">by {c.user?.name || 'Anonymous'}</span>
                  <div className="cc-votes">
                    <span className="micro text-success">▲ {c.upvotes?.length || 0}</span>
                    <span className="micro text-error">▼ {c.downvotes?.length || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <style>{`
        .home-page { padding-bottom: 20px; }
        .stats-scroll { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 12px; 
          margin-bottom: 20px; 
        }
        
        .stat-card:nth-child(3) {
          grid-column: span 2;
        }

        @media (min-width: 768px) {
          .stats-scroll { grid-template-columns: repeat(3, 1fr); }
          .stat-card:nth-child(3) { grid-column: auto; }
        }

        .stat-card { padding: 16px; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        .stat-card h2 { font-size: 20px; margin: 4px 0; }
        .progress-bar { height: 6px; }
        
        .feed-list { 
          display: grid; 
          grid-template-columns: 1fr; 
          gap: 16px; 
        }
        
        @media (min-width: 768px) {
          .feed-list { grid-template-columns: repeat(2, 1fr); }
        }

        .complaint-card { position:relative; overflow:hidden; padding: 0; min-height: 200px; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.1); }
        .complaint-card:hover { transform:translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.6); border-color: var(--color-primary); }
        .cc-content { padding: 32px 16px 16px; display: flex; flex-direction: column; flex: 1; z-index: 2; position: relative; background: linear-gradient(to top, rgba(18,18,18,0.9) 0%, rgba(18,18,18,0.4) 60%, rgba(18,18,18,0.1) 100%); }
        .cc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .cc-category { display:flex; align-items:center; gap:6px; }
        .cc-title { margin-bottom:4px; font-size:16px; color: #fff; }
        .cc-desc { margin-bottom:12px; flex: 1; }
        .cc-footer { display:flex; justify-content:space-between; align-items:center; margin-top: auto; }
        .cc-votes { display:flex; gap:12px; }
        
        .cc-critical-ribbon { 
          position:absolute; 
          top: 0; 
          left: 0; 
          background: var(--color-error); 
          color: white; 
          font-size: 10px; 
          font-weight: 800; 
          padding: 4px 12px; 
          border-bottom-right-radius: 12px;
          z-index: 5;
        }
      `}</style>
    </div>
  );
}
