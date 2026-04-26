const { body, validationResult } = require('express-validator');

/**
 * Validation rules for POST /api/logs
 */
const logValidationRules = [
  body('location_id')
    .notEmpty()
    .withMessage('location_id is required.')
    .escape(),

  body('water_level_cm')
    .notEmpty()
    .withMessage('water_level_cm is required.')
    .isFloat()
    .withMessage('water_level_cm must be a numeric (float) value.'),
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

module.exports = { logValidationRules, handleValidationErrors };
