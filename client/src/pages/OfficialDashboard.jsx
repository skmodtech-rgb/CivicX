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
    <div className="official-dashboard" style={{ paddingBottom: 100 }}>
      <header style={{ marginBottom: 32 }}>
        <h4 className="text-primary" style={{ marginBottom: 4 }}>Department: {department}</h4>
        <h1>📋 Official Task Force</h1>
        <p className="text-muted">Review and resolve issues assigned to your department.</p>
      </header>

      <div className="task-grid" style={{ display: 'grid', gap: 16 }}>
        {tasks.length === 0 ? (
          <div className="card text-center" style={{ padding: 60 }}>
            <p style={{ fontSize: 40 }}>✅</p>
            <h3>All caught up!</h3>
            <p className="text-muted">No pending tasks for your department.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <motion.div 
              key={task._id} 
              className="card task-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className={`badge badge-${task.urgency} micro`} style={{ marginBottom: 8 }}>{task.urgency.toUpperCase()}</span>
                  <h3 style={{ margin: '0 0 4px 0' }}>{task.title}</h3>
                  <p className="micro text-muted">📍 {task.location.address || 'Location provided'}</p>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setSelectedTask(task)}>Resolve</button>
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
                {task.images.map((img, i) => (
                  <img key={i} src={img} alt="issue" style={{ width: 80, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="card modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{ maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3>Resolve: {selectedTask.title}</h3>
                <button className="text-muted" onClick={() => setSelectedTask(null)} style={{ border: 'none', background: 'none', fontSize: 24 }}>✕</button>
              </div>

              <form onSubmit={handleSubmitResolution}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="micro">Work Description</label>
                  <textarea 
                    className="input" 
                    rows="4" 
                    placeholder="Describe the action taken..."
                    value={resolution.description}
                    onChange={e => setResolution({ ...resolution, description: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="micro">Resolution Proof (Photo Required)</label>
                  <div style={{ marginTop: 8 }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      id="proof-upload"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="proof-upload" className="btn btn-secondary w-full" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      📷 {resolution.proofImage ? 'Change Photo' : 'Upload Proof Photo'}
                    </label>
                  </div>
                  {resolution.proofImage && (
                    <img 
                      src={resolution.proofImage} 
                      alt="Proof" 
                      style={{ width: '100%', height: 200, borderRadius: 12, objectFit: 'cover', marginTop: 12 }} 
                    />
                  )}
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Mark as Resolved ✅'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8);
          backdrop-filter: blur(4px); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .task-card { padding: 20px; transition: border-color 0.2s; }
        .task-card:hover { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}
