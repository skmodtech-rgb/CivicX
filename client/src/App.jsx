import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import CitizenLayout from './layouts/CitizenLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthorityLogin from './pages/AuthorityLogin';
import AuthorityRegister from './pages/AuthorityRegister';
import OfficialLayout from './layouts/OfficialLayout';
import OfficialDashboard from './pages/OfficialDashboard';
import Home from './pages/Home';
import Submit from './pages/Submit';
import ComplaintDetail from './pages/ComplaintDetail';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';
import MapView from './pages/MapView';
import AdminDashboard from './pages/admin/Dashboard';
import AdminComplaints from './pages/admin/Complaints';
import AdminHotspots from './pages/admin/Hotspots';
import AdminInsights from './pages/admin/Insights';
import AdminUsers from './pages/admin/Users';
import AdminAuthorities from './pages/admin/Authorities';
import AdminRedemptions from './pages/admin/Redemptions';
import AdminSOS from './pages/admin/SOS';
import Emergency from './pages/Emergency';
import ActivityCenter from './pages/ActivityCenter';
import LearningHub from './pages/LearningHub';
import LessonDetail from './pages/LessonDetail';

function ProtectedRoute({ children, adminOnly = false, officialOnly = false }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  if (officialOnly && user.role !== 'official' && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/authority-login" element={<AuthorityLogin />} />
        <Route path="/authority-register" element={<AuthorityRegister />} />

        {/* Citizen Routes */}
        <Route path="/" element={<ProtectedRoute><CitizenLayout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="submit" element={<Submit />} />
          <Route path="complaint/:id" element={<ComplaintDetail />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="profile" element={<Profile />} />
          <Route path="map" element={<MapView />} />
          <Route path="emergency" element={<Emergency />} />
          <Route path="activity" element={<ActivityCenter />} />
          <Route path="learning" element={<LearningHub />} />
          <Route path="learning/:id" element={<LessonDetail />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="hotspots" element={<AdminHotspots />} />
          <Route path="insights" element={<AdminInsights />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="authorities" element={<AdminAuthorities />} />
          <Route path="redemptions" element={<AdminRedemptions />} />
          <Route path="sos" element={<AdminSOS />} />
        </Route>

        {/* Official Routes */}
        <Route path="/official" element={<ProtectedRoute officialOnly><OfficialLayout /></ProtectedRoute>}>
          <Route index element={<OfficialDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
