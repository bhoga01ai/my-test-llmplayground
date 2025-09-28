const Joi = require('joi');
const { logger } = require('../utils/logger');

// Request validation schema
const requestSchema = Joi.object({
  prompt: Joi.string().required().min(1).max(10000).messages({
    'string.empty': 'Prompt cannot be empty',
    'string.min': 'Prompt must be at least 1 character long',
    'string.max': 'Prompt cannot exceed 10000 characters',
    'any.required': 'Prompt is required'
  }),
  
  model: Joi.string().required().valid(
    // OpenAI models
    'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo',
    // Groq models
    'llama-3.1-8b-instant', 'gemma2-9b-it', 'openai/gpt-oss-120b',
    // Google models
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite',
    // Anthropic models
    'claude-opus-4-1-20250805', 'claude-opus-4-20250514', 'claude-sonnet-4-20250514'
  ).messages({
    'any.only': 'Invalid model selection',
    'any.required': 'Model selection is required'
  }),
  
  provider: Joi.string().required().valid('openai', 'anthropic', 'groq', 'google').messages({
    'any.only': 'Invalid provider selection',
    'any.required': 'Provider selection is required'
  }),
  
  parameters: Joi.object({
    temperature: Joi.number().min(0).max(2).default(0.7),
    max_tokens: Joi.number().min(1).max(8000).default(1000),
    top_p: Joi.number().min(0).max(1).default(1.0),
    frequency_penalty: Joi.number().min(-2).max(2).default(0.0),
    presence_penalty: Joi.number().min(-2).max(2).default(0.0),
    stop: Joi.array().items(Joi.string()).max(4).optional(),
    stream: Joi.boolean().default(false)
  }).default({})
});

/**
 * Middleware to validate incoming requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateRequest(req, res, next) {
  const startTime = Date.now();
  
  // Validate request body
  const { error, value } = requestSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    logger.warn('Request validation failed', {
      errors: validationErrors,
      ip: req.ip,
      duration: Date.now() - startTime
    });
    
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: validationErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  // Attach validated data to request
  req.validatedData = value;
  
  logger.debug('Request validation successful', {
    model: value.model,
    provider: value.provider,
    promptLength: value.prompt.length,
    duration: Date.now() - startTime
  });
  
  next();
}

/**
 * Validates model compatibility with provider
 * @param {string} model - Model name
 * @param {string} provider - Provider name
 * @returns {boolean} Whether the model is compatible with the provider
 */
function validateModelProvider(model, provider) {
  const modelProviderMap = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    groq: ['llama-3.1-8b-instant', 'gemma2-9b-it', 'openai/gpt-oss-120b'],
    google: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
    anthropic: ['claude-opus-4-1-20250805', 'claude-opus-4-20250514', 'claude-sonnet-4-20250514']
  };
  
  return modelProviderMap[provider]?.includes(model) || false;
}

/**
 * Middleware to validate model-provider compatibility
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateModelCompatibility(req, res, next) {
  const { model, provider } = req.validatedData;
  
  if (!validateModelProvider(model, provider)) {
    logger.warn('Model-provider compatibility check failed', {
      model,
      provider,
      ip: req.ip
    });
    
    return res.status(400).json({
      error: 'Compatibility Error',
      message: `Model '${model}' is not compatible with provider '${provider}'`,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

module.exports = {
  validateRequest,
  validateModelProvider,
  validateModelCompatibility
};