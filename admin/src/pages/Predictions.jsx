import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api.js';
import { riskOf } from '../risk.js';

export default function Predictions() {
  const [preds, setPreds]   = useState([]);
  const [nodes, setNodes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [page, setPage]     = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]   = useState(0);

  const nodeById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  useEffect(() => {
    api.get('/locations').then((r) => setNodes(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/predictions', { params: { page, limit: 50 } })
      .then((r) => {
        setPreds(r.data.data ?? []);
        const p = r.data.pagination;
        if (p) { setTotal(p.total); setTotalPages(p.totalPages); }
      })
      .catch((err) => setError(errMsg(err, 'Gagal memuat prediksi.')))
      .finally(() => setLoading(false));
  }, [page]);

  const isPast = (t) => new Date(t) < new Date();

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Prediksi Banjir</h1>
          <p className="muted">{total} prediksi tersimpan · diperbarui otomatis tiap data sensor masuk</p>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Dibuat</th>
            <th>Titik Pantau</th>
            <th>Prediksi Tinggi</th>
            <th>Status Prediksi</th>
            <th>Untuk Waktu</th>
            <th>Horizon</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? <tr><td colSpan={6} className="muted center">Memuat…</td></tr>
            : preds.map((p) => {
                const node = nodeById[p.location_id];
                const risk = riskOf(p.predicted_level_cm, node);
                const past = isPast(p.prediction_for_time);
                const diffMs  = new Date(p.prediction_for_time) - new Date(p.timestamp);
                const diffH   = Math.round(diffMs / 3600000);
                return (
                  <tr key={p.id} style={past ? { opacity: 0.5 } : {}}>
                    <td className="mono">{new Date(p.timestamp).toLocaleString('id-ID')}</td>
                    <td>{node ? node.name : `#${p.location_id}`}</td>
                    <td><b>{p.predicted_level_cm} cm</b></td>
                    <td>
                      <span className="badge" style={{ background: risk.color + '22', color: risk.color }}>
                        {risk.label}
                      </span>
                    </td>
                    <td className="mono">{new Date(p.prediction_for_time).toLocaleString('id-ID')}</td>
                    <td className="muted">{diffH > 0 ? `+${diffH} jam` : '—'}</td>
                  </tr>
                );
              })}
          {!loading && preds.length === 0 && (
            <tr><td colSpan={6} className="muted center">Belum ada prediksi. Kirim data sensor untuk memulai.</td></tr>
          )}
        </tbody>
      </table>

      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
            ← Sebelumnya
          </button>
          <span className="page-info">Halaman {page} dari {totalPages}</span>
          <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
            Selanjutnya →
          </button>
        </div>
      )}
    </div>
  );
}
