import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
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
          <img src="/CivicX_logo.png" alt="CivicX AI" className="no-dim" style={{ width: 72, height: 72, margin: '0 auto 12px', borderRadius: 16 }} />
          <h1 style={{ fontSize: 28 }}>CivicX<span className="text-primary-brand">AI</span></h1>
          <p className="text-secondary" style={{ marginTop: 8 }}>Governance, Reimagined through Intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="micro text-muted">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="input"
              placeholder="citizen@civicx.app"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              required
            />
          </div>
          <div className="form-group">
            <label className="micro text-muted">Password</label>
            <input
              id="login-password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              required
            />
          </div>

          {error && <p className="text-error" style={{ fontSize: 13 }}>{error}</p>}

          <button id="login-submit" type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? '⏳ Authenticating...' : '🔐 Access Terminal'}
          </button>
        </form>

        <p className="auth-footer text-muted" style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }}>
          New citizen? <Link to="/register" className="text-primary-brand" style={{ fontWeight: 700 }}>Create Account</Link>
        </p>
      </motion.div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: var(--color-bg-base);
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
