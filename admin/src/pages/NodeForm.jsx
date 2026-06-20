import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import api, { errMsg } from '../api.js';
import { IconDroplet, IconCamera, IconArrowLeft } from '../icons.jsx';

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
  status_override: '',
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

  // Jenis node ditentukan dari kombinasi has_sensor & has_camera
  const jenis = form.has_camera && !form.has_sensor ? 'camera'
    : form.has_sensor && form.has_camera ? 'both'
    : 'sensor';

  const setJenis = (value) =>
    setForm((f) => ({
      ...f,
      has_sensor: value === 'sensor' || value === 'both',
      has_camera: value === 'camera' || value === 'both',
    }));

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
      status_override: form.status_override || null,
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
        <button className="btn" onClick={() => navigate('/')}><IconArrowLeft size={15} /> Kembali</button>
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

          <label>Jenis Node *</label>
          <div className="seg">
            <button type="button" className={jenis === 'sensor' ? 'active' : ''} onClick={() => setJenis('sensor')}>
              <IconDroplet size={20} />
              Sensor Air
            </button>
            <button type="button" className={jenis === 'camera' ? 'active' : ''} onClick={() => setJenis('camera')}>
              <IconCamera size={20} />
              Kamera Pantau
            </button>
            <button type="button" className={jenis === 'both' ? 'active' : ''} onClick={() => setJenis('both')}>
              <span className="seg-icons"><IconDroplet size={20} /><IconCamera size={20} /></span>
              Keduanya
            </button>
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

          <label>Status Manual</label>
          <select value={form.status_override || ''} onChange={(e) => set('status_override', e.target.value)}>
            <option value="">Otomatis (ikut sensor)</option>
            <option value="aman">Aman</option>
            <option value="waspada">Waspada</option>
            <option value="siaga">Siaga</option>
          </select>
          <p className="muted">Pilih <b>Otomatis</b> agar status mengikuti ketinggian air sensor, atau setel manual untuk menimpanya.</p>

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
