import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuthStore } from '../store';

export default function OfficialDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [resolution, setResolution] = useState({ description: '', proofImage: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
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

  if (loading) return <div className="text-center" style={{ padding: 40 }}>Loading assignments...</div>;

  return (
    <div className="official-dashboard-premium container">
      <header className="dashboard-header">
        <div className="header-text">
          <p className="micro text-primary-brand" style={{ fontWeight: 800 }}>{department.toUpperCase()} DEPARTMENT</p>
          <h1>Official Dashboard</h1>
          <p className="text-secondary">Manage and resolve civic assignments efficiently.</p>
        </div>
        <div className="header-stats">
          <div className="stat-card glass-panel">
            <span className="stat-icon">🕒</span>
            <div>
              <p className="stat-label">Pending</p>
              <p className="stat-value">{tasks.length}</p>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-icon">✅</span>
            <div>
              <p className="stat-label">Resolved</p>
              <p className="stat-value">--</p>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="content-header">
          <h2 className="section-title">Active Assignments</h2>
          <div className="filters">
            <span className="micro text-muted">Showing {tasks.length} tasks</span>
          </div>
        </div>

        <div className="task-list">
          <AnimatePresence>
            {tasks.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state-premium card card-lg">
                <div className="empty-icon">🎖️</div>
                <h3>All tasks completed!</h3>
                <p className="text-secondary">Your department is operating at 100% efficiency. Great job!</p>
              </motion.div>
            ) : (
              tasks.map((task, idx) => (
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
                    <p className="task-loc">📍 {task.location.address || 'Location provided'}</p>
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
                    <button className="btn btn-primary resolve-btn" onClick={() => setSelectedTask(task)}>
                      Resolve Task
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
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
        
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 48px; flex-wrap: wrap; gap: 24px; }
        .header-stats { display: flex; gap: 16px; }
        .stat-card { padding: 16px 24px; display: flex; align-items: center; gap: 16px; min-width: 180px; }
        .stat-icon { font-size: 24px; }
        .stat-label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 24px; font-weight: 800; }

        .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .section-title { font-size: 20px; font-weight: 800; }

        .task-list { display: flex; flexDirection: column; gap: 20px; }
        .task-premium-card { 
          display: flex; gap: 24px; padding: 24px; border-left: 6px solid #555;
          background: rgba(255,255,255,0.02); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .task-premium-card:hover { transform: translateX(8px); background: rgba(255,255,255,0.04); }
        .task-premium-card.critical { border-left-color: #EF4444; }
        .task-premium-card.high { border-left-color: #F97316; }
        .task-premium-card.medium { border-left-color: #EAB308; }
        .task-premium-card.low { border-left-color: #3B82F6; }

        .task-main-info { flex: 1; }
        .task-header-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
        .urgency-pill { font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 4px; color: #fff; }
        .urgency-pill.critical { background: #EF4444; }
        .urgency-pill.high { background: #F97316; }
        .urgency-pill.medium { background: #EAB308; }
        .urgency-pill.low { background: #3B82F6; }

        .task-title { font-size: 18px; font-weight: 800; margin-bottom: 6px; }
        .task-loc { font-size: 13px; color: var(--color-primary); font-weight: 600; margin-bottom: 12px; }
        .task-desc { font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 20px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        .task-meta { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 16px; }
        .user-mini { display: flex; align-items: center; gap: 8px; }
        .avatar-mini { width: 24px; height: 24px; background: var(--color-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }

        .task-actions-area { width: 220px; display: flex; flexDirection: column; gap: 16px; justify-content: space-between; }
        .task-previews { display: flex; gap: 8px; position: relative; }
        .preview-box { width: 70px; height: 70px; border-radius: 8px; overflow: hidden; }
        .preview-box img { width: 100%; height: 100%; object-fit: cover; }
        .preview-more { width: 30px; height: 70px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
        .resolve-btn { height: 48px; border-radius: 12px; font-weight: 800; }

        .modal-overlay-premium { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-content-premium { width: 100%; max-width: 560px; padding: 32px; border: 1px solid var(--color-border); position: relative; overflow: hidden; }
        .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .close-btn { background: none; border: none; font-size: 24px; color: var(--color-text-muted); cursor: pointer; }
        
        .form-group-premium { margin-bottom: 24px; }
        .label-text { display: block; font-size: 12px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 10px; }
        .input-premium { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--color-border); border-radius: 12px; padding: 16px; color: #fff; font-size: 15px; min-height: 120px; resize: none; transition: all 0.2s; }
        .input-premium:focus { border-color: var(--color-primary); background: rgba(255,255,255,0.05); outline: none; }
        
        .upload-zone-premium { min-height: 160px; border: 2px dashed var(--color-border); border-radius: 16px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); overflow: hidden; }
        .upload-btn-premium { width: 100%; height: 100%; padding: 40px; display: flex; flexDirection: column; align-items: center; cursor: pointer; }
        .upload-icon { font-size: 32px; margin-bottom: 12px; }
        .upload-text { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
        .upload-subtext { font-size: 12px; opacity: 0.5; }
        
        .proof-preview-container { position: relative; width: 100%; height: 200px; }
        .proof-preview-container img { width: 100%; height: 100%; object-fit: cover; }
        .remove-proof { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; background: rgba(0,0,0,0.6); border: none; border-radius: 50%; color: #fff; cursor: pointer; }

        .modal-footer-premium { display: flex; gap: 12px; margin-top: 32px; }
        .modal-footer-premium .btn { flex: 1; height: 52px; font-weight: 800; border-radius: 14px; }

        @media (max-width: 768px) {
          .task-premium-card { flexDirection: column; }
          .task-actions-area { width: 100%; }
          .dashboard-header { flexDirection: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
