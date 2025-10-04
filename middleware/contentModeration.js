/**
 * Content moderation middleware
 * This middleware provides validation for user inputs using Llama Prompt Guard
 */

const { getGuardrailService } = require('../services/guardrailService');
const { logger } = require('../utils/logger');
const { APIError } = require('./errorHandler');

/**
 * Middleware to moderate user input before processing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function moderateUserInput(req, res, next) {
  // Skip moderation if no prompt is provided or if it's already been validated
  if (!req.body.prompt || req.inputModerated) {
    return next();
  }
  
  const guardrailService = getGuardrailService();
  
  // Force enable guardrails for testing
  // if (!guardrailService.isEnabled()) {
  //   return next();
  // }
  
  try {
    const prompt = req.body.prompt;
    const moderationResult = await guardrailService.moderateInput(prompt);
    
    // Store moderation result for later use
    req.inputModerated = true;
    req.inputModerationResult = moderationResult;
    
    if (moderationResult.isSafe === false) {
      const safeResponse = guardrailService.handleUnsafeContent(moderationResult, prompt);
      
      logger.warn('Content moderation blocked request', {
        attackType: moderationResult.attackType,
        promptLength: prompt.length,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: 'Content Policy Violation',
        message: safeResponse,
        moderation: {
          isSafe: false,
          attackType: moderationResult.attackType
        }
      });
    }
    
    // Input is safe, continue to next middleware
    next();
  } catch (error) {
    logger.error('Content moderation middleware error', {
      error: error.message,
      stack: error.stack
    });
    
    // Continue processing even if moderation fails
    // This is a fail-open approach for moderation
    next();
  }
}

module.exports = {
  moderateUserInput
};