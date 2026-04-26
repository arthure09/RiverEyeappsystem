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
  try {
    const result = await pool.query('SELECT * FROM ml_predictions');
    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve predictions from the database.'
    });
  }
};
