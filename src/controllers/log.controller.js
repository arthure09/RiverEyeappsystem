const pool = require('../config/db');

exports.createLog = async (req, res) => {
  const { location_id, water_level_cm } = req.body;
  
  if (!location_id || water_level_cm === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'location_id and water_level_cm are required.'
    });
  }
  
  try {
    const query = `
      INSERT INTO sensor_logs (location_id, water_level_cm)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [location_id, water_level_cm]);
    
    res.status(201).json({
      status: 'success',
      message: 'Water level log recorded successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording sensor log:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record sensor log in the database.'
    });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sensor_logs');
    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve logs from the database.'
    });
  }
};
