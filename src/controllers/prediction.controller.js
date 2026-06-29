const pool = require('../config/db');

exports.createPrediction = async (req, res) => {
  const { location_id, predicted_level_cm, prediction_for_time } = req.body;
  
  if (!location_id || predicted_level_cm === undefined || !prediction_for_time) {
    return res.status(400).json({
      status: 'error',
      message: 'location_id, predicted_level_cm, and prediction_for_time are required.'
    });
  }

  try {
    const query = `
      INSERT INTO ml_predictions (location_id, predicted_level_cm, prediction_for_time)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [location_id, predicted_level_cm, prediction_for_time]);
    
    res.status(201).json({
      status: 'success',
      message: 'Prediction recorded successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording ML prediction:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record prediction in the database.'
    });
  }
};

exports.getPredictions = async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  try {
    const [countRes, dataRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM ml_predictions'),
      pool.query(
        'SELECT * FROM ml_predictions ORDER BY timestamp DESC LIMIT $1 OFFSET $2',
        [limit, offset],
      ),
    ]);
    const total = parseInt(countRes.rows[0].count, 10);
    res.status(200).json({
      status: 'success',
      data: dataRes.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve predictions from the database.',
    });
  }
};
