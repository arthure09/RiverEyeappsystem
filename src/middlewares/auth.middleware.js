const jwt = require('jsonwebtoken');

// Middleware proteksi route admin: verifikasi JWT dari header Authorization: Bearer <token>
const requireAdmin = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Missing admin token.',
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[Security] JWT_SECRET is not set.');
    return res.status(500).json({
      status: 'error',
      message: 'Server misconfiguration: JWT secret not configured.',
    });
  }

  try {
    req.admin = jwt.verify(token, secret);
    next();
  } catch {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Invalid or expired token.',
    });
  }
};

module.exports = { requireAdmin };
