import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';
import api from '../services/api';

export default function Rewards() {
  const user = useAuthStore(s => s.user);
  const fetchProfile = useAuthStore(s => s.fetchProfile);
  const [vouchers, setVouchers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [redeeming, setRedeeming] = useState(null);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('vouchers');

  const fetchRedemptions = () => {
    api.get('/rewards/redemptions').then(r => setRedemptions(r.data.redemptions)).catch(() => {});
  };

  useEffect(() => {
    api.get('/rewards/vouchers').then(r => setVouchers(r.data.vouchers)).catch(() => {});
    api.get('/rewards/leaderboard').then(r => setLeaderboard(r.data.leaderboard)).catch(() => {});
    fetchRedemptions();
  }, []);

  const handleRedeem = async (id) => {
    setRedeeming(id); setMessage('');
    try {
      const { data } = await api.post('/rewards/redeem', { voucherId: id });
      setMessage(`✅ ${data.message}`);
      fetchProfile();
      fetchRedemptions();
      setTab('status'); // Auto switch to status tab so they see it pending
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Failed'}`);
    }
    setRedeeming(null);
  };

  const tierColors = { bronze:'#CD7F32', silver:'#C0C0C0', gold:'#FFD700', platinum:'#E5E4E2' };

  return (
    <div className="rewards-page">
      <h1 style={{ marginBottom: 4 }}>🏆 Rewards Hub</h1>
      <p className="text-secondary body-sm" style={{ marginBottom: 24 }}>Your civic duty earns real rewards</p>

      {/* Points Banner */}
      <motion.div className="glass-panel" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <p className="micro text-muted">Available Points</p>
          <h2 className="text-primary-brand" style={{ fontSize:32 }}>{user?.points || 0}</h2>
        </div>
        <div style={{ textAlign:'right' }}>
          <p className="micro" style={{ color: tierColors[user?.tier] }}>{user?.tier?.toUpperCase()} TIER</p>
          <p className="micro text-muted">Level {user?.level}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, overflowX: 'auto', paddingBottom: 4 }} className="filter-scroll">
        <button className={`btn btn-sm ${tab === 'vouchers' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('vouchers')}>Vouchers</button>
        <button className={`btn btn-sm ${tab === 'status' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('status')}>Status</button>
        <button className={`btn btn-sm ${tab === 'badges' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('badges')}>Badges</button>
        <button className={`btn btn-sm ${tab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('leaderboard')}>Leaderboard</button>
      </div>

      {message && <div className="card" style={{ padding: 12, marginBottom: 16, fontSize: 14 }}>{message}</div>}

      {/* Vouchers Tab */}
      {tab === 'vouchers' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {vouchers.map((v, i) => (
            <motion.div key={v.id} className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.05 }} style={{ padding:16 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>{v.icon}</div>
              <h3 style={{ fontSize:14, marginBottom:4 }}>{v.name}</h3>
              <p className="micro text-muted" style={{ marginBottom:12 }}>{v.brand}</p>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className="text-primary-brand" style={{ fontWeight:700 }}>{v.cost} pts</span>
                <button className="btn btn-sm btn-primary" disabled={redeeming === v.id || (user?.points || 0) < v.cost}
                  onClick={() => handleRedeem(v.id)}>
                  {redeeming === v.id ? '...' : 'Redeem'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Status (Redemptions) Tab */}
      {tab === 'status' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {redemptions.length === 0 ? (
            <div className="card w-full text-center" style={{ padding:40 }}>
              <p style={{ fontSize:40 }}>📦</p>
              <p className="text-secondary" style={{ marginTop:8 }}>You haven't redeemed any rewards yet.</p>
            </div>
          ) : redemptions.map((r, i) => (
            <motion.div key={r._id} className="card" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
              transition={{ delay: i * 0.05 }} style={{ padding:16, display:'flex', flexDirection:'column', gap: 8 }}>
              
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontSize: 16 }}>{r.voucherName}</h3>
                <span className={`badge badge-${r.status === 'delivered' ? 'success' : r.status === 'processing' ? 'primary' : 'info'}`}>
                  {r.status.toUpperCase()}
                </span>
              </div>
              
              <p className="micro text-muted">Redeemed on: {new Date(r.createdAt).toLocaleDateString()}</p>
              
              {r.status === 'delivered' && r.rewardCode && (
                <div style={{ background: 'var(--color-surface)', padding: 12, borderRadius: 8, marginTop: 4, border: '1px dashed var(--color-primary)' }}>
                  <p className="micro text-muted" style={{ marginBottom: 4 }}>Your Reward Code:</p>
                  <p style={{ fontSize: 18, fontWeight: 'bold', letterSpacing: 2, userSelect: 'all' }}>{r.rewardCode}</p>
                </div>
              )}
              {r.notes && (
                <p className="micro text-muted" style={{ marginTop: 4 }}>Note: {r.notes}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Badges Tab */}
      {tab === 'badges' && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
          {(user?.badges || []).length === 0 ? (
            <div className="card w-full text-center" style={{ padding:40 }}>
              <p style={{ fontSize:40 }}>🎖️</p>
              <p className="text-secondary" style={{ marginTop:8 }}>Submit reports to earn badges!</p>
            </div>
          ) : user.badges.map((b, i) => (
            <motion.div key={i} className="card" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              transition={{ delay: i * 0.1 }} style={{ padding:20, textAlign:'center', minWidth:120 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>{b.icon}</div>
              <p style={{ fontWeight:700, fontSize:13 }}>{b.name}</p>
              <p className="micro text-muted">{new Date(b.earnedAt).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {leaderboard.map((l, i) => (
            <motion.div key={l._id} className="card" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
              transition={{ delay: i * 0.05 }} style={{ padding:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontWeight:800, fontSize:18, width:28, color: i < 3 ? tierColors.gold : 'var(--color-text-muted)' }}>#{i + 1}</span>
                <div>
                  <p style={{ fontWeight:600 }}>{l.name}</p>
                  <p className="micro text-muted">Level {l.level} • {l.tier?.toUpperCase()}</p>
                </div>
              </div>
              <span className="text-primary-brand" style={{ fontWeight:700 }}>{l.totalPointsEarned} XP</span>
            </motion.div>
          ))}
        </div>
      )}

      <style>{`.rewards-page { max-width: 560px; margin: 0 auto; }`}</style>
    </div>
  );
}
