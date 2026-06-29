import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { IconMapPin, IconDroplet, IconTrendingUp, IconLogout, IconActivity } from './icons.jsx';
import logo from '/logo.png';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NodeForm from './pages/NodeForm.jsx';
import Logs from './pages/Logs.jsx';
import Predictions from './pages/Predictions.jsx';
import WaterMonitor from './pages/WaterMonitor.jsx';

const isAuthed = () => !!localStorage.getItem('rivereye_token');

function Protected({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

function Shell({ children }) {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('rivereye_token');
    navigate('/login');
  };
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand" style={{ gap: 0 }}>
          <img src={logo} alt="RiverEye" style={{ width: 120, height: 120, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontSize: 18, whiteSpace: 'nowrap', marginLeft: -24 }}>RiverEye<span>Admin</span></span>
        </div>
        <nav>
          <NavLink to="/" end><IconMapPin /> <span>Titik Pantau</span></NavLink>
          <NavLink to="/logs"><IconDroplet /> <span>Log Sensor</span></NavLink>
          <NavLink to="/predictions"><IconTrendingUp /> <span>Prediksi</span></NavLink>
          <NavLink to="/water-monitor"><IconActivity /> <span>Monitor Air</span></NavLink>
        </nav>
        <button className="logout" onClick={logout}><IconLogout size={16} /> <span>Keluar</span></button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Shell><Dashboard /></Shell></Protected>} />
      <Route path="/nodes/new" element={<Protected><Shell><NodeForm /></Shell></Protected>} />
      <Route path="/nodes/:id" element={<Protected><Shell><NodeForm /></Shell></Protected>} />
      <Route path="/logs" element={<Protected><Shell><Logs /></Shell></Protected>} />
      <Route path="/predictions" element={<Protected><Shell><Predictions /></Shell></Protected>} />
      <Route path="/water-monitor" element={<Protected><Shell><WaterMonitor /></Shell></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
