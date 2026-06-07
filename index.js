require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const apiRoutes = require('./src/routes'); // Automatically loads index.js mapping the other modules

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// All API routes
app.use('/api', apiRoutes);

// Sajikan web admin (hasil build Vite) di /admin jika tersedia
const adminDist = path.join(__dirname, 'admin', 'dist');
if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist));
  // SPA fallback: semua sub-route /admin diarahkan ke index.html
  app.get('/admin/*splat', (req, res) => {
    res.sendFile(path.join(adminDist, 'index.html'));
  });
}

// Root route
app.get('/', (req, res) => {
  res.send('RiverEye API is running. Check /api/locations, /api/logs, and /api/predictions');
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
