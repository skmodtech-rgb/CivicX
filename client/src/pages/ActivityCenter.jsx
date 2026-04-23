import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store';

export default function ActivityCenter() {
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'global'
  const [myData, setMyData] = useState(null);
  const [globalData, setGlobalData] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my') {
        const res = await api.get('/activity/me');
        setMyData(res.data);
      } else {
        const [gRes, lRes] = await Promise.all([
          api.get('/activity/global'),
          api.get('/rewards/leaderboard')
        ]);
        setGlobalData(gRes.data);
        setLeaderboard(lRes.data.leaderboard);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const tierColors = { bronze:'#CD7F32', silver:'#C0C0C0', gold:'#FFD700', platinum:'#E5E4E2' };

  return (
    <div className="activity-center">
      {/* Premium Header Switcher */}
      <div className="tab-switcher-container">
        <div className="tab-switcher">
          <button 
            className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            📊 My Activity
          </button>
          <button 
            className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            🌍 Global Activity
          </button>
          <motion.div 
            className="tab-indicator"
            animate={{ x: activeTab === 'my' ? '0%' : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="loading-shimmer-container"
          >
            <div className="shimmer-card"></div>
            <div className="shimmer-card"></div>
          </motion.div>
        ) : activeTab === 'my' ? (
          <motion.div 
            key="my-activity"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="tab-content"
          >
            {/* Stats Overview */}
            <div className="stats-grid-premium">
              <div className="main-stats-card card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p className="micro text-muted">Total Points</p>
                    <h1 className="stats-value">💎 {myData?.stats.totalPoints || 0}</h1>
                  </div>
                  <div className="badge-tier" style={{ background: tierColors[myData?.stats.tier] }}>
                    {myData?.stats.tier.toUpperCase()}
                  </div>
                </div>
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="micro">Level {myData?.stats.level}</span>
                    <span className="micro text-muted">Next: Level {myData?.stats.level + 1}</span>
                  </div>
                  <div className="progress-bar-premium">
                    <motion.div 
                      className="progress-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${(myData?.stats.totalPoints % 500) / 5}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mini-stats-grid">
                <div className="card mini-card">
                  <p className="micro text-muted">Reports</p>
                  <h3>📋 {myData?.stats.complaintsCount}</h3>
                </div>
                <div className="card mini-card">
                  <p className="micro text-muted">Resolution</p>
                  <h3>✅ {myData?.stats.resolutionRate}%</h3>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="feed-section">
              <h2 className="label" style={{ marginBottom: 20 }}>Personal History</h2>
              {myData?.feed.length === 0 ? (
                <div className="empty-state card">
                  <p style={{ fontSize: 40 }}>📭</p>
                  <h3>No activity yet</h3>
                  <button className="btn btn-primary" onClick={() => navigate('/submit')} style={{ marginTop: 16 }}>Report an Issue</button>
                </div>
              ) : (
                <div className="feed-list">
                  {myData?.feed.map((item, i) => (
                    <motion.div 
                      key={item.id} 
                      className="feed-item card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className={`feed-icon ${item.type}`}>
                        {item.type === 'complaint' ? '📋' : item.type === 'resolution' ? '✅' : item.type === 'badge' ? '🎖️' : '🎁'}
                      </div>
                      <div className="feed-info">
                        <p className="feed-title">{item.title}</p>
                        <p className="micro text-muted">{new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {item.points !== undefined && (
                        <div className={`feed-points ${item.points > 0 ? 'plus' : 'minus'}`}>
                          {item.points > 0 ? `+${item.points}` : item.points}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="global-activity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="tab-content"
          >
            {/* Global Feed + Leaderboard Layout */}
            <div className="global-layout">
              <section className="latest-reports">
                <h2 className="label" style={{ marginBottom: 16 }}>Latest Worldwide</h2>
                {globalData.length === 0 ? (
                  <div className="empty-state card">
                    <p style={{ fontSize: 40 }}>🌍</p>
                    <h3>No global reports</h3>
                    <button className="btn btn-primary" onClick={() => navigate('/submit')} style={{ marginTop: 16 }}>Be the first to report</button>
                  </div>
                ) : (
                  <div className="global-list">
                    {globalData.map((report, i) => (
                      <motion.div 
                        key={report._id} 
                        className="report-card card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => navigate(`/complaint/${report._id}`)}
                      >
                        <div className="r-header">
                          <span className="r-avatar" style={{ background: tierColors[report.user?.tier || 'bronze'] }}>
                            {report.user?.name?.[0] || 'C'}
                          </span>
                          <div>
                            <p className="r-user">{report.user?.name} <span className="micro text-muted">Lv.{report.user?.level}</span></p>
                            <p className="micro text-muted">{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <span className={`badge badge-${report.status} micro`} style={{ marginLeft: 'auto' }}>{report.status.toUpperCase()}</span>
                        </div>
                        <h4 className="r-title">{report.title}</h4>
                        <p className="r-ai micro">🤖 {report.aiAnalysis?.summary || 'Complaint processing...'}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              <aside className="leaderboard-section">
                <h2 className="label" style={{ marginBottom: 16 }}>Global Leaderboard</h2>
                <div className="leaderboard-card card">
                  {leaderboard.map((leader, i) => (
                    <div 
                      key={leader._id} 
                      className={`leader-row ${leader._id === user._id ? 'is-me' : ''}`}
                    >
                      <div className="l-rank">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </div>
                      <div className="l-avatar" style={{ background: tierColors[leader.tier] }}>
                        {leader.name[0]}
                      </div>
                      <div className="l-info">
                        <p className="l-name">{leader.name}</p>
                        <p className="micro text-muted">Level {leader.level}</p>
                      </div>
                      <div className="l-pts">
                        {leader.totalPointsEarned}
                      </div>
                    </div>
                  ))}
                  {/* If user not in top 20, show position - mocked for now */}
                  {!leaderboard.find(l => l._id === user._id) && (
                    <div className="my-rank-footer">
                      <p className="micro">Your Position: #42</p>
                      <button className="text-primary micro" onClick={() => navigate('/submit')}>Climb the ranks →</button>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .activity-center { max-width: 900px; margin: 0 auto; padding-bottom: 100px; }
        
        .tab-switcher-container { display: flex; justify-content: center; margin-bottom: 32px; }
        .tab-switcher { 
          display: flex; background: var(--color-surface); border: 1px solid var(--color-border); 
          border-radius: 40px; padding: 4px; position: relative; width: 340px;
        }
        .tab-btn { 
          flex: 1; border: none; background: transparent; padding: 10px; font-size: 14px; font-weight: 700; 
          color: var(--color-text-secondary); cursor: pointer; position: relative; z-index: 2; transition: color 0.3s;
        }
        .tab-btn.active { color: #000; }
        .tab-indicator { 
          position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px);
          background: var(--color-primary); border-radius: 40px; z-index: 1;
        }

        .stats-grid-premium { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; margin-bottom: 32px; }
        .main-stats-card { padding: 24px; position: relative; overflow: hidden; }
        .main-stats-card::after { content:''; position:absolute; top:-20px; right:-20px; width:100px; height:100px; background:var(--color-primary); opacity:0.1; filter:blur(40px); border-radius:50%; }
        .stats-value { font-size: 32px; font-weight: 900; margin-top: 8px; }
        .badge-tier { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 6px; color: #000; }
        .progress-bar-premium { height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--color-primary); box-shadow: 0 0 10px rgba(30,215,96,0.3); }
        .mini-stats-grid { display: grid; gap: 12px; }
        .mini-card { padding: 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; }

        .feed-list { display: flex; flex-direction: column; gap: 12px; }
        .feed-item { display: flex; align-items: center; gap: 16px; padding: 14px 20px; transition: transform 0.2s; }
        .feed-item:hover { transform: scale(1.01); border-color: var(--color-primary); }
        .feed-icon { width: 44px; height: 44px; border-radius: 14px; background: var(--color-border); display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .feed-icon.badge { background: rgba(234, 179, 8, 0.1); }
        .feed-icon.resolution { background: rgba(34, 197, 94, 0.1); }
        .feed-info { flex: 1; }
        .feed-title { font-weight: 700; font-size: 15px; }
        .feed-points { font-weight: 800; font-size: 14px; }
        .feed-points.plus { color: #22C55E; }
        .feed-points.minus { color: #EF4444; }

        .global-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
        .report-card { padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s; }
        .report-card:hover { border-color: var(--color-primary); background: rgba(255,255,255,0.02); }
        .r-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .r-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #000; font-size: 12px; }
        .r-user { font-size: 13px; font-weight: 700; }
        .r-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .r-ai { opacity: 0.6; line-height: 1.4; font-style: italic; }

        .leaderboard-card { padding: 8px; }
        .leader-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; transition: all 0.2s; }
        .leader-row:hover { background: rgba(255,255,255,0.03); }
        .leader-row.is-me { background: rgba(30, 215, 96, 0.05); border: 1px solid rgba(30, 215, 96, 0.2); }
        .l-rank { width: 24px; font-weight: 800; font-size: 12px; opacity: 0.6; }
        .l-avatar { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #000; }
        .l-info { flex: 1; }
        .l-name { font-size: 13px; font-weight: 700; }
        .l-pts { font-weight: 900; font-size: 14px; color: var(--color-primary); }
        .my-rank-footer { margin-top: 12px; padding: 12px; border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }

        .shimmer-card { height: 120px; background: var(--color-surface); border-radius: 20px; margin-bottom: 16px; position: relative; overflow: hidden; }
        .shimmer-card::after { content:''; position:absolute; inset:0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

        @media (max-width: 768px) {
          .stats-grid-premium, .global-layout { grid-template-columns: 1fr; }
          .leaderboard-section { order: -1; margin-bottom: 24px; }
        }
      `}</style>
    </div>
  );
}
