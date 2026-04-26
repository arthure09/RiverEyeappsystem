const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');

router.get('/', locationController.getLocations);

module.exports = router;
