import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';

export default function AuthorityRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const departments = [
    'Waste Management',
    'Public Works',
    'Electricity Board',
    'Water & Sewage',
    'Traffic Police',
    'Police / Environment',
    'Health & Safety'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!department) return alert('Please select your department');
    
    try {
      await register(name, email, password, 'official', department);
      setSubmitted(true);
    } catch {}
  };

  if (submitted) {
    return (
      <div className="auth-page authority-theme">
        <motion.div className="auth-card card card-lg text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>⏳</div>
          <h2 style={{ marginBottom: 12 }}>Application Submitted</h2>
          <p className="text-secondary" style={{ lineHeight: 1.6, marginBottom: 24 }}>
            Your official account for the <strong>{department}</strong> has been created successfully. 
            However, it requires <strong>Administrator Approval</strong> before you can access the dashboard.
          </p>
          <p className="micro text-muted" style={{ marginBottom: 24 }}>
            You will be able to log in once your credentials have been verified by the central civic office.
          </p>
          <button className="btn btn-primary w-full" onClick={() => navigate('/authority-login')}>Return to Login</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page authority-theme">
      <motion.div className="auth-card card card-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-header">
          <div className="auth-icon-circle">🏢</div>
          <h1 style={{ fontSize: 28, marginTop: 16 }}>Access <span className="text-primary-brand">Request</span></h1>
          <p className="text-secondary" style={{ marginTop: 8 }}>Government Official Registration</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="micro text-muted">Full Name</label>
            <input type="text" className="input" placeholder="Official Name"
              value={name} onChange={(e) => { setName(e.target.value); clearError(); }} required />
          </div>
          <div className="form-group">
            <label className="micro text-muted">Government Email</label>
            <input type="email" className="input" placeholder="officer@gov.in"
              value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} required />
          </div>
          <div className="form-group">
            <label className="micro text-muted">Department</label>
            <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)} required>
              <option value="">Select your department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="micro text-muted">Password</label>
            <input type="password" className="input" placeholder="Min. 6 characters"
              value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} required minLength={6} />
          </div>

          {error && <p className="text-error" style={{ fontSize: 13 }}>{error}</p>}

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <p className="micro" style={{ color: '#60A5FA', margin: 0, lineHeight: 1.4 }}>
              ℹ️ Note: All official accounts require manual verification by the CivicX Admin team.
            </p>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? '⏳ Processing...' : '📤 Submit Application'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }} className="text-muted">
          Already have an account? <Link to="/authority-login" className="text-primary-brand" style={{ fontWeight: 700 }}>Log In</Link>
        </p>
      </motion.div>
    </div>
  );
}
