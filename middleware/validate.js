const { validationResult } = require('express-validator');

/**
 * Middleware to evaluate express-validator results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      msg: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0]?.msg || 'Validation failed',
      errors: formattedErrors
    });
  }
  next();
};

module.exports = validate;
