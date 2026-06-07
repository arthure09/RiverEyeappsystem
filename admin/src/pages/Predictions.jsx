import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api.js';

export default function Predictions() {
  const [preds, setPreds] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [pRes, locRes] = await Promise.all([api.get('/predictions'), api.get('/locations')]);
        setPreds(pRes.data.data);
        setNodes(locRes.data.data);
      } catch (err) {
        setError(errMsg(err, 'Gagal memuat prediksi.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const nodeById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const sorted = useMemo(
    () => [...preds].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [preds],
  );

  if (loading) return <p className="muted">Memuat...</p>;

  return (
    <div>
      <div className="page-head"><h1>Prediksi Banjir</h1><p className="muted">{preds.length} prediksi</p></div>
      {error && <div className="alert">{error}</div>}
      <table className="table">
        <thead>
          <tr><th>Dibuat</th><th>Titik Pantau</th><th>Prediksi Tinggi</th><th>Untuk Waktu</th></tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const node = nodeById[p.location_id];
            return (
              <tr key={p.id}>
                <td className="mono">{new Date(p.timestamp).toLocaleString('id-ID')}</td>
                <td>{node ? node.name : `#${p.location_id}`}</td>
                <td>{p.predicted_level_cm} cm</td>
                <td className="mono">{new Date(p.prediction_for_time).toLocaleString('id-ID')}</td>
              </tr>
            );
          })}
          {sorted.length === 0 && <tr><td colSpan={4} className="muted center">Belum ada prediksi.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
