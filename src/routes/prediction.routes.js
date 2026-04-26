const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediction.controller');
const { validateApiKey } = require('../middlewares/apiKey.middleware');
const { predictionValidationRules, handleValidationErrors } = require('../middlewares/validate.prediction.middleware');

router.post('/', validateApiKey('ML_API_KEY'), predictionValidationRules, handleValidationErrors, predictionController.createPrediction);
router.get('/', predictionController.getPredictions);

module.exports = router;
