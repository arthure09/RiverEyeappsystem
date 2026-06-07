import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api.js';
import { riskOf } from '../risk.js';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [logRes, locRes] = await Promise.all([api.get('/logs'), api.get('/locations')]);
        setLogs(logRes.data.data);
        setNodes(locRes.data.data);
      } catch (err) {
        setError(errMsg(err, 'Gagal memuat log.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const nodeById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const sorted = useMemo(
    () => [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [logs],
  );

  if (loading) return <p className="muted">Memuat...</p>;

  return (
    <div>
      <div className="page-head"><h1>Log Sensor</h1><p className="muted">{logs.length} catatan</p></div>
      {error && <div className="alert">{error}</div>}
      <table className="table">
        <thead>
          <tr><th>Waktu</th><th>Titik Pantau</th><th>Ketinggian</th><th>Status</th></tr>
        </thead>
        <tbody>
          {sorted.map((l) => {
            const node = nodeById[l.location_id];
            const risk = riskOf(l.water_level_cm, node);
            return (
              <tr key={l.id}>
                <td className="mono">{new Date(l.timestamp).toLocaleString('id-ID')}</td>
                <td>{node ? node.name : `#${l.location_id}`}</td>
                <td>{l.water_level_cm} cm</td>
                <td><span className="badge" style={{ background: risk.color + '22', color: risk.color }}>{risk.label}</span></td>
              </tr>
            );
          })}
          {sorted.length === 0 && <tr><td colSpan={4} className="muted center">Belum ada log.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
