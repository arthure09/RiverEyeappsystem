const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const locationRoutes = require('./location.routes');
const logRoutes = require('./log.routes');
const predictionRoutes = require('./prediction.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/locations', locationRoutes);
router.use('/logs', logRoutes);
router.use('/predictions', predictionRoutes);

module.exports = router;
