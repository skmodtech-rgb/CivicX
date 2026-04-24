import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';

export default function OfficialLayout() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="official-layout">
      <nav className="official-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="logo-icon">🏛️</span>
            <div>
              <span className="logo-text">CivicX</span>
              <span className="badge badge-primary micro" style={{ display: 'block', width: 'fit-content' }}>OFFICIAL</span>
            </div>
          </div>

          <div className="nav-user">
            <div className="user-info">
              <p className="user-name">{user?.name}</p>
              <p className="micro text-muted">{user?.department}</p>
            </div>
            <button className="logout-btn-premium" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <main className="official-main container">
        <Outlet />
      </main>

      <style>{`
        .official-layout { min-height: 100vh; background: var(--color-bg); }
        .official-nav { 
          background: var(--color-surface); 
          border-bottom: 1px solid var(--color-border);
          padding: 12px 0;
          position: sticky; top: 0; z-index: 100;
        }
        .nav-container { 
          max-width: 1200px; margin: 0 auto; padding: 0 20px;
          display: flex; justify-content: space-between; alignItems: center;
        }
        .nav-brand { display: flex; gap: 12px; align-items: center; }
        .logo-icon { font-size: 28px; }
        .logo-text { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: block; }
        
        .nav-user { display: flex; gap: 16px; align-items: center; }
        .user-info { text-align: right; }
        .user-name { font-weight: 700; font-size: 14px; }
        .logout-btn-premium { 
          background: #ef4444; border: none; color: white;
          padding: 8px 16px; border-radius: 10px; font-weight: 700;
          font-size: 13px; cursor: pointer; transition: all 0.2s;
        }
        .logout-btn-premium:hover { background: #dc2626; transform: translateY(-1px); }
        
        .official-main { padding-top: 32px; }
      `}</style>
    </div>
  );
}
