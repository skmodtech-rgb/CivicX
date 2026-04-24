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

  const updateDept = async (id, dept) => {
    setUpdating(id);
    try {
      await api.put(`/admin/complaints/${id}`, { department: dept });
      fetchAll();
    } catch {}
    setUpdating(null);
  };

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
        userEmail: complaint.user?.email || 'No email provided',
        complaintText: complaint.description || complaint.title,
        category: complaint.category,
        priority: complaint.urgency,
        department: complaint.department, // Added department
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
        alert(`📧 Notified ${complaint.department} and sent confirmation to citizen!`);
        fetchAll();
      } else {
        alert('❌ Failed to trigger automation.');
      }
    } catch (error) {
      console.error('Automation error:', error);
      alert('❌ Error connecting to automation server.');
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE report: "${title}"?`)) return;

    setUpdating(id);
    try {
      await api.delete(`/admin/complaints/${id}`);
      alert('Report deleted successfully.');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
    setUpdating(null);
  };

  const deptOptions = ['Municipal Board', 'Public Works', 'Electricity Board', 'Traffic Police', 'Police Department', 'Fire Department', 'Other'];

  return (
    <div className="admin-complaints">
      <h1 style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
        Complaint Management
      </h1>
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
          {['garbage', 'water', 'pothole', 'streetlight', 'sewage', 'traffic', 'electricity', 'noise', 'encroachment', 'police', 'fire', 'other']
            .map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
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
            <span style={{ flex:1.2 }}>Department</span>
            <span style={{ flex:0.8 }}>Urgency</span>
            <span style={{ flex:1 }}>Status</span>
            <span style={{ flex:1.2, textAlign: 'right' }}>Actions</span>
          </div>

          {complaints.map((c, i) => (
            <motion.div key={c._id} className="table-row card" initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ delay: i * 0.03 }} style={{ padding:14 }}>
              <div className="report-info" style={{ flex:2 }}>
                <p style={{ fontWeight:600, fontSize:14 }}>{c.title}</p>
                <p className="micro text-muted">{c.user?.name} • {c.category.toUpperCase()} • {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="data-cell" data-label="Dept" style={{ flex:1.2 }}>
                <select className="input" style={{ padding:'6px 8px', fontSize:11, width:'100%' }}
                  value={c.department}
                  disabled={updating === c._id}
                  onChange={e => updateDept(c._id, e.target.value)}>
                  {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="data-cell" data-label="Urgency" style={{ flex:0.8 }}>
                <span className={`badge badge-${c.urgency}`} style={{ fontSize:10 }}>{c.urgency}</span>
              </div>
              <div className="data-cell" data-label="Status" style={{ flex:1 }}>
                <select className="input" style={{ padding:'6px 8px', fontSize:11, width:'100%' }}
                  value={c.status}
                  disabled={updating === c._id}
                  onChange={e => updateStatus(c._id, e.target.value)}>
                  {statusOptions.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
              <div className="data-cell" style={{ flex:1.2, textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-sm"
                  onClick={() => notifyAuthority(c)}
                  style={{ padding:'6px 10px', fontSize:10, background:'var(--color-primary)', border:'none', color: '#000', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  Notify
                </button>
                <button 
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleDelete(c._id, c.title)}
                  style={{ padding:'6px 10px', fontSize:10, color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  disabled={updating === c._id}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
}

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
