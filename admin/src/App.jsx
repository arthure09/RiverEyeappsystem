import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NodeForm from './pages/NodeForm.jsx';
import Logs from './pages/Logs.jsx';
import Predictions from './pages/Predictions.jsx';

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
        <div className="brand">🌊 RiverEye<span>Admin</span></div>
        <nav>
          <NavLink to="/" end>📍 Titik Pantau</NavLink>
          <NavLink to="/logs">💧 Log Sensor</NavLink>
          <NavLink to="/predictions">📈 Prediksi</NavLink>
        </nav>
        <button className="logout" onClick={logout}>Keluar</button>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
