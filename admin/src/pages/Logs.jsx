import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api.js';
import { riskOf } from '../risk.js';
import { IconSearch, IconX } from '../icons.jsx';

const STATUS_FILTERS = ['Semua', 'Aman', 'Sedang', 'Waspada', 'Siaga'];
const PAGE_SIZE = 100;

function SkeletonRow() {
  return (
    <tr>
      {[140, 160, 80, 70].map((w, i) => (
        <td key={i}>
          <span
            style={{
              display: 'inline-block',
              width: w,
              height: 14,
              borderRadius: 4,
              background: 'linear-gradient(90deg,#2a2a3a 25%,#35354a 50%,#2a2a3a 75%)',
              backgroundSize: '400px 100%',
              animation: 'shimmer 1.4s infinite linear',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Lokasi hanya di-fetch sekali
  useEffect(() => {
    api.get('/locations')
      .then((r) => setNodes(r.data.data))
      .catch(() => {});
  }, []);

  // Log di-fetch ulang setiap kali halaman atau filter tanggal berubah
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const params = { page, limit: PAGE_SIZE };
    if (filterFrom) params.from = filterFrom;
    if (filterTo)   params.to   = filterTo;

    api.get('/logs', { params })
      .then((r) => {
        if (!active) return;
        const rows = r.data.data ?? [];
        const p    = r.data.pagination;
        setLogs(rows);
        setTotal(p ? p.total : rows.length);
        setTotalPages(p ? p.totalPages : 1);
      })
      .catch((err) => {
        if (!active) return;
        setError(errMsg(err, 'Gagal memuat log.'));
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [page, filterFrom, filterTo]);

  const nodeById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  // Filter nama & status berlaku pada data halaman saat ini
  const filtered = useMemo(() => {
    const nameLow = filterName.trim().toLowerCase();
    return logs.filter((l) => {
      const node = nodeById[l.location_id];
      if (nameLow) {
        const name = node ? node.name.toLowerCase() : `#${l.location_id}`;
        if (!name.includes(nameLow)) return false;
      }
      if (filterStatus !== 'Semua') {
        const risk = riskOf(l.water_level_cm, node);
        if (risk.label !== filterStatus) return false;
      }
      return true;
    });
  }, [logs, nodeById, filterName, filterStatus]);

  const hasFilter = filterName || filterFrom || filterTo || filterStatus !== 'Semua';

  const resetFilters = () => {
    setFilterName('');
    setFilterFrom('');
    setFilterTo('');
    setFilterStatus('Semua');
    setPage(1);
  };

  const handleFromChange = (e) => { setFilterFrom(e.target.value); setPage(1); };
  const handleToChange   = (e) => { setFilterTo(e.target.value);   setPage(1); };

  return (
    <div>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-bottom: 18px;
          padding: 14px 16px;
          background: var(--card, #1e1e2e);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .filter-input-wrap {
          position: relative;
          flex: 1 1 180px;
        }
        .filter-input-wrap .icon-left {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.45;
          pointer-events: none;
        }
        .filter-input-wrap input {
          width: 100%;
          padding: 7px 10px 7px 34px;
          border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: inherit;
          font-size: 0.85rem;
          box-sizing: border-box;
        }
        .filter-input-wrap input:focus {
          outline: none;
          border-color: rgba(99,179,237,0.5);
          background: rgba(255,255,255,0.08);
        }
        .filter-date {
          flex: 1 1 160px;
          padding: 7px 10px;
          border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: inherit;
          font-size: 0.85rem;
          box-sizing: border-box;
        }
        .filter-date:focus {
          outline: none;
          border-color: rgba(99,179,237,0.5);
          background: rgba(255,255,255,0.08);
        }
        .filter-select {
          flex: 0 1 130px;
          padding: 7px 10px;
          border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: inherit;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .filter-select:focus {
          outline: none;
          border-color: rgba(99,179,237,0.5);
        }
        .filter-reset {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 12px;
          border-radius: 7px;
          border: 1px solid rgba(231,76,60,0.4);
          background: rgba(231,76,60,0.08);
          color: #E74C3C;
          font-size: 0.82rem;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .filter-reset:hover { background: rgba(231,76,60,0.18); }
        .filter-label {
          font-size: 0.78rem;
          opacity: 0.5;
          white-space: nowrap;
        }
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 20px 0 4px;
        }
        .page-btn {
          padding: 6px 14px;
          border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: inherit;
          font-size: 0.84rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
        .page-btn:disabled { opacity: 0.35; cursor: default; }
        .page-info {
          font-size: 0.84rem;
          opacity: 0.65;
          white-space: nowrap;
        }
      `}</style>

      <div className="page-head">
        <h1>Log Sensor</h1>
        <p className="muted">
          {loading ? '...' : `${filtered.length} dari ${total} catatan`}
        </p>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="filter-bar">
        <div className="filter-input-wrap">
          <span className="icon-left"><IconSearch size={15} /></span>
          <input
            type="text"
            placeholder="Cari titik pantau..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </div>

        <span className="filter-label">Dari</span>
        <input
          type="datetime-local"
          className="filter-date"
          value={filterFrom}
          onChange={handleFromChange}
        />

        <span className="filter-label">Sampai</span>
        <input
          type="datetime-local"
          className="filter-date"
          value={filterTo}
          onChange={handleToChange}
        />

        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {hasFilter && (
          <button className="filter-reset" onClick={resetFilters}>
            <IconX size={13} /> Reset
          </button>
        )}
      </div>

      <table className="table">
        <thead>
          <tr><th>Waktu</th><th>Titik Pantau</th><th>Ketinggian</th><th>Status</th></tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            : filtered.map((l) => {
                const node = nodeById[l.location_id];
                const risk = riskOf(l.water_level_cm, node);
                return (
                  <tr key={l.id}>
                    <td className="mono">{new Date(l.timestamp).toLocaleString('id-ID')}</td>
                    <td>{node ? node.name : `#${l.location_id}`}</td>
                    <td>{l.water_level_cm} cm</td>
                    <td>
                      <span className="badge" style={{ background: risk.color + '22', color: risk.color }}>
                        {risk.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
          {!loading && filtered.length === 0 && (
            <tr><td colSpan={4} className="muted center">
              {hasFilter ? 'Tidak ada data yang cocok dengan filter.' : 'Belum ada log.'}
            </td></tr>
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
