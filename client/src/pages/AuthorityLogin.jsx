import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';

export default function AuthorityLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(email, password);
      if (res.user.role === 'official') navigate('/official');
      else if (res.user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch {}
  };

  return (
    <div className="auth-page authority-theme">
      <motion.div className="auth-card card card-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-header">
          <div className="auth-icon-circle">🏛️</div>
          <h1 style={{ fontSize: 28, marginTop: 16 }}>Authority <span className="text-primary-brand">Portal</span></h1>
          <p className="text-secondary" style={{ marginTop: 8 }}>Official Government Login</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="micro text-muted">Official Email</label>
            <input type="email" className="input" placeholder="name@dept.gov.in"
              value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} required />
          </div>
          <div className="form-group">
            <label className="micro text-muted">Password</label>
            <input type="password" className="input" placeholder="••••••••"
              value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} required />
          </div>

          {error && (
            <div className="error-box" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
               <p className="text-error" style={{ fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ height: 48 }}>
            {loading ? '⏳ Verifying...' : '🔐 Sign In to Portal'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }} className="text-muted">
          New department member? <Link to="/authority-register" className="text-primary-brand" style={{ fontWeight: 700 }}>Apply for Access</Link>
        </div>
        
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/login" className="micro text-muted">← Back to Citizen Login</Link>
        </div>
      </motion.div>

      <style>{`
        .auth-page.authority-theme { background: radial-gradient(circle at top right, #111, #000); }
        .auth-icon-circle { 
          width: 64px; height: 64px; background: rgba(30, 215, 96, 0.1); 
          border: 2px solid var(--color-primary); border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
