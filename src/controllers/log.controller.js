const pool = require('../config/db');
const { sendFloodAlert } = require('../services/ntfy');

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
  try {
    const result = await pool.query('SELECT * FROM sensor_logs');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve logs from the database.',
    });
  }
};
