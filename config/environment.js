const Joi = require('joi');
const { logger } = require('../utils/logger');

// Environment variable schema
const envSchema = Joi.object({
  // Server configuration
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  
  // OpenAI configuration
  OPENAI_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  OPENAI_BASE_URL: Joi.string().uri().default('https://api.openai.com/v1'),
  
  // Anthropic configuration
  ANTHROPIC_API_KEY: Joi.string().optional(),
  ANTHROPIC_BASE_URL: Joi.string().uri().default('https://api.anthropic.com'),
  
  // Groq configuration
  GROQ_API_KEY: Joi.string().optional(),
  GROQ_BASE_URL: Joi.string().uri().default('https://api.groq.com/openai/v1'),
  
  // Google AI configuration
  GOOGLE_AI_API_KEY: Joi.string().optional(),
  GOOGLE_AI_BASE_URL: Joi.string().uri().default('https://generativelanguage.googleapis.com'),
  
  // Llama Guard configuration
  LLAMA_GUARD_API_KEY: Joi.string().optional(),
  LLAMA_GUARD_BASE_URL: Joi.string().uri().default('https://api.openai.com/v1'),
  LLAMA_GUARD_RESPONSE_MODEL: Joi.string().default('meta-llama/Llama-Guard-3-8B'),
  LLAMA_GUARD_PROMPT_MODEL: Joi.string().default('meta-llama/Llama-Prompt-Guard-2-86M'),
  ENABLE_GUARDRAILS: Joi.boolean().default(true),
  
  // Default model parameters
  DEFAULT_TEMPERATURE: Joi.number().min(0).max(2).default(0.7),
  DEFAULT_MAX_TOKENS: Joi.number().min(1).max(8000).default(1000),
  DEFAULT_TOP_P: Joi.number().min(0).max(1).default(1.0),
  DEFAULT_FREQUENCY_PENALTY: Joi.number().min(-2).max(2).default(0.0),
  DEFAULT_PRESENCE_PENALTY: Joi.number().min(-2).max(2).default(0.0)
}).unknown();

/**
 * Validates environment variables against the schema
 * @returns {Object} Validated environment configuration
 */
function validateEnvironment() {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    logger.error('Environment validation failed:', error.details);
    throw new Error(`Environment validation error: ${error.message}`);
  }
  
  // Check if at least one API key is provided
  const hasApiKey = value.OPENAI_API_KEY || 
                   value.ANTHROPIC_API_KEY || 
                   value.GROQ_API_KEY ||
                   value.GOOGLE_AI_API_KEY ||
                   value.LLAMA_GUARD_API_KEY;
  
  if (!hasApiKey && value.NODE_ENV === 'production') {
    throw new Error('At least one AI model API key must be provided in production');
  }
  
  logger.info('Environment validation successful');
  
  // Log available providers (without exposing keys)
  const availableProviders = [];
  if (value.OPENAI_API_KEY) availableProviders.push('OpenAI');
  if (value.ANTHROPIC_API_KEY) availableProviders.push('Anthropic');
  if (value.GROQ_API_KEY) availableProviders.push('Groq');
  if (value.GOOGLE_AI_API_KEY) availableProviders.push('Google AI');
  if (value.LLAMA_GUARD_API_KEY) availableProviders.push('Llama Guard');
  
  logger.info(`Available AI providers: ${availableProviders.join(', ') || 'None (development mode)'}`);
  
  return value;
}

/**
 * Gets configuration for a specific provider
 * @param {string} provider - The provider name (openai, anthropic, google, cohere)
 * @returns {Object} Provider configuration
 */
function getProviderConfig(provider) {
  const configs = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL,
      available: !!process.env.OPENAI_API_KEY
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL,
      available: !!process.env.ANTHROPIC_API_KEY
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: process.env.GROQ_BASE_URL,
      available: !!process.env.GROQ_API_KEY
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY,
      baseUrl: process.env.GOOGLE_AI_BASE_URL,
      available: !!process.env.GOOGLE_AI_API_KEY
    },
    llamaGuard: {
      apiKey: process.env.LLAMA_GUARD_API_KEY,
      baseUrl: process.env.LLAMA_GUARD_BASE_URL,
      responseModel: process.env.LLAMA_GUARD_RESPONSE_MODEL,
      promptModel: process.env.LLAMA_GUARD_PROMPT_MODEL,
      enabled: process.env.ENABLE_GUARDRAILS === 'true',
      available: !!process.env.LLAMA_GUARD_API_KEY
    }
  };
  
  return configs[provider.toLowerCase()];
}

/**
 * Gets default model parameters from environment
 * @returns {Object} Default parameters
 */
function getDefaultParameters() {
  return {
    temperature: parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
    max_tokens: parseInt(process.env.DEFAULT_MAX_TOKENS) || 1000,
    top_p: parseFloat(process.env.DEFAULT_TOP_P) || 1.0,
    frequency_penalty: parseFloat(process.env.DEFAULT_FREQUENCY_PENALTY) || 0.0,
    presence_penalty: parseFloat(process.env.DEFAULT_PRESENCE_PENALTY) || 0.0
  };
}

module.exports = {
  validateEnvironment,
  getProviderConfig,
  getDefaultParameters
};