const NTFY_URL = process.env.NTFY_URL || 'https://ntfy.sh';
const NTFY_TOPIC = process.env.NTFY_TOPIC || 'rivereye-banjir-sby';

const RISK_CONFIG = {
  bahaya: { emoji: '🚨', label: 'SIAGA BANJIR', priority: 'urgent', tag: 'rotating_light' },
  waspada: { emoji: '⚠️', label: 'WASPADA BANJIR', priority: 'high', tag: 'warning' },
};

async function sendFloodAlert({ locationName, levelCm, risk }) {
  const cfg = RISK_CONFIG[risk];
  if (!cfg) return;

  const body = JSON.stringify({
    topic: NTFY_TOPIC,
    title: `${cfg.emoji} ${cfg.label} — ${locationName}`,
    message: `Ketinggian air: ${(levelCm / 100).toFixed(2)} m (${levelCm} cm). Harap waspada!`,
    priority: cfg.priority,
    tags: [cfg.tag, 'river'],
    click: 'rivereye://dashboard',
  });

  try {
    const res = await fetch(`${NTFY_URL}/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`[ntfy] ✓ ${cfg.label} terkirim — ${locationName} ${levelCm} cm`);
  } catch (err) {
    console.error('[ntfy] Gagal kirim notifikasi:', err.message);
  }
}

module.exports = { sendFloodAlert, NTFY_URL, NTFY_TOPIC };
