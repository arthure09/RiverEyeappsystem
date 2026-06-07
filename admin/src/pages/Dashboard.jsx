import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api, { errMsg } from '../api.js';
import { riskOf } from '../risk.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [locRes, logRes] = await Promise.all([api.get('/locations'), api.get('/logs')]);
      setNodes(locRes.data.data);
      setLogs(logRes.data.data);
    } catch (err) {
      setError(errMsg(err, 'Gagal memuat data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Ketinggian air terakhir per lokasi
  const latestByLoc = useMemo(() => {
    const map = {};
    for (const log of logs) {
      const prev = map[log.location_id];
      if (!prev || new Date(log.timestamp) > new Date(prev.timestamp)) map[log.location_id] = log;
    }
    return map;
  }, [logs]);

  const remove = async (node) => {
    if (!window.confirm(`Hapus titik pantau "${node.name}"?`)) return;
    try {
      await api.delete(`/locations/${node.id}`);
      load();
    } catch (err) {
      alert(errMsg(err, 'Gagal menghapus.'));
    }
  };

  const center = nodes.length
    ? [Number(nodes[0].latitude), Number(nodes[0].longitude)]
    : [-7.2575, 112.7521];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Titik Pantau</h1>
          <p className="muted">{nodes.length} node terdaftar — yang ditampilkan di aplikasi</p>
        </div>
        <button className="btn primary" onClick={() => navigate('/nodes/new')}>+ Tambah Node</button>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="map-box">
        <MapContainer center={center} zoom={12} style={{ height: 320, width: '100%' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {nodes.map((n) => (
            <Marker key={n.id} position={[Number(n.latitude), Number(n.longitude)]}>
              <Popup>
                <b>{n.name}</b><br />
                {latestByLoc[n.id]
                  ? `${latestByLoc[n.id].water_level_cm} cm — ${riskOf(latestByLoc[n.id].water_level_cm, n).label}`
                  : 'Belum ada data sensor'}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {loading ? (
        <p className="muted">Memuat...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Nama</th><th>Koordinat</th><th>Perangkat</th>
              <th>Air Terakhir</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((n) => {
              const last = latestByLoc[n.id];
              const risk = last ? riskOf(last.water_level_cm, n) : null;
              return (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td>{n.name}</td>
                  <td className="mono">{Number(n.latitude).toFixed(4)}, {Number(n.longitude).toFixed(4)}</td>
                  <td>
                    {n.has_sensor && <span className="chip">💧 Sensor</span>}
                    {n.has_camera && <span className="chip">📹 CCTV</span>}
                  </td>
                  <td>{last ? `${last.water_level_cm} cm` : '—'}</td>
                  <td>{risk ? <span className="badge" style={{ background: risk.color + '22', color: risk.color }}>{risk.label}</span> : '—'}</td>
                  <td className="actions">
                    <button className="btn small" onClick={() => navigate(`/nodes/${n.id}`)}>Edit</button>
                    <button className="btn small danger" onClick={() => remove(n)}>Hapus</button>
                  </td>
                </tr>
              );
            })}
            {nodes.length === 0 && (
              <tr><td colSpan={7} className="muted center">Belum ada node. Klik "Tambah Node".</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
