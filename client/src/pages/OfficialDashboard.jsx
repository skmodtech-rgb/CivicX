import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuthStore } from '../store';

export default function OfficialDashboard() {
  const [activeTab, setActiveTab] = useState('assignments'); // assignments, high-priority, rewards, history
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [resolution, setResolution] = useState({ description: '', proofImage: '' });
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ user: {}, resolvedCount: 0 });
  const [history, setHistory] = useState([]);
  const [redemptions, setRedemptions] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchHistory();
    fetchRedemptions();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/official/tasks');
      setTasks(data.tasks);
      setDepartment(data.department);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/official/stats');
      setStats(data);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/official/history');
      setHistory(data.tasks);
    } catch {}
  };

  const fetchRedemptions = async () => {
    try {
      const { data } = await api.get('/rewards/my-redemptions');
      setRedemptions(data.redemptions);
    } catch {}
  };

  const handleRedeem = async (reward) => {
    if (stats.user.points < reward.points) return alert('Insufficient points!');
    if (!confirm(`Redeem ${reward.title} for ${reward.points} points?`)) return;

    try {
      await api.post('/rewards/redeem', { rewardId: reward.id });
      alert('Redemption successful! Check your Rewards History.');
      fetchStats();
      fetchRedemptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Redemption failed');
    }
  };


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolution({ ...resolution, proofImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolution.proofImage) return alert('Photo proof is required!');
    
    setSubmitting(true);
    try {
      await api.post(`/official/resolve/${selectedTask._id}`, resolution);
      alert('Task resolved successfully!');
      setSelectedTask(null);
      setResolution({ description: '', proofImage: '' });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit resolution');
    } finally {
      setSubmitting(false);
    }
  };

  const notifyManagement = async (task) => {
    try {
      const payload = {
        complaintId: task._id,
        userEmail: task.user?.email || 'No email provided',
        complaintText: task.description || task.title,
        category: task.category || department,
        priority: task.urgency,
        location: task.location?.address || 'Site Location'
      };

      const response = await fetch('https://cmpunktg12.app.n8n.cloud/webhook/send-complaint-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Update DB
        await api.patch(`/complaints/${task._id}/notify`);
        alert('📧 Notification sent to department and citizen via CivicX Automation!');
        fetchTasks();
      } else {
        alert('❌ Automation trigger failed.');
      }
    } catch (error) {
      console.error('Automation error:', error);
      alert('❌ Connection error.');
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'assignments':
      case 'high-priority':
        const filteredTasks = activeTab === 'high-priority' 
          ? tasks.filter(t => t.urgency === 'critical' || t.urgency === 'high')
          : tasks;

        return (
          <div className="task-list">
            <AnimatePresence mode="popLayout">
              {filteredTasks.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state-premium card card-lg">
                  <div className="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <h3>All tasks completed!</h3>
                  <p className="text-secondary">Great job maintaining your department efficiency.</p>
                </motion.div>
              ) : (
                filteredTasks.map((task, idx) => (
                  <motion.div 
                    key={task._id} 
                    className={`task-premium-card card ${task.urgency}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="task-main-info">
                      <div className="task-header-row">
                        <span className={`urgency-pill ${task.urgency}`}>{task.urgency.toUpperCase()}</span>
                        <span className="micro text-muted">#{task._id.slice(-6)}</span>
                      </div>
                      <h3 className="task-title">{task.title}</h3>
                      <p className="task-loc">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        {task.location.address || 'Location provided'}
                      </p>
                      <p className="task-desc">{task.description}</p>
                      
                      <div className="task-meta">
                        <div className="user-mini">
                          <span className="avatar-mini">{task.user?.name?.[0] || 'C'}</span>
                          <span className="micro text-muted">Reported by {task.user?.name} (Lv.{task.user?.level})</span>
                        </div>
                        <span className="micro text-muted">{new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="task-actions-area">
                      <div className="task-previews">
                        {task.images.slice(0, 2).map((img, i) => (
                          <div key={i} className="preview-box">
                            <img src={img} alt="issue" />
                          </div>
                        ))}
                        {task.images.length > 2 && <div className="preview-more">+{task.images.length - 2}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary" onClick={() => notifyManagement(task)} style={{ flex: 1, height: 44, borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                          Notify
                        </button>
                        <button className="btn btn-primary resolve-btn" onClick={() => setSelectedTask(task)} style={{ flex: 2 }}>Resolve Task</button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        );

      case 'rewards':
        const rewards = [
          { id: 'bonus_1', title: 'Performance Bonus', desc: 'Financial incentive for 500 tasks', points: 5000, icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
          { id: 'leave_1', title: 'Extra Leave Day', desc: '1 day additional paid leave', points: 3000, icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg> },
          { id: 'voucher_1', title: 'Amazon Gift Card', desc: '₹2000 shopping voucher', points: 2000, icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
          { id: 'medal_1', title: 'Honor Medal', desc: 'Profile badge & certificate', points: 1000, icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg> }
        ];

        return (
          <div className="rewards-section">
            <div className="reward-grid">
              {rewards.map(r => (
                <div key={r.id} className="card reward-card-premium">
                  <div className="reward-icon-lg" style={{ color: 'var(--color-primary)' }}>{r.icon}</div>
                  <h3>{r.title}</h3>
                  <p className="text-secondary micro">{r.desc}</p>
                  <div className="reward-footer">
                    <span className="points-tag">{r.points} XP</span>
                    <button className="btn btn-sm btn-primary" onClick={() => handleRedeem(r)}>Redeem</button>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ margin: '32px 0 16px' }}>Redemption History</h3>
            <div className="history-list">
              {redemptions.length === 0 ? (
                <p className="text-muted text-center card" style={{ padding: 24 }}>No rewards redeemed yet.</p>
              ) : (
                redemptions.map((red, i) => (
                  <div key={i} className="card history-item">
                    <span>{red.rewardTitle}</span>
                    <span className={`badge badge-${red.status}`}>{red.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="history-list">
            {history.length === 0 ? (
              <p className="text-muted text-center card" style={{ padding: 40 }}>No completed tasks in history.</p>
            ) : (
              history.map((h, i) => (
                <div key={i} className="card task-premium-card history-mode">
                  <div className="task-main-info">
                    <h3 className="task-title" style={{ fontSize: 16 }}>{h.title}</h3>
                    <p className="micro text-muted">Resolved on {new Date(h.resolvedAt).toLocaleDateString()}</p>
                    <p className="task-desc" style={{ fontSize: 12 }}>{h.officialResolution?.description}</p>
                  </div>
                  <div className="history-proof">
                    <img src={h.officialResolution?.imageUrl} alt="proof" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="text-center" style={{ padding: 40 }}>Loading assignments...</div>;

  return (
    <div className="official-dashboard-premium container">
      <header className="dashboard-header">
        <div className="header-text">
          <p className="micro text-primary-brand" style={{ fontWeight: 800 }}>{department?.toUpperCase() || 'CIVIC'} DEPARTMENT</p>
          <h1>Official Dashboard</h1>
          <p className="text-secondary">Track performance and resolve civic assignments.</p>
        </div>
        <div className="header-stats">
          <div className="stat-card glass-panel">
            <span className="stat-icon" style={{ color: 'var(--color-warning)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a.53.53 0 0 0 .4.288l5.165.752a.53.53 0 0 1 .293.904L17.363 12.6a.53.53 0 0 0-.152.47l.882 5.143a.53.53 0 0 1-.769.56l-4.62-2.43a.53.53 0 0 0-.494 0l-4.62 2.43a.53.53 0 0 1-.769-.56l.882-5.142a.53.53 0 0 0-.152-.47L3.084 8.916a.53.53 0 0 1 .293-.904l5.165-.752a.53.53 0 0 0 .4-.288l2.31-4.679z"/></svg>
            </span>
            <div>
              <p className="stat-label">Total XP</p>
              <p className="stat-value">{stats.user.points || 0}</p>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-icon" style={{ color: 'var(--color-success)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
            </span>
            <div>
              <p className="stat-label">Resolved</p>
              <p className="stat-value">{stats.resolvedCount}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="dashboard-nav">
        {[
          { id: 'assignments', label: 'Assignments', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>, count: tasks.length },
          { id: 'high-priority', label: 'High Priority', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>, count: tasks.filter(t => t.urgency === 'critical' || t.urgency === 'high').length },
          { id: 'rewards', label: 'Rewards', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>, count: null },
          { id: 'history', label: 'History', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, count: history.length }
        ].map(tab => (
          <button 
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== null && <span className="nav-count">{tab.count}</span>}
          </button>
        ))}
      </nav>
      
      <div className="dashboard-content">
        <div className="content-header">
          <h2 className="section-title">
            {activeTab === 'assignments' && 'Active Assignments'}
            {activeTab === 'high-priority' && 'High Priority Tasks'}
            {activeTab === 'rewards' && 'Rewards & Incentives'}
            {activeTab === 'history' && 'Completion History'}
          </h2>
        </div>

        {renderContent()}
      </div>


      {/* Resolution Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div className="modal-overlay-premium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content-premium card card-lg" initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}>
              <div className="modal-header">
                <div>
                  <h2 style={{ marginBottom: 4 }}>Submit Proof</h2>
                  <p className="text-secondary micro">Resolving: {selectedTask.title}</p>
                </div>
                <button className="close-btn" onClick={() => setSelectedTask(null)}>✕</button>
              </div>

              <form onSubmit={handleSubmitResolution} className="resolution-form">
                <div className="form-group-premium">
                  <label className="label-text">Detailed Action Taken</label>
                  <textarea 
                    className="input-premium" 
                    placeholder="Describe exactly what was fixed (e.g., Replaced 3 LED bulbs, fixed wiring at junction box X-12)..."
                    value={resolution.description}
                    onChange={e => setResolution({ ...resolution, description: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-premium">
                  <label className="label-text">After Photo (Photo Proof Required)</label>
                  <div className="upload-zone-premium">
                    {resolution.proofImage ? (
                      <div className="proof-preview-container">
                        <img src={resolution.proofImage} alt="Resolution Proof" />
                        <button type="button" className="remove-proof" onClick={() => setResolution({...resolution, proofImage:''})}>✕</button>
                      </div>
                    ) : (
                      <>
                        <input type="file" accept="image/*" onChange={handleFileChange} id="proof-upload" hidden />
                        <label htmlFor="proof-upload" className="upload-btn-premium">
                          <span className="upload-icon">📷</span>
                          <span className="upload-text">Upload Completion Proof</span>
                          <span className="upload-subtext">Click or drag a photo showing the resolved issue</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="modal-footer-premium">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedTask(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Processing...' : 'Verify & Resolve'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .official-dashboard-premium { padding: 40px 20px 100px; max-width: 1100px; margin: 0 auto; }
        
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 24px; }
        .header-stats { display: flex; gap: 16px; }
        .stat-card { padding: 16px 24px; display: flex; align-items: center; gap: 16px; min-width: 180px; }
        .stat-icon { font-size: 24px; }
        .stat-label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 24px; font-weight: 800; }

        .dashboard-nav { display: flex; gap: 12px; margin-bottom: 40px; overflow-x: auto; padding-bottom: 8px; }
        .nav-item { 
          min-width: 160px; height: 50px; 
          padding: 0 20px; border-radius: 14px; 
          background: var(--color-surface); border: 1px solid var(--color-border); 
          color: var(--color-text-muted); cursor: pointer; 
          white-space: nowrap; display: flex; align-items: center; justify-content: center;
          gap: 8px; transition: all 0.2s; font-weight: 700; font-size: 14px; 
        }
        .nav-item.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
        .nav-count { background: rgba(0,0,0,0.15); padding: 2px 8px; border-radius: 20px; font-size: 11px; }

        .reward-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        .reward-card-premium { text-align: center; padding: 24px; display: flex; flex-direction: column; align-items: center; }
        .reward-icon-lg { font-size: 40px; margin-bottom: 16px; }
        .reward-footer { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); }
        .points-tag { font-weight: 800; color: var(--color-primary); }

        .history-list { display: flex; flex-direction: column; gap: 12px; }
        .history-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; }
        .task-premium-card.history-mode { flex-direction: row; align-items: center; padding: 16px; }

        .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .section-title { font-size: 20px; font-weight: 800; }

        .task-list { display: flex; flex-direction: column; gap: 20px; }
        .task-premium-card.critical { border-left: 4px solid var(--color-error); }
        .task-premium-card.high { border-left: 4px solid #F97316; }
        .task-actions-area { width: 280px; display: flex; flex-direction: column; gap: 16px; justify-content: space-between; }
        
        @media (max-width: 768px) {
          .task-premium-card { flex-direction: column; }
          .task-actions-area { width: 100%; }
          .dashboard-header { flex-direction: column; align-items: flex-start; }
        }

      `}</style>
    </div>
  );
}
