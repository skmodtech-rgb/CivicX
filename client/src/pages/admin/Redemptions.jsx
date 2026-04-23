import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function AdminRedemptions() {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRedemptions = () => {
    api.get('/admin/redemptions')
      .then(r => {
        setRedemptions(r.data.redemptions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const handleUpdate = async (id, currentStatus) => {
    const newStatus = prompt('Enter new status (pending, processing, delivered):', currentStatus);
    if (!newStatus || !['pending', 'processing', 'delivered'].includes(newStatus)) return;

    let rewardCode = '';
    let notes = '';

    if (newStatus === 'delivered') {
      rewardCode = prompt('Enter Reward Code / Gift Card PIN (optional):', '');
      notes = prompt('Enter any notes for the user (optional):', 'Thank you for your civic contribution!');
    }

    setProcessingId(id);
    try {
      await api.put(`/admin/redemptions/${id}`, { status: newStatus, rewardCode, notes });
      fetchRedemptions();
    } catch (err) {
      alert('Failed to update redemption');
    }
    setProcessingId(null);
  };

  if (loading) return <div className="text-center text-muted" style={{ padding:60 }}><div className="animate-spin" style={{ fontSize:32 }}>⚙️</div><p style={{ marginTop:12 }}>Loading Redemptions...</p></div>;

  const pendingCount = redemptions.filter(r => r.status === 'pending').length;

  return (
    <div className="admin-redemptions">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>🎁 Reward Redemptions</h1>
          <p className="text-secondary body-sm">Process citizen reward claims</p>
        </div>
        <div className="badge badge-warning">{pendingCount} Pending</div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>CITIZEN</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>VOUCHER</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>COST</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>STATUS</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>DATE</th>
              <th style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600, textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {redemptions.map((r, i) => (
              <motion.tr 
                key={r._id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <td style={{ padding: 16 }}>
                  <div style={{ fontWeight: 600 }}>{r.user?.name || 'Unknown'}</div>
                  <div className="micro text-muted">{r.user?.email || 'N/A'}</div>
                </td>
                <td style={{ padding: 16, fontWeight: 600 }}>{r.voucherName}</td>
                <td style={{ padding: 16 }} className="text-primary-brand">{r.pointsCost} XP</td>
                <td style={{ padding: 16 }}>
                  <span className={`badge badge-${r.status === 'delivered' ? 'success' : r.status === 'processing' ? 'primary' : 'warning'}`}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: 16 }} className="micro text-muted">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={() => handleUpdate(r._id, r.status)}
                    disabled={processingId === r._id}
                  >
                    {processingId === r._id ? 'Updating...' : 'Manage'}
                  </button>
                  {r.rewardCode && <div className="micro text-muted" style={{ marginTop: 4 }}>Code Sent</div>}
                </td>
              </motion.tr>
            ))}
            {redemptions.length === 0 && (
              <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center' }}>No redemptions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
