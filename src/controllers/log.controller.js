const pool = require('../config/db');
const { sendFloodAlert } = require('../services/ntfy');
const { generatePrediction } = require('../services/prediction.service');

exports.createLog = async (req, res) => {
  const { location_id, water_level_cm } = req.body;

  if (!location_id || water_level_cm === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'location_id and water_level_cm are required.',
    });
  }

  try {
    const result = await pool.query(
      'INSERT INTO sensor_logs (location_id, water_level_cm) VALUES ($1, $2) RETURNING *',
      [location_id, water_level_cm],
    );

    res.status(201).json({
      status: 'success',
      message: 'Water level log recorded successfully',
      data: result.rows[0],
    });

    // Cek level risiko dan kirim notifikasi ntfy secara async (tidak blokir response)
    setImmediate(async () => {
      try {
        const locRes = await pool.query(
          'SELECT name, risk_medium_cm, risk_high_cm FROM locations WHERE id = $1',
          [location_id],
        );
        if (!locRes.rows.length) return;

        const loc = locRes.rows[0];
        const med = Number(loc.risk_medium_cm ?? 150);
        const high = Number(loc.risk_high_cm ?? 200);
        const cm = Number(water_level_cm);

        if (cm >= high) {
          await sendFloodAlert({ locationName: loc.name, levelCm: cm, risk: 'bahaya' });
        } else if (cm >= med) {
          await sendFloodAlert({ locationName: loc.name, levelCm: cm, risk: 'waspada' });
        }
      } catch (err) {
        console.error('[notify] Error cek risiko:', err.message);
      }

      try {
        await generatePrediction(location_id);
      } catch (err) {
        console.error('[prediction] Error generate prediksi:', err.message);
      }
    });
  } catch (error) {
    console.error('Error recording sensor log:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record sensor log in the database.',
    });
  }
};

exports.getLogs = async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
  const offset = (page - 1) * limit;
  const { from, to } = req.query;

  const conditions = [];
  const values = [];
  if (from) { values.push(from); conditions.push(`timestamp >= $${values.length}`); }
  if (to)   { values.push(to);   conditions.push(`timestamp <= $${values.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM sensor_logs ${where}`, values),
      pool.query(
        `SELECT * FROM sensor_logs ${where} ORDER BY timestamp DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset],
      ),
    ]);

    const total = parseInt(countRes.rows[0].count, 10);
    res.status(200).json({
      status: 'success',
      data: dataRes.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve logs from the database.',
    });
  }
};
