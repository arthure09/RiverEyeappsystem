import { useEffect, useRef, useState } from 'react';
import api from '../api.js';

const WS_URL = 'wss://water.serverlucas.my.id/ws';

// Kedalaman maksimum sensor (genangan jalan): 10 cm = ADC 4095
const MAX_DEPTH_CM = 10;

function toCm(raw) {
  return ((raw / 4095) * MAX_DEPTH_CM).toFixed(2);
}

function levelColor(pct) {
  if (pct >= 75) return '#E74C3C';
  if (pct >= 50) return '#F39C12';
  if (pct >= 25) return '#F1C40F';
  return '#27AE60';
}

const WS_COLOR = { connecting: '#F39C12', connected: '#27AE60', disconnected: '#94a3b8' };
const WS_LABEL = { connecting: 'Menghubungkan…', connected: 'Terhubung realtime', disconnected: 'Terputus' };

export default function WaterMonitor() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [wsStatus, setWsStatus] = useState('connecting');
  const [latestId, setLatestId] = useState(null);
  const [limit, setLimit] = useState(50);
  const wsRef = useRef(null);

  useEffect(() => {
    const isMore = limit > 50;
    if (isMore) setLoadingMore(true); else setLoading(true);
    api.get(`/water-readings?limit=${limit}`)
      .then((res) => setReadings(Array.isArray(res.data) ? res.data : (res.data.data ?? [])))
      .catch(() => setError('Gagal memuat data historis dari server sensor.'))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [limit]);

  useEffect(() => {
    let ws;
    let retryTimer;

    function connect() {
      setWsStatus('connecting');
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setWsStatus('connected');

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'new_reading') {
            const r = msg.data;
            setLatestId(r.id);
            setReadings((prev) => [r, ...prev.slice(0, 49)]);
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        retryTimer = setTimeout(connect, 5000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, []);

  const deviceMap = {};
  for (const r of readings) {
    if (!deviceMap[r.device_id]) deviceMap[r.device_id] = r;
  }

  if (loading) return <p className="muted">Memuat…</p>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Monitor Air</h1>
          <p className="muted">{readings.length} data terakhir · {Object.keys(deviceMap).length} node aktif</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: WS_COLOR[wsStatus],
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span className="muted" style={{ fontSize: 13 }}>{WS_LABEL[wsStatus]}</span>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      {Object.keys(deviceMap).length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 14,
            marginBottom: 20,
          }}
        >
          {Object.values(deviceMap).map((r) => {
            const color = levelColor(r.water_level_percent);
            return (
              <div
                key={r.device_id}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.07)',
                  borderTop: `3px solid ${color}`,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {r.device_id}
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>
                  {toCm(r.water_level_raw)} cm
                </div>
                <div style={{ fontSize: 13, color, fontWeight: 600, marginTop: 2 }}>
                  {r.water_level_percent.toFixed(1)}%
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                  ADC raw: {r.water_level_raw}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {r.battery_voltage != null ? `Baterai: ${r.battery_voltage}V` : 'Baterai: —'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                  {new Date(r.created_at).toLocaleString('id-ID')}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Node</th>
            <th>Genangan</th>
            <th>Level Air</th>
            <th>Raw ADC</th>
            <th>Baterai</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => {
            const color = levelColor(r.water_level_percent);
            const isNew = r.id === latestId;
            return (
              <tr key={r.id} style={isNew ? { background: '#f0fdf4' } : {}}>
                <td className="mono">
                  {new Date(r.created_at).toLocaleString('id-ID')}
                  {isNew && (
                    <span
                      className="chip"
                      style={{ marginLeft: 8, background: '#dcfce7', color: '#15803d' }}
                    >
                      baru
                    </span>
                  )}
                </td>
                <td><span className="chip">{r.device_id}</span></td>
                <td>
                  <span
                    className="badge"
                    style={{ background: color + '22', color, fontWeight: 700 }}
                  >
                    {toCm(r.water_level_raw)} cm
                  </span>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{ background: color + '22', color }}
                  >
                    {r.water_level_percent.toFixed(1)}%
                  </span>
                </td>
                <td className="mono">{r.water_level_raw}</td>
                <td className="muted">{r.battery_voltage != null ? `${r.battery_voltage}V` : '—'}</td>
              </tr>
            );
          })}
          {readings.length === 0 && (
            <tr>
              <td colSpan={6} className="muted center">Belum ada data dari node sensor.</td>
            </tr>
          )}
        </tbody>
      </table>

      {readings.length >= limit && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            className="btn"
            onClick={() => setLimit((l) => l + 50)}
            disabled={loadingMore}
          >
            {loadingMore ? 'Memuat…' : `Muat lebih (${limit + 50} data)`}
          </button>
        </div>
      )}
    </div>
  );
}
