const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const { requireAdmin } = require('../middlewares/auth.middleware');

// Publik (dibaca aplikasi mobile)
router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocationById);

// Hanya admin (dikelola lewat web admin)
router.post('/', requireAdmin, locationController.createLocation);
router.put('/:id', requireAdmin, locationController.updateLocation);
router.delete('/:id', requireAdmin, locationController.deleteLocation);

module.exports = router;
