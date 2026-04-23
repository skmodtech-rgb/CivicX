import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function AdminAuthorities() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuthorities = () => {
    setLoading(true);
    api.get('/admin/users', { params: { role: 'official' } })
      .then(r => {
        setUsers(r.data.users);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAuthorities();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/approve`);
      alert('Official account approved!');
      fetchAuthorities();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  if (loading) return (
    <div className="text-center text-muted" style={{ padding:60 }}>
      <div className="animate-spin" style={{ fontSize:32 }}>🏛️</div>
      <p style={{ marginTop:12 }}>Loading Authority Records...</p>
    </div>
  );

  return (
    <div className="admin-authorities">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>🏛️ Authority Management</h1>
          <p className="text-secondary body-sm">Verify and manage government department officials</p>
        </div>
        <div className="badge badge-primary">Total: {users.length}</div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>OFFICIAL</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>DEPARTMENT</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>STATUS</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>JOINED</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr 
                key={u._id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div className="micro text-muted">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: 16 }}>
                  <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                    {u.department}
                  </span>
                </td>
                <td style={{ padding: 16 }}>
                  <span className={`micro ${u.isApproved ? 'text-success' : 'text-warning'}`} style={{ fontWeight: 800 }}>
                    {u.isApproved ? '● VERIFIED' : '● PENDING APPROVAL'}
                  </span>
                </td>
                <td style={{ padding: 16 }} className="micro text-muted">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  {!u.isApproved ? (
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={() => handleApprove(u._id)}
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      ✅ Approve Access
                    </button>
                  ) : (
                    <span className="micro text-muted">No Actions Required</span>
                  )}
                </td>
              </motion.tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center' }}>No authority applications found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
