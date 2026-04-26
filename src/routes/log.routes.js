const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { validateApiKey } = require('../middlewares/apiKey.middleware');
const { logValidationRules, handleValidationErrors } = require('../middlewares/validate.log.middleware');

router.post('/', validateApiKey('HARDWARE_API_KEY'), logValidationRules, handleValidationErrors, logController.createLog);
router.get('/', logController.getLogs);

module.exports = router;
