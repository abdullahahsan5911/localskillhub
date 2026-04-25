export const errorHandler = (err, req, res, next) => {
  // Log concise, structured error info to avoid leaking internal objects in logs
  const logEntry = {
    message: err.message || 'Internal server error',
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
  };

  // For validation errors include field-level messages
  if (err.name === 'ValidationError') {
    logEntry.validation = Object.keys(err.errors || {}).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  }

  // Only include stack in logs when explicitly enabled (DEV or LOG_STACKS=true)
  if (process.env.LOG_STACKS === 'true' || process.env.NODE_ENV === 'development') {
    logEntry.stack = err.stack;
  }

  console.error('❌ Error:', JSON.stringify(logEntry));

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      status: 'error',
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired'
    });
  }

  // Default error - NEVER send stack trace to client
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
};

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
