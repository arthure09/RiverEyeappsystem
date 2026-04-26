/**
 * Middleware to validate API Key from the x-api-key request header.
 * @param {string} envKeyName - The environment variable name holding the valid key.
 * @returns Express middleware function
 */
const validateApiKey = (envKeyName) => {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env[envKeyName];

    if (!validKey) {
      console.error(`[Security] Environment variable "${envKeyName}" is not set.`);
      return res.status(500).json({
        status: 'error',
        message: 'Server misconfiguration: API key not configured.'
      });
    }

    if (!apiKey) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: Missing x-api-key header.'
      });
    }

    if (apiKey !== validKey) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: Invalid API key.'
      });
    }

    next();
  };
};

module.exports = { validateApiKey };
