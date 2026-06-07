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
