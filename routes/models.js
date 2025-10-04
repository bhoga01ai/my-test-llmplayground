const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateRequest, validateModelCompatibility } = require('../middleware/validation');
const { moderateUserInput } = require('../middleware/contentModeration');
const { getProviderConfig } = require('../config/environment');
const { createModelService } = require('../services/modelService');
const { logger } = require('../utils/logger');
const { getGuardrailService } = require('../services/guardrailService');

const router = express.Router();

/**
 * GET /api/models/providers
 * Returns available AI providers and their status
 */
router.get('/providers', asyncHandler(async (req, res) => {
  const providers = ['openai', 'anthropic', 'groq', 'google'];
  const providerStatus = {};
  
  providers.forEach(provider => {
    const config = getProviderConfig(provider);
    providerStatus[provider] = {
      available: config.available,
      models: getProviderModels(provider)
    };
  });
  
  logger.info('Provider status requested', {
    ip: req.ip,
    availableProviders: Object.keys(providerStatus).filter(p => providerStatus[p].available)
  });
  
  res.json({
    providers: providerStatus,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/models/:provider
 * Returns available models for a specific provider
 */
router.get('/:provider', asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const config = getProviderConfig(provider);
  
  if (!config) {
    return res.status(404).json({
      error: 'Provider Not Found',
      message: `Provider '${provider}' is not supported`,
      supportedProviders: ['openai', 'anthropic', 'groq', 'google']
    });
  }
  
  if (!config.available) {
    return res.status(503).json({
      error: 'Provider Unavailable',
      message: `Provider '${provider}' is not configured or API key is missing`,
      provider
    });
  }
  
  const models = getProviderModels(provider);
  
  res.json({
    provider,
    models,
    available: true,
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/models/chat
 * Main endpoint for chat completions
 */
router.post('/chat', validateRequest, moderateUserInput, validateModelCompatibility, asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { prompt, model, provider, parameters } = req.validatedData;
  
  // Check if provider is available
  const config = getProviderConfig(provider);
  if (!config || !config.available) {
    return res.status(503).json({
      error: 'Provider Unavailable',
      message: `Provider '${provider}' is not configured or API key is missing`,
      provider
    });
  }
  
  try {
    // Initialize guardrail service
    const guardrailService = getGuardrailService();
    
    // Moderate user input if guardrails are enabled
    if (guardrailService.isEnabled()) {
      const inputModeration = await guardrailService.moderateInput(prompt);
      
      if (inputModeration.isSafe === false) {
        const safeResponse = guardrailService.handleUnsafeContent(inputModeration, prompt);
        
        return res.status(400).json({
          success: false,
          error: 'Content Policy Violation',
          message: safeResponse,
          moderation: {
            isSafe: false,
            attackType: inputModeration.attackType
          }
        });
      }
    }
    
    // Create model service instance
    const modelService = createModelService(provider, config);
    
    logger.info('Chat completion request started', {
      provider,
      model,
      promptLength: prompt.length,
      parameters,
      ip: req.ip,
      guardrailsEnabled: guardrailService.isEnabled()
    });
    
    // Make API call
    const response = await modelService.generateCompletion({
      prompt,
      model,
      parameters,
      conversation_history: req.body.conversation_history || []
    });
    
    // Moderate model response if guardrails are enabled
    let finalContent = response.content;
    let moderationResult = { isSafe: true };
    
    if (guardrailService.isEnabled()) {
      moderationResult = await guardrailService.moderateResponse(response.content);
      
      // Add moderation info to the response
      response.moderated = moderationResult.isSafe === false;
      response.moderationResult = moderationResult;
      
      if (!moderationResult.isSafe) {
        finalContent = guardrailService.handleUnsafeContent(moderationResult, response.content);
        response.original_content = response.content;
        
        logger.warn('Response moderation applied', {
          categories: moderationResult.flaggedCategories || [],
          responseLength: response.content.length
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('Chat completion request completed', {
      provider,
      model,
      duration,
      responseLength: response.content?.length || 0,
      tokensUsed: response.usage || 'unknown',
      responseSafe: moderationResult.isSafe
    });
    
    // Return standardized response
    res.json({
      success: true,
      provider,
      model,
      response: {
        content: finalContent,
        usage: response.usage,
        metadata: response.metadata,
        moderated: !moderationResult.isSafe
      },
      duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Chat completion request failed', {
      provider,
      model,
      duration,
      error: error.message,
      ip: req.ip
    });
    
    // Re-throw error to be handled by error middleware
    throw error;
  }
}));

/**
 * POST /api/models/stream
 * Streaming endpoint for chat completions
 */
router.post('/stream', validateRequest, moderateUserInput, validateModelCompatibility, asyncHandler(async (req, res) => {
  const { prompt, model, provider, parameters } = req.validatedData;
  
  // Check if provider is available
  const config = getProviderConfig(provider);
  if (!config || !config.available) {
    return res.status(503).json({
      error: 'Provider Unavailable',
      message: `Provider '${provider}' is not configured or API key is missing`,
      provider
    });
  }
  
  try {
    // Initialize guardrail service
    const guardrailService = getGuardrailService();
    
    // Moderate user input if guardrails are enabled
    if (guardrailService.isEnabled()) {
      const inputModeration = await guardrailService.moderateInput(prompt);
      
      if (!inputModeration.isSafe) {
        // For streaming, we need to send the error in SSE format
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        const safeResponse = guardrailService.handleUnsafeContent(inputModeration, prompt);
        
        const errorChunk = {
          error: 'Content Policy Violation',
          message: safeResponse,
          moderation: {
            isSafe: false,
            attackType: inputModeration.attackType
          }
        };
        
        res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    }
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Create model service instance
    const modelService = createModelService(provider, config);
    
    logger.info('Streaming chat completion request started', {
      provider,
      model,
      promptLength: prompt.length,
      ip: req.ip,
      guardrailsEnabled: guardrailService.isEnabled()
    });
    
    // For streaming, we can only moderate the input, not the output
    // as we don't have the full response until the stream is complete
    
    // Start streaming
    await modelService.generateStreamingCompletion({
      prompt,
      model,
      parameters: { ...parameters, stream: true }
    }, (chunk) => {
      // Send chunk to client
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });
    
    // End stream
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    logger.error('Streaming chat completion request failed', {
      provider,
      model,
      error: error.message,
      ip: req.ip
    });
    
    // Send error event
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}));

/**
 * Helper function to get available models for a provider
 * @param {string} provider - Provider name
 * @returns {Array} Array of available models
 */
function getProviderModels(provider) {
  const modelMap = {
    openai: [
      { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model, best for complex tasks' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Faster and more efficient GPT-4' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest GPT-4 optimized model' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Compact version of GPT-4o' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient for most tasks' }
    ],
    groq: [
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Fast Llama model for quick responses' },
      { id: 'gemma2-9b-it', name: 'Gemma2 9B IT', description: 'Google Gemma2 instruction-tuned model' },
      { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', description: 'Large open-source GPT model' }
    ],
    google: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most advanced Gemini model' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and efficient Gemini model' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', description: 'Lightweight Gemini model' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Previous generation fast Gemini model' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', description: 'Previous generation lightweight Gemini model' }
    ],
    anthropic: [
      { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', description: 'Latest Claude Opus model' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: 'Most powerful Claude model' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Balanced Claude model for most tasks' }
    ]
  };
  
  return modelMap[provider] || [];
}

module.exports = router;