const { body, validationResult } = require('express-validator');

/**
 * Validation rules for POST /api/predictions
 */
const predictionValidationRules = [
  body('location_id')
    .notEmpty()
    .withMessage('location_id is required.')
    .escape(),

  body('predicted_level_cm')
    .notEmpty()
    .withMessage('predicted_level_cm is required.')
    .isFloat()
    .withMessage('predicted_level_cm must be a numeric (float) value.'),

  body('prediction_for_time')
    .notEmpty()
    .withMessage('prediction_for_time is required.')
    .isISO8601()
    .withMessage('prediction_for_time must be a valid ISO 8601 datetime string (e.g. 2026-04-20T10:00:00Z).')
    .toDate(),
];

/**
 * Middleware to check validation results.
 * Returns 400 Bad Request with error details if validation fails.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed. Please check the input data.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        received: e.value,
      })),
    });
  }
  next();
};

module.exports = { predictionValidationRules, handleValidationErrors };
