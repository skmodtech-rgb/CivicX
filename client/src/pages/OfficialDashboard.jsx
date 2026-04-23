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

  const notifyManagement = async (task) => {
    try {
      const payload = {
        complaintId: task._id,
        userEmail: task.user?.email || 'citizen@civicx.com',
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
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => notifyManagement(task)}
                          style={{ flex: 1, height: 48, borderRadius: 12, fontSize: 13 }}
                        >
                          ✉️ Notify
                        </button>
                        <button 
                          className="btn btn-primary resolve-btn" 
                          onClick={() => setSelectedTask(task)}
                          style={{ flex: 2 }}
                        >
                          Resolve Task
                        </button>
                      </div>
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

        .task-premium-card.low { border-left-color: #3B82F6; }

        .task-list { display: flex; flex-direction: column; gap: 20px; }
        .task-actions-area { width: 280px; display: flex; flex-direction: column; gap: 16px; justify-content: space-between; }
        .upload-btn-premium { width: 100%; height: 100%; padding: 40px; display: flex; flex-direction: column; align-items: center; cursor: pointer; }
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
