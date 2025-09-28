const { logger } = require('../utils/logger');

/**
 * Custom error class for API-related errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, provider = null, originalError = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.provider = provider;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Custom error class for configuration-related errors
 */
class ConfigurationError extends Error {
  constructor(message, provider = null) {
    super(message);
    this.name = 'ConfigurationError';
    this.statusCode = 500;
    this.provider = provider;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Custom error class for validation-related errors
 */
class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Maps HTTP status codes to user-friendly messages
 * @param {number} statusCode - HTTP status code
 * @returns {string} User-friendly message
 */
function getErrorMessage(statusCode) {
  const errorMessages = {
    400: 'Bad Request - Please check your input parameters',
    401: 'Unauthorized - Invalid or missing API key',
    403: 'Forbidden - Access denied to the requested resource',
    404: 'Not Found - The requested resource was not found',
    429: 'Rate Limited - Too many requests, please try again later',
    500: 'Internal Server Error - Something went wrong on our end',
    502: 'Bad Gateway - The AI service is temporarily unavailable',
    503: 'Service Unavailable - The AI service is temporarily down',
    504: 'Gateway Timeout - The AI service took too long to respond'
  };
  
  return errorMessages[statusCode] || 'An unexpected error occurred';
}

/**
 * Formats error response based on error type
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(error, req) {
  const baseResponse = {
    error: error.name || 'Error',
    message: error.message,
    timestamp: error.timestamp || new Date().toISOString(),
    requestId: req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  // Add provider information if available
  if (error.provider) {
    baseResponse.provider = error.provider;
  }
  
  // Add validation details if available
  if (error.details && Array.isArray(error.details)) {
    baseResponse.details = error.details;
  }
  
  // Add user-friendly message for HTTP errors
  if (error.statusCode) {
    baseResponse.userMessage = getErrorMessage(error.statusCode);
  }
  
  // In development, include stack trace
  if (process.env.NODE_ENV === 'development' && error.stack) {
    baseResponse.stack = error.stack;
  }
  
  return baseResponse;
}

/**
 * Express error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }
  
  // Determine status code
  let statusCode = err.statusCode || 500;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 502;
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
  }
  
  // Log error details
  const logData = {
    error: err.name || 'UnknownError',
    message: err.message,
    statusCode,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    provider: err.provider || 'unknown'
  };
  
  if (statusCode >= 500) {
    logger.error('Server error occurred', logData);
    if (err.stack) {
      logger.error('Stack trace:', { stack: err.stack });
    }
  } else {
    logger.warn('Client error occurred', logData);
  }
  
  // Format and send error response
  const errorResponse = formatErrorResponse(err, req);
  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function that catches async errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  APIError,
  ConfigurationError,
  ValidationError,
  errorHandler,
  asyncHandler,
  formatErrorResponse
};