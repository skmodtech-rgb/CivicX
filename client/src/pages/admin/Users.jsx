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

  const tierColors = { bronze:'#CD7F32', silver:'#C0C0C0', gold:'#FFD700', platinum:'#E5E4E2' };

  if (loading) return <div className="text-center text-muted" style={{ padding:60 }}><div className="animate-spin" style={{ fontSize:32 }}>⚙️</div><p style={{ marginTop:12 }}>Loading Citizens...</p></div>;

  return (
    <div className="admin-users">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>👥 Citizen Directory</h1>
          <p className="text-secondary body-sm">Manage users and roles</p>
        </div>
        <div className="badge badge-primary">Total: {users.length}</div>
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
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleAwardPoints(u._id, u.name)}
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    🎁 Award
                  </button>
                </td>
              </motion.tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center' }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
