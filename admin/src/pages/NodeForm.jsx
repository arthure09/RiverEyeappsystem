import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import api, { errMsg } from '../api.js';

const EMPTY = {
  name: '',
  latitude: -7.2575,
  longitude: 112.7521,
  elevation: '',
  has_sensor: true,
  has_camera: false,
  cctv_url: '',
  risk_medium_cm: 150,
  risk_high_cm: 200,
  description: '',
};

function ClickPicker({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function NodeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await api.get(`/locations/${id}`);
        setForm({ ...EMPTY, ...data.data });
      } catch (err) {
        setError(errMsg(err, 'Gagal memuat node.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      elevation: form.elevation === '' ? null : Number(form.elevation),
      risk_medium_cm: Number(form.risk_medium_cm),
      risk_high_cm: Number(form.risk_high_cm),
    };
    try {
      if (isEdit) await api.put(`/locations/${id}`, payload);
      else await api.post('/locations', payload);
      navigate('/');
    } catch (err) {
      setError(errMsg(err, 'Gagal menyimpan.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="muted">Memuat...</p>;

  const pos = [Number(form.latitude) || -7.2575, Number(form.longitude) || 112.7521];

  return (
    <div>
      <div className="page-head">
        <h1>{isEdit ? `Edit Node #${id}` : 'Tambah Node'}</h1>
        <button className="btn" onClick={() => navigate('/')}>← Kembali</button>
      </div>

      {error && <div className="alert">{error}</div>}

      <form className="form-grid" onSubmit={submit}>
        <div className="form-col">
          <label>Nama titik pantau *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required />

          <label>Deskripsi</label>
          <textarea rows={2} value={form.description || ''} onChange={(e) => set('description', e.target.value)} />

          <div className="row2">
            <div>
              <label>Latitude *</label>
              <input type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} required />
            </div>
            <div>
              <label>Longitude *</label>
              <input type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} required />
            </div>
          </div>

          <label>Elevasi (m)</label>
          <input type="number" step="any" value={form.elevation ?? ''} onChange={(e) => set('elevation', e.target.value)} />

          <div className="row2">
            <label className="check">
              <input type="checkbox" checked={!!form.has_sensor} onChange={(e) => set('has_sensor', e.target.checked)} />
              Punya Sensor
            </label>
            <label className="check">
              <input type="checkbox" checked={!!form.has_camera} onChange={(e) => set('has_camera', e.target.checked)} />
              Punya CCTV
            </label>
          </div>

          {form.has_camera && (
            <>
              <label>URL Stream CCTV (RTSP/HLS/MP4)</label>
              <input value={form.cctv_url || ''} onChange={(e) => set('cctv_url', e.target.value)} placeholder="rtsp://... atau https://.../stream.m3u8" />
            </>
          )}

          <div className="row2">
            <div>
              <label>Ambang Waspada (cm)</label>
              <input type="number" value={form.risk_medium_cm} onChange={(e) => set('risk_medium_cm', e.target.value)} />
            </div>
            <div>
              <label>Ambang Siaga (cm)</label>
              <input type="number" value={form.risk_high_cm} onChange={(e) => set('risk_high_cm', e.target.value)} />
            </div>
          </div>

          <button className="btn primary" disabled={saving}>
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Node'}
          </button>
        </div>

        <div className="form-col">
          <label>Klik peta untuk menentukan titik</label>
          <div className="map-box">
            <MapContainer center={pos} zoom={13} style={{ height: 360, width: '100%' }}>
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickPicker onPick={(lat, lng) => { set('latitude', lat); set('longitude', lng); }} />
              <Marker position={pos} />
            </MapContainer>
          </div>
          <p className="muted">Marker mengikuti koordinat di form. Klik di peta untuk memindahkannya.</p>
        </div>
      </form>
    </div>
  );
}
