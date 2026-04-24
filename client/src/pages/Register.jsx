import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/');
    } catch {}
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card card card-lg"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <img src="/CivicX_logo.png" alt="CivicX" className="no-dim" style={{ width: 72, height: 72, margin: '0 auto 12px', borderRadius: 16 }} />
          <h1 style={{ fontSize: 28 }}>Join CivicX<span className="text-primary-brand">AI</span></h1>
          <p className="text-secondary" style={{ marginTop: 8 }}>Become a Civic Intelligence Agent</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="micro text-muted">Full Name</label>
            <input id="register-name" type="text" className="input" placeholder="Your Name"
              value={name} onChange={(e) => { setName(e.target.value); clearError(); }} required />
          </div>
          <div className="form-group">
            <label className="micro text-muted">Email Address</label>
            <input id="register-email" type="email" className="input" placeholder="citizen@civicx.app"
              value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} required />
          </div>
          <div className="form-group">
            <label className="micro text-muted">Password</label>
            <input id="register-password" type="password" className="input" placeholder="Min. 6 characters"
              value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} required minLength={6} />
          </div>

          {error && <p className="text-error" style={{ fontSize: 13 }}>{error}</p>}

          <button id="register-submit" type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '🚀 Activate Civic ID'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }} className="text-muted">
          Already a citizen? <Link to="/login" className="text-primary-brand" style={{ fontWeight: 700 }}>Sign In</Link>
        </p>
      </motion.div>

      <style>{`
        .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:var(--color-bg-base); }
        .auth-card { width:100%; max-width:420px; }
        .auth-header { text-align:center; margin-bottom:32px; }
        .auth-form { display:flex; flex-direction:column; gap:20px; }
        .form-group { display:flex; flex-direction:column; gap:8px; }
      `}</style>
    </div>
  );
}

