import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store';
import api from '../services/api';

export default function Profile() {
  const { user, logout, fetchProfile } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [myComplaints, setMyComplaints] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', avatar: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
    api.get('/rewards/profile').then(r => {
      setProfile(r.data.profile);
      setEditForm({ name: r.data.profile.name, avatar: r.data.profile.avatar || '' });
    }).catch(() => {});
    api.get('/complaints/user/mine').then(r => setMyComplaints(r.data.complaints)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/auth/profile', editForm);
      await fetchProfile();
      const r = await api.get('/rewards/profile');
      setProfile(r.data.profile);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const p = profile || user || {};
  const tierColors = { bronze:'#CD7F32', silver:'#C0C0C0', gold:'#FFD700', platinum:'#E5E4E2' };

  return (
    <div className="profile-page">
      {/* Highlighted Activity Button */}
      <div style={{ marginBottom: 24 }}>
        <motion.button 
          className="premium-activity-btn"
          whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(30, 215, 96, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/activity')}
        >
          <div className="btn-glow"></div>
          <span className="btn-content">📊 View Activity & Leaderboard</span>
          <span className="btn-arrow">→</span>
        </motion.button>
      </div>

      {/* Main Profile Card */}
      <motion.div className="card card-lg text-center" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:20, position:'relative' }}>
        <button 
          className="settings-toggle" 
          onClick={() => setIsEditing(!isEditing)}
          title="Profile Settings"
        >
          {isEditing ? '✕' : '⚙️'}
        </button>

        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div key="view" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div className="profile-avatar-container" style={{ borderColor: tierColors[p.tier] }}>
                {p.avatar ? (
                  <img src={p.avatar} alt="Avatar" className="profile-img" />
                ) : (
                  <div className="profile-placeholder">
                    {p.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                )}
                <div className="tier-pill" style={{ background: tierColors[p.tier] }}>{p.tier}</div>
              </div>
              <h2 style={{ marginTop: 12 }}>{p.name}</h2>
              <p className="text-secondary body-sm">{p.email}</p>
              <p className="micro" style={{ marginTop: 8, opacity: 0.7 }}>Level {p.level} Citizen</p>
            </motion.div>
          ) : (
            <motion.form key="edit" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onSubmit={handleUpdateProfile} className="edit-form">
              <h3>Profile Settings</h3>
              <div className="form-group">
                <label className="micro">Display Name</label>
                <input 
                  className="input" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="micro">Avatar URL</label>
                <input 
                  className="input" 
                  placeholder="https://images..."
                  value={editForm.avatar} 
                  onChange={e => setEditForm({...editForm, avatar: e.target.value})}
                />
              </div>
              <div style={{ display:'flex', gap: 8, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary w-full" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
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

      {/* SOS Quick Settings */}
      <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#EF4444' }}>🚨 SOS & Safety</h3>
            <p className="micro text-muted">Manage your emergency contacts</p>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/emergency')}>Manage</button>
        </div>
      </div>

      <button className="btn btn-danger w-full" onClick={handleLogout} style={{ opacity: 0.8 }}>🚪 Logout</button>

      <style>{`
        .profile-page { max-width: 500px; margin: 0 auto; padding-bottom: 40px; }
        
        .premium-activity-btn {
          width: 100%; position: relative; overflow: hidden;
          background: linear-gradient(135deg, #1ED760, #1DB954);
          color: #000; border: none; padding: 16px 24px; border-radius: 16px;
          font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: space-between;
          cursor: pointer; box-shadow: 0 4px 15px rgba(30, 215, 96, 0.2);
        }
        .btn-glow {
          position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
          opacity: 0; transition: opacity 0.3s;
        }
        .premium-activity-btn:hover .btn-glow { opacity: 1; }
        .btn-arrow { font-size: 20px; transition: transform 0.3s; }
        .premium-activity-btn:hover .btn-arrow { transform: translateX(5px); }

        .settings-toggle {
          position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.05);
          border: 1px solid var(--color-border); width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10;
        }
        
        .profile-avatar-container {
          width: 80px; height: 80px; margin: 0 auto; position: relative;
          border-radius: 50%; border: 3px solid var(--color-primary); padding: 4px;
        }
        .profile-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .profile-placeholder {
          width: 100%; height: 100%; border-radius: 50%; background: #333;
          display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; color: white;
        }
        .tier-pill {
          position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
          font-size: 9px; font-weight: 900; color: #000; padding: 2px 8px; border-radius: 20px;
          white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .edit-form { text-align: left; padding: 10px; }
        .form-group { margin-bottom: 12px; }
        .form-group label { display: block; margin-bottom: 4px; opacity: 0.6; }
      `}</style>
    </div>
  );
}
