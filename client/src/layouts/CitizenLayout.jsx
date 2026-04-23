import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useUIStore } from '../store';
import { HomeIcon, MapIcon, PlusIcon, TrophyIcon, UserIcon, SunIcon, MoonIcon, PhoneIcon, BookIcon } from '../components/Icons';
import SOSButton from '../components/SOSButton';
import './CitizenLayout.css';

const navItems = [
  { path: '/', icon: <HomeIcon size={22} />, label: 'Home' },
  { path: '/map', icon: <MapIcon size={22} />, label: 'Map' },
  { path: '/learning', icon: <BookIcon size={22} />, label: 'Learn' },
  { path: '/submit', icon: <PlusIcon size={28} color="white" />, label: 'Report', isPrimary: true },
  { path: '/rewards', icon: <TrophyIcon size={22} />, label: 'Rewards' },
  { path: '/emergency', icon: <PhoneIcon size={22} />, label: 'Helpline' },
  { path: '/profile', icon: <UserIcon size={22} />, label: 'Profile' }
];

export default function CitizenLayout() {
  const user = useAuthStore(s => s.user);
  const fetchProfile = useAuthStore(s => s.fetchProfile);
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync rewards in "real-time" (periodic + focus-based)
  useEffect(() => {
    fetchProfile(); // Initial fetch
    
    const interval = setInterval(fetchProfile, 30000); // Every 30s
    
    const onFocus = () => fetchProfile();
    window.addEventListener('focus', onFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchProfile]);

  return (
    <div className="citizen-layout">
      {/* Top Header */}
      <header className="citizen-header">
        <div className="header-left">
          <img src="/CivicX_logo.png" alt="CivicX" className="no-dim header-logo" onClick={() => navigate('/profile')}
            style={{ width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', objectFit: 'cover' }} />
          <div>
            <p className="micro text-muted">Welcome back</p>
            <h3 style={{ fontSize: 16 }}>{user?.name || 'Citizen'}</h3>
          </div>
        </div>
        <div className="header-right">
          <SOSButton />
          <button className="btn-icon theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </button>
          {user?.role === 'admin' && (
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin')}>
              Admin
            </button>
          )}
        </div>
      </header>

      {/* Page Content */}
      <main className="citizen-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ minHeight: '100%' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${item.isPrimary ? 'nav-primary' : ''}`
            }
          >
            {item.isPrimary ? (
              <div className="nav-fab">
                {item.icon}
              </div>
            ) : (
              <>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-dot" />
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
