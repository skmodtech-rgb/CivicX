import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';
import api from '../services/api';

export default function Profile() {
  const { user, logout, fetchProfile } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [myComplaints, setMyComplaints] = useState([]);

  useEffect(() => {
    fetchProfile();
    api.get('/rewards/profile').then(r => setProfile(r.data.profile)).catch(() => {});
    api.get('/complaints/user/mine').then(r => setMyComplaints(r.data.complaints)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const p = profile || user || {};
  const tierColors = { bronze:'#CD7F32', silver:'#C0C0C0', gold:'#FFD700', platinum:'#E5E4E2' };

  return (
    <div className="profile-page">
      <motion.div className="card card-lg text-center" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:20 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg, var(--color-primary), #15803d)`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'#000', margin:'0 auto 12px' }}>
          {p.name?.charAt(0)?.toUpperCase() || 'C'}
        </div>
        <h2>{p.name}</h2>
        <p className="text-secondary body-sm">{p.email}</p>
        <p className="micro" style={{ marginTop: 8, color: tierColors[p.tier] }}>{p.tier?.toUpperCase()} TIER • Level {p.level}</p>
      </motion.div>

      {/* Stats Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        {[
          { label:'Total XP', value: p.totalPointsEarned || 0, icon:'⚡' },
          { label:'Available', value: p.points || 0, icon:'💎' },
          { label:'Reports', value: p.complaintsSubmitted || 0, icon:'📋' },
          { label:'Resolved', value: p.complaintsResolved || 0, icon:'✅' },
          { label:'Reputation', value: `${p.reputationScore || 0}/100`, icon:'🛡️' },
          { label:'Badges', value: p.badges?.length || 0, icon:'🎖️' }
        ].map((s, i) => (
          <motion.div key={s.label} className="glass-panel" initial={{ opacity:0, scale:0.9 }}
            animate={{ opacity:1, scale:1 }} transition={{ delay: i * 0.05 }} style={{ textAlign:'center', padding:16 }}>
            <div style={{ fontSize:24 }}>{s.icon}</div>
            <p style={{ fontWeight:800, fontSize:20, marginTop:4 }}>{s.value}</p>
            <p className="micro text-muted">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Level Progress */}
      {profile && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Level Progress</h3>
          <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${profile.progressToNextLevel}%` }} /></div>
          <p className="micro text-muted" style={{ marginTop: 6 }}>
            {profile.progressToNextLevel}% — {Math.abs(profile.pointsToNextLevel)} XP to Level {p.level + 1}
          </p>
        </div>
      )}

      {/* My Reports */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>My Reports ({myComplaints.length})</h3>
        {myComplaints.slice(0, 5).map((c) => (
          <div key={c._id} className="card" style={{ padding:14, marginBottom:8, cursor:'pointer' }}
            onClick={() => navigate(`/complaint/${c._id}`)}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <p style={{ fontWeight:600, fontSize:14 }}>{c.title}</p>
              <span className={`badge badge-${c.status}`} style={{ fontSize:10 }}>{c.status?.replace('_',' ')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Redeemed Vouchers */}
      {p.redeemedVouchers?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Redeemed Vouchers</h3>
          {p.redeemedVouchers.map((v, i) => (
            <div key={i} className="card" style={{ padding:12, marginBottom:8, display:'flex', justifyContent:'space-between' }}>
              <span>{v.voucherName}</span>
              <span className="micro text-muted">{v.pointsCost} pts</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-danger w-full" onClick={handleLogout}>🚪 Logout</button>
      <style>{`.profile-page { max-width: 500px; margin: 0 auto; }`}</style>
    </div>
  );
}
