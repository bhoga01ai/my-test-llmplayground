/**
 * Simple logger utility for the application
 * In production, you might want to use a more sophisticated logging library like Winston
 */

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Formats log message with timestamp
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    console.log(this.formatMessage('info', message, meta));
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    console.error(this.formatMessage('error', message, meta));
  }

  /**
   * Log debug message (only in development)
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  /**
   * Log HTTP request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} duration - Request duration in ms
   */
  logRequest(req, res, duration) {
    const { method, url, ip } = req;
    const { statusCode } = res;
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;
    
    if (statusCode >= 400) {
      this.warn(message, { ip, userAgent: req.get('User-Agent') });
    } else {
      this.info(message, { ip });
    }
  }
}

// Export singleton instance
const logger = new Logger();

module.exports = { logger };