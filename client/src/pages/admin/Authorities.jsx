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

  const handleAddOfficial = async () => {
    const name = prompt('Enter Official Name:');
    if (!name) return;
    const email = prompt('Enter Official Email:');
    if (!email) return;
    const password = prompt('Enter Password:');
    if (!password) return;
    const department = prompt('Enter Department (e.g. Traffic Police, Municipal Board):');
    if (!department) return;

    try {
      await api.post('/admin/users', { name, email, password, role: 'official', department });
      alert('Official added successfully.');
      fetchAuthorities();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add official');
    }
  };

  const handleDeleteOfficial = async (userId, userName) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE official "${userName}"?`)) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      alert('Official deleted successfully.');
      fetchAuthorities();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete official');
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleAddOfficial}>+ Add Official</button>
          <div className="badge badge-primary">Total: {users.length}</div>
        </div>
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
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                      {u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('data:image')) ? (
                        <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{u.name}</div>
                      <div className="micro text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{u.email}</div>
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
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {!u.isApproved && (
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleApprove(u._id)}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        ✅ Approve
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleDeleteOfficial(u._id, u.name)}
                      style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--color-error)' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
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
