/**
 * LlamaGuardService - Service for moderating model responses using Meta's Llama-Guard-3-8B
 * This service provides content moderation capabilities to ensure model responses
 * adhere to safety guidelines and do not contain harmful content.
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const { APIError, ConfigurationError } = require('../middleware/errorHandler');

class LlamaGuardService {
  constructor(config) {
    if (!config || !config.apiKey) {
      throw new ConfigurationError('Llama Guard service requires an API key');
    }
    
    this.config = config;
    this.baseURL = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'meta-llama/Llama-Guard-3-8B';
    
    logger.info('LlamaGuardService initialized', {
      model: this.model,
      baseURL: this.baseURL
    });
  }
  
  /**
   * Moderates a model response to check for unsafe content
   * @param {string} response - The model response to moderate
   * @returns {Object} Moderation result with safety assessment
   */
  async moderateResponse(response) {
    try {
      const startTime = Date.now();
      
      // Format the prompt for Llama Guard
      const prompt = this._formatPromptForResponseModeration(response);
      
      // Call the Llama Guard model
      const result = await this._callLlamaGuard(prompt);
      
      // Parse the result
      const moderationResult = this._parseModeration(result);
      
      const duration = Date.now() - startTime;
      logger.info('Response moderation completed', {
        duration,
        isSafe: moderationResult.isSafe,
        categories: moderationResult.flaggedCategories
      });
      
      return moderationResult;
    } catch (error) {
      logger.error('Response moderation failed', {
        error: error.message,
        stack: error.stack
      });
      throw new APIError(`Moderation failed: ${error.message}`, 'MODERATION_ERROR');
    }
  }
  
  /**
   * Formats the prompt for Llama Guard to moderate a response
   * @param {string} response - The model response to moderate
   * @returns {string} Formatted prompt for Llama Guard
   * @private
   */
  _formatPromptForResponseModeration(response) {
    return [
      { role: "system", content: "You are a helpful assistant that evaluates if a response is safe or unsafe based on the MLCommons hazard taxonomy." },
      { role: "user", content: `Please evaluate the following response for safety:\n\n${response}\n\nIs this response safe or unsafe? If unsafe, list the specific categories it violates.` }
    ];
  }
  
  /**
   * Calls the Llama Guard model with the formatted prompt
   * @param {Array} messages - The formatted messages for Llama Guard
   * @returns {string} Raw response from Llama Guard
   * @private
   */
  async _callLlamaGuard(messages) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: 0.1, // Low temperature for more deterministic results
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Llama Guard API call failed', {
        error: error.message,
        response: error.response?.data
      });
      throw new APIError(`Llama Guard API error: ${error.message}`, 'LLAMA_GUARD_API_ERROR');
    }
  }
  
  /**
   * Parses the raw moderation result from Llama Guard
   * @param {string} result - Raw response from Llama Guard
   * @returns {Object} Structured moderation result
   * @private
   */
  _parseModeration(result) {
    // Default to safe if we can't parse the result
    const defaultResult = {
      isSafe: true,
      flaggedCategories: [],
      rawResponse: result
    };
    
    try {
      // Check if the response contains "unsafe" (case insensitive)
      const isUnsafe = /unsafe/i.test(result);
      
      // Extract categories if unsafe
      let flaggedCategories = [];
      if (isUnsafe) {
        // Look for category mentions in the MLCommons taxonomy
        const categoryPatterns = [
          /\bviolence\b/i,
          /\bharassment\b/i,
          /\bhate\b/i,
          /\bself-harm\b/i,
          /\bsexual\b/i,
          /\bchild abuse\b/i,
          /\billegal activity\b/i,
          /\bprivacy\b/i,
          /\bdeception\b/i,
          /\bmalware\b/i
        ];
        
        categoryPatterns.forEach(pattern => {
          if (pattern.test(result)) {
            // Extract the category name from the pattern
            const categoryName = pattern.toString().match(/\\b(\w+(-\w+)?)\\b/)[1];
            flaggedCategories.push(categoryName);
          }
        });
      }
      
      return {
        isSafe: !isUnsafe,
        flaggedCategories,
        rawResponse: result
      };
    } catch (error) {
      logger.error('Failed to parse moderation result', {
        error: error.message,
        result
      });
      return defaultResult;
    }
  }
}

module.exports = LlamaGuardService;