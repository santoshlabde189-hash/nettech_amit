/**
 * Central Error Handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Details]:', err);
  }

  // Multer File Size Error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds maximum limit of 2 MB',
      errors: [{ field: 'avatar', msg: 'File size exceeds maximum limit of 2 MB' }]
    });
  }

  // Multer Custom Error
  if (err.message === 'Only JPG and PNG image files are allowed') {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [{ field: 'avatar', msg: err.message }]
    });
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: `Resource not found with id of ${err.value}`
    });
  }

  // Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      errors: [{ field, msg: `${field} already exists` }]
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      msg: val.message
    }));
    return res.status(400).json({
      success: false,
      message: errors[0]?.msg || 'Validation Error',
      errors
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired'
    });
  }

  const statusCode = res.statusCode !== 200 && res.statusCode !== 201 ? res.statusCode : (err.statusCode || 500);

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
