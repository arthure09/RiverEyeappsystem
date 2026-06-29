const pool = require('../config/db');

// Regresi linier sederhana pada array [{t, y}]
// t = detik relatif dari titik pertama, y = water_level_cm
function linearRegression(points) {
  const n = points.length;
  const sumT  = points.reduce((s, p) => s + p.t, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumTY = points.reduce((s, p) => s + p.t * p.y, 0);
  const sumTT = points.reduce((s, p) => s + p.t * p.t, 0);

  const denom = n * sumTT - sumT * sumT;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope     = (n * sumTY - sumT * sumY) / denom;
  const intercept = (sumY - slope * sumT) / n;
  return { slope, intercept };
}

// Horizons: 1 jam dan 3 jam ke depan
const HORIZONS_SEC = [3600, 10800];

async function generatePrediction(locationId) {
  const { rows } = await pool.query(
    `SELECT water_level_cm, timestamp FROM sensor_logs
     WHERE location_id = $1
     ORDER BY timestamp DESC LIMIT 10`,
    [locationId],
  );

  if (rows.length < 2) return; // data tidak cukup

  // Cek apakah data terakhir masih relevan (max 24 jam lalu)
  const latestAge = Date.now() - new Date(rows[0].timestamp).getTime();
  if (latestAge > 24 * 3600 * 1000) return;

  const sorted = rows.reverse(); // urutan kronologis
  const t0 = new Date(sorted[0].timestamp).getTime();

  const points = sorted.map((r) => ({
    t: (new Date(r.timestamp).getTime() - t0) / 1000,
    y: Number(r.water_level_cm),
  }));

  const { slope, intercept } = linearRegression(points);
  const tNow = (Date.now() - t0) / 1000;
  const now  = Date.now();

  // Hapus prediksi masa depan lama untuk lokasi ini (diganti yang baru)
  await pool.query(
    `DELETE FROM ml_predictions WHERE location_id = $1 AND prediction_for_time > NOW()`,
    [locationId],
  );

  for (const horizon of HORIZONS_SEC) {
    const predicted = Math.max(0, slope * (tNow + horizon) + intercept);
    const predictionForTime = new Date(now + horizon * 1000);

    await pool.query(
      `INSERT INTO ml_predictions (location_id, predicted_level_cm, prediction_for_time)
       VALUES ($1, $2, $3)`,
      [locationId, Math.round(predicted * 10) / 10, predictionForTime],
    );
  }
}

module.exports = { generatePrediction };
