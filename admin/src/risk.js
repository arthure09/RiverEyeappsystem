// Hitung status risiko dari ketinggian air memakai ambang per-node.
// Selaras dengan logika aplikasi mobile (getRiskFromLevel).
export const riskOf = (levelCm, node = {}) => {
  const med = Number(node.risk_medium_cm ?? 150);
  const high = Number(node.risk_high_cm ?? 200);
  const cm = Number(levelCm);
  if (cm >= high) return { label: 'Siaga', color: '#E74C3C' };
  if (cm >= med) return { label: 'Waspada', color: '#F39C12' };
  return { label: 'Aman', color: '#27AE60' };
};

// Metadata status manual — nilai disimpan lowercase (selaras kontrak app).
const STATUS_META = {
  aman: { label: 'Aman', color: '#27AE60' },
  waspada: { label: 'Waspada', color: '#F39C12' },
  siaga: { label: 'Siaga', color: '#E74C3C' },
  bahaya: { label: 'Siaga', color: '#E74C3C' }, // alias, diperlakukan seperti siaga
};

// Pilihan status untuk dropdown di web admin.
// value kosong = otomatis (dihitung dari ketinggian air terakhir).
export const STATUS_OPTIONS = [
  { value: '', label: 'Otomatis (ikut sensor)' },
  { value: 'aman', label: 'Aman' },
  { value: 'waspada', label: 'Waspada' },
  { value: 'siaga', label: 'Siaga' },
];

// Status efektif sebuah node: override manual menang; bila kosong, hitung dari level.
// Mengembalikan null bila otomatis tapi belum ada data sensor.
export const statusOf = (node = {}, levelCm) => {
  const override = (node.status_override || '').trim().toLowerCase();
  if (override) {
    const meta = STATUS_META[override] || { label: override, color: '#7F8C8D' };
    return { ...meta, auto: false };
  }
  if (levelCm === undefined || levelCm === null) return null;
  return { ...riskOf(levelCm, node), auto: true };
};
