import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin/users', { params: { role: 'citizen' } })
      .then(r => {
        setUsers(r.data.users);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAwardPoints = async (userId, userName) => {
    const amount = prompt(`How many points to award to ${userName}?`);
    if (!amount || isNaN(amount)) return;

    try {
      const { data } = await api.post(`/admin/users/${userId}/award-points`, { amount });
      alert(data.message);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to award points');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE user "${userName}"? This action cannot be undone.`)) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      alert('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleAddUser = async () => {
    const name = prompt('Enter Name:');
    if (!name) return;
    const email = prompt('Enter Email:');
    if (!email) return;
    const password = prompt('Enter Password:');
    if (!password) return;

    try {
      await api.post('/admin/users', { name, email, password, role: 'citizen' });
      alert('Citizen added successfully.');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add user');
    }
  };

  const tierColors = { bronze:'#CD7F32', silver:'#C0C0C0', gold:'#FFD700', platinum:'#E5E4E2' };

  if (loading) return <div className="text-center text-muted" style={{ padding:60 }}><div className="animate-spin" style={{ fontSize:32 }}>⚙️</div><p style={{ marginTop:12 }}>Loading Citizens...</p></div>;

  return (
    <div className="admin-users">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>👥 Citizen Directory</h1>
          <p className="text-secondary body-sm">Manage users and roles</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleAddUser}>+ Add Citizen</button>
          <div className="badge badge-primary">Total: {users.length}</div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>USER</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>ROLE</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>STATS</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>TIER</th>
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
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: '1px solid var(--color-border)' }}>
                      {u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('data:image')) ? (
                        <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        u.avatar || '👤'
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{u.name}</div>
                      <div className="micro text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: 16 }}>
                  <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: 16 }}>
                  <div style={{ fontSize: 13 }}>Level {u.level}</div>
                  <div className="micro text-muted">{u.totalPointsEarned} XP • {u.complaintsSubmitted} Reports</div>
                </td>
                <td style={{ padding: 16, fontWeight: 600, color: tierColors[u.tier] || 'inherit' }}>
                  {u.tier.toUpperCase()}
                </td>
                <td style={{ padding: 16 }} className="micro text-muted">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleAwardPoints(u._id, u.name)}
                      style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"></path><path d="M2 7h20v5H2z"></path><path d="M12 22V7"></path><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                      Award
                    </button>
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleDeleteUser(u._id, u.name)}
                      style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      Delete
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center' }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
