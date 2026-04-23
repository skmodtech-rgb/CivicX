import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

const statusOptions = ['pending', 'assigned', 'in_progress', 'resolved', 'rejected'];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchAll = () => {
    setLoading(true);
    const params = {};
    if (filter.status) params.status = filter.status;
    if (filter.category) params.category = filter.category;
    api.get('/admin/complaints', { params }).then(r => {
      setComplaints(r.data.complaints);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [filter]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/admin/complaints/${id}`, { status });
      fetchAll();
    } catch {}
    setUpdating(null);
  };

  const notifyAuthority = async (complaint) => {
    try {
      const payload = {
        complaintId: complaint._id,
        userEmail: complaint.user?.email || 'citizen@civicx.com',
        complaintText: complaint.description || complaint.title,
        category: complaint.category,
        priority: complaint.urgency,
        location: complaint.location?.address || 'City Center'
      };

      const response = await fetch('https://cmpunktg12.app.n8n.cloud/webhook/send-complaint-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Update DB
        await api.patch(`/complaints/${complaint._id}/notify`);
        alert('📧 Authority notified and user confirmation sent via CivicX Automation!');
        fetchAll();
      } else {
        alert('❌ Failed to trigger automation.');
      }
    } catch (error) {
      console.error('Automation error:', error);
      alert('❌ Error connecting to automation server.');
    }
  };

  return (
    <div className="admin-complaints">
      <h1 style={{ marginBottom: 4 }}>📋 Complaint Management</h1>
      <p className="text-secondary body-sm" style={{ marginBottom: 24 }}>Review, assign, and resolve civic reports</p>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <select className="input" style={{ width:'auto', minWidth:140 }}
          value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value}))}>
          <option value="">All Status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
        </select>
        <select className="input" style={{ width:'auto', minWidth:140 }}
          value={filter.category} onChange={e => setFilter(f => ({...f, category: e.target.value}))}>
          <option value="">All Categories</option>
          {['garbage','pothole','streetlight','water','sewage','noise','encroachment','traffic','electrical','other']
            .map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
        </select>
        <button className="btn btn-sm btn-secondary" onClick={fetchAll}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="text-center text-muted" style={{ padding:40 }}>
          <div className="animate-spin" style={{ fontSize:24 }}>⚙️</div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="card text-center" style={{ padding:40 }}>
          <p className="text-secondary">No complaints match the current filters.</p>
        </div>
      ) : (
        <div className="complaints-table">
          {/* Table Header */}
          <div className="table-header">
            <span style={{ flex:2 }}>Report</span>
            <span style={{ flex:1 }}>Category</span>
            <span style={{ flex:1 }}>Urgency</span>
            <span style={{ flex:1 }}>AI Score</span>
            <span style={{ flex:1 }}>Status</span>
            <span style={{ flex:1 }}>Notify</span>
          </div>

          {complaints.map((c, i) => (
            <motion.div key={c._id} className="table-row card" initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay: i * 0.03 }} style={{ padding:14 }}>
              <div className="report-info" style={{ flex:2 }}>
                <p style={{ fontWeight:600, fontSize:14 }}>{c.title}</p>
                <p className="micro text-muted">{c.user?.name} • {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="data-cell" data-label="Category" style={{ flex:1 }}>
                <span className="micro" style={{ textTransform:'capitalize' }}>{c.category}</span>
              </div>
              <div className="data-cell" data-label="Status" style={{ flex:1 }}>
                <span className={`badge badge-${c.status}`} style={{ fontSize:10 }}>{c.status?.replace('_',' ')}</span>
              </div>
              <div className="data-cell" data-label="Urgency" style={{ flex:1 }}>
                <span className={`badge badge-${c.urgency}`}>{c.urgency}</span>
              </div>
              <div className="data-cell" data-label="AI Score" style={{ flex:1 }}>
                <span style={{ fontWeight:700, color: (c.aiAnalysis?.urgency_score||0) >= 8 ? 'var(--color-error)' :
                  (c.aiAnalysis?.urgency_score||0) >= 5 ? '#F97316' : 'var(--color-success)' }}>
                  {c.aiAnalysis?.urgency_score || '-'}/10
                </span>
              </div>
              <div className="data-cell" data-label="Status" style={{ flex:1 }}>
                <select className="input" style={{ padding:'6px 8px', fontSize:11, minWidth:90 }}
                  value={c.status}
                  disabled={updating === c._id}
                  onChange={e => updateStatus(c._id, e.target.value)}>
                  {statusOptions.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
              <div className="data-cell" data-label="Notify" style={{ flex:1 }}>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => notifyAuthority(c)}
                  style={{ padding:'6px 10px', fontSize:10, background:'var(--color-primary)', border:'none' }}
                >
                  ✉️ Notify
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <style>{`
        .admin-complaints { max-width: 1100px; }
        .complaints-table { display:flex; flex-direction:column; gap:8px; }
        .table-header { display:flex; padding:12px 14px; gap:12px; }
        .table-header span { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--color-text-muted); }
        .table-row { display:flex; align-items:center; gap:12px; border-radius:var(--radius-input); }
        
        @media (max-width:768px) {
          .table-header { display:none; }
          .table-row { flex-direction: column; align-items: stretch; gap: 10px; padding: 16px !important; }
          .report-info { border-bottom: 1px solid var(--color-border); padding-bottom: 10px; margin-bottom: 5px; }
          .data-cell { display: flex; justify-content: space-between; align-items: center; }
          .data-cell::before {
            content: attr(data-label);
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--color-text-muted);
          }
          .data-cell > span { flex: unset; }
          .data-cell select { width: 140px; }
        }
      `}</style>
    </div>
  );
}
