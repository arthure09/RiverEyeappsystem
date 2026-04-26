const pool = require('../config/db');

exports.getLocations = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations');
    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve locations from the database.'
    });
  }
};
