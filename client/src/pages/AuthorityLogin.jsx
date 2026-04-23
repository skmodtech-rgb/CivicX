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
      <motion.div 
        className="authority-login-card"
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="auth-header">
          <div className="auth-icon-circle">🏛️</div>
          <h1>Authority <span className="text-primary-brand">Portal</span></h1>
          <p className="text-secondary">Official Government Login</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="label-text">Official Email</label>
            <input 
              type="email" 
              className="input-premium" 
              placeholder="officer@department.gov.in"
              value={email} 
              onChange={(e) => { setEmail(e.target.value); clearError(); }} 
              required 
            />
          </div>
          
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="label-text">Password</label>
            <input 
              type="password" 
              className="input-premium" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => { setPassword(e.target.value); clearError(); }} 
              required 
            />
          </div>

          {error && (
            <motion.div 
              className="error-box"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
               <p className="text-error">{error}</p>
            </motion.div>
          )}

          <button type="submit" className="btn btn-primary w-full portal-btn" disabled={loading}>
            {loading ? '⏳ Verifying Credentials...' : '🔐 Sign In to Terminal'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="text-muted">
            New department member? <Link to="/authority-register" className="text-primary-brand">Apply for Access</Link>
          </p>
          <Link to="/login" className="back-link">← Citizen Login Page</Link>
        </div>
      </motion.div>

      <style>{`
        .auth-page.authority-theme { 
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: radial-gradient(circle at 0% 0%, #1a1a1a 0%, #000 100%); 
        }
        
        .authority-login-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
        }

        .auth-header { text-align: center; margin-bottom: 40px; }
        .auth-icon-circle { 
          width: 72px; height: 72px; 
          background: rgba(30, 215, 96, 0.1); 
          border: 1px solid rgba(30, 215, 96, 0.3);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; margin: 0 auto 20px;
          box-shadow: 0 10px 20px rgba(30, 215, 96, 0.1);
        }

        .auth-header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
        .auth-header p { font-size: 15px; opacity: 0.7; }

        .form-group { display: flex; flex-direction: column; gap: 8px; width: 100%; }
        .label-text { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--color-text-muted); padding-left: 4px; text-align: left; }
        
        .input-premium {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 14px 18px;
          color: #fff;
          font-size: 15px;
          transition: all 0.2s;
        }
        .input-premium:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--color-primary);
          outline: none;
          box-shadow: 0 0 0 4px rgba(30, 215, 96, 0.1);
        }

        .error-box { margin-top: 16px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.2); }
        .text-error { font-size: 13px; margin: 0; text-align: center; }

        .portal-btn { margin-top: 32px; height: 52px; border-radius: 14px; font-weight: 800; font-size: 15px; }

        .auth-footer { margin-top: 32px; text-align: center; }
        .auth-footer p { font-size: 14px; margin-bottom: 16px; }
        .back-link { font-size: 12px; color: var(--color-text-muted); text-decoration: none; transition: color 0.2s; }
        .back-link:hover { color: #fff; }

        @media (max-width: 480px) {
          .authority-login-card { padding: 32px 24px; border-radius: 0; border: none; background: transparent; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
