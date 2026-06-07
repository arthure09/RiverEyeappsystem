require('dotenv').config();
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

// Root route
app.get('/', (req, res) => {
  res.send('RiverEye API is running. Check /api/locations, /api/logs, and /api/predictions');
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
