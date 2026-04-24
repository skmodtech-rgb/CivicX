import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useUIStore } from '../store';
import { 
  DashboardIcon, ClipboardIcon, FlameIcon, BrainIcon, 
  SunIcon, MoonIcon, HomeIcon, LogoutIcon 
} from '../components/Icons';
import './AdminLayout.css';

const sidebarItems = [
  { path: '/admin', icon: <DashboardIcon size={18} />, label: 'Dashboard', end: true },
  { path: '/admin/complaints', icon: <ClipboardIcon size={18} />, label: 'Complaints' },
  { path: '/admin/users', icon: <span style={{fontSize:16, lineHeight:1}}>👥</span>, label: 'Citizens' },
  { path: '/admin/authorities', icon: <span style={{fontSize:16, lineHeight:1}}>🏛️</span>, label: 'Authorities' },
  { path: '/admin/redemptions', icon: <span style={{fontSize:16, lineHeight:1}}>🎁</span>, label: 'Redemptions' },
  { path: '/admin/hotspots', icon: <FlameIcon size={18} />, label: 'Hotspots' },
  { path: '/admin/insights', icon: <BrainIcon size={18} />, label: 'Insights' },
  { path: '/admin/sos', icon: <span style={{fontSize:16, lineHeight:1}}>🚨</span>, label: 'SOS Alerts' }
];

export default function AdminLayout() {
  const { logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`admin-layout ${sidebarOpen ? '' : 'sidebar-collapsed'} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      
      {/* Mobile Topbar */}
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/CivicX_logo.png" alt="CivicX" className="no-dim" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <h2 className="brand-text" style={{ fontSize: 20 }}>CivicX</h2>
        </div>
        <button className="btn-icon mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)}>
          <span style={{ fontSize: 20 }}>☰</span>
        </button>
      </div>

      {/* Mobile Backdrop */}
      <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/CivicX_logo.png" alt="CivicX" className="no-dim" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <h2 className="brand-text">CivicX</h2>
          </div>
          <button className="btn-icon sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-item" onClick={toggleTheme}>
            <span className="sidebar-icon">{theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}</span>
            <span className="sidebar-label">Theme</span>
          </button>
          <button className="sidebar-item" onClick={() => navigate('/')}>
            <span className="sidebar-icon"><HomeIcon size={18} /></span>
            <span className="sidebar-label">Citizen View</span>
          </button>
          <button className="sidebar-item logout" onClick={handleLogout}>
            <span className="sidebar-icon"><LogoutIcon size={18} /></span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
