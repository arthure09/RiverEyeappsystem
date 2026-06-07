const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'username and password are required.',
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, password_hash FROM admins WHERE username = $1',
      [username],
    );
    const admin = result.rows[0];

    const valid = admin && (await bcrypt.compare(password, admin.password_hash));
    if (!valid) {
      return res.status(401).json({
        status: 'error',
        message: 'Username atau password salah.',
      });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '12h' },
    );

    res.status(200).json({
      status: 'success',
      data: { token, username: admin.username },
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process login.',
    });
  }
};

// Cek token masih valid (dipakai web admin saat refresh halaman)
exports.me = async (req, res) => {
  res.status(200).json({ status: 'success', data: req.admin });
};
