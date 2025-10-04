const axios = require('axios');
const { APIError, ConfigurationError } = require('../middleware/errorHandler');
const { getDefaultParameters } = require('../config/environment');
const { logger } = require('../utils/logger');

/**
 * Base class for AI model services
 */
class BaseModelService {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
    this.defaultParams = getDefaultParameters();
    
    if (!config.apiKey) {
      throw new ConfigurationError(`API key not configured for ${provider}`, provider);
    }
  }
  
  /**
   * Merges user parameters with defaults
   * @param {Object} userParams - User-provided parameters
   * @returns {Object} Merged parameters
   */
  mergeParameters(userParams = {}) {
    return {
      ...this.defaultParams,
      ...userParams
    };
  }
  
  /**
   * Handles API errors and converts them to standardized format
   * @param {Error} error - Original error
   * @param {string} operation - Operation being performed
   * @throws {APIError} Standardized API error
   */
  handleApiError(error, operation = 'API call') {
    if (error.response) {
      // HTTP error response
      const { status, data } = error.response;
      const message = data?.error?.message || data?.message || `${operation} failed`;
      throw new APIError(message, status, this.provider, error);
    } else if (error.request) {
      // Network error
      throw new APIError(`Network error during ${operation}`, 502, this.provider, error);
    } else {
      // Other error
      throw new APIError(`Unexpected error during ${operation}: ${error.message}`, 500, this.provider, error);
    }
  }
}

/**
 * OpenAI service implementation
 */
class OpenAIService extends BaseModelService {
  constructor(config) {
    super('openai', config);
    this.baseURL = config.baseUrl;
  }
  
  async generateCompletion({ prompt, model, parameters, conversation_history = [] }) {
    const params = this.mergeParameters(parameters);
    
    try {
      // Format messages for the API
      let messages = [];
      
      // Add conversation history if provided
      if (conversation_history && conversation_history.length > 0) {
        messages = [...conversation_history];
        
        // If the last message is from the user and matches our prompt, don't duplicate it
        const lastMessage = conversation_history[conversation_history.length - 1];
        if (lastMessage && lastMessage.role === 'user' && lastMessage.content === prompt) {
          // Don't add the prompt again
        } else {
          // Add the current prompt as a new user message
          messages.push({ role: 'user', content: prompt });
        }
      } else {
        // No history, just add the current prompt
        messages = [{ role: 'user', content: prompt }];
      }
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages: messages,
          temperature: params.temperature,
          max_tokens: params.max_tokens,
          top_p: params.top_p,
          frequency_penalty: params.frequency_penalty,
          presence_penalty: params.presence_penalty,
          stop: params.stop,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );
      
      const choice = response.data.choices[0];
      return {
        content: choice.message.content,
        usage: response.data.usage,
        metadata: {
          model: response.data.model,
          finish_reason: choice.finish_reason
        }
      };
    } catch (error) {
      this.handleApiError(error, 'OpenAI completion');
    }
  }
  
  async generateStreamingCompletion({ prompt, model, parameters }, onChunk) {
    const params = this.mergeParameters(parameters);
    
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: params.temperature,
          max_tokens: params.max_tokens,
          top_p: params.top_p,
          frequency_penalty: params.frequency_penalty,
          presence_penalty: params.presence_penalty,
          stop: params.stop,
          stream: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 60000
        }
      );
      
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;
              if (delta?.content) {
                onChunk({ content: delta.content, type: 'content' });
              }
            } catch (e) {
              // Ignore parsing errors for streaming
            }
          }
        }
      });
      
    } catch (error) {
      this.handleApiError(error, 'OpenAI streaming completion');
    }
  }
}

/**
 * Anthropic service implementation
 */
class AnthropicService extends BaseModelService {
  constructor(config) {
    super('anthropic', config);
    this.baseURL = config.baseUrl;
  }
  
  async generateCompletion({ prompt, model, parameters }) {
    const params = this.mergeParameters(parameters);
    
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/messages`,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: params.max_tokens,
          temperature: params.temperature,
          top_p: params.top_p,
          stop_sequences: params.stop
        },
        {
          headers: {
            'x-api-key': this.config.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          timeout: 60000
        }
      );
      
      return {
        content: response.data.content[0].text,
        usage: response.data.usage,
        metadata: {
          model: response.data.model,
          stop_reason: response.data.stop_reason
        }
      };
    } catch (error) {
      this.handleApiError(error, 'Anthropic completion');
    }
  }
  
  async generateStreamingCompletion({ prompt, model, parameters }, onChunk) {
    // Anthropic streaming implementation would go here
    // For now, fall back to non-streaming
    const result = await this.generateCompletion({ prompt, model, parameters });
    onChunk({ content: result.content, type: 'content' });
  }
}

/**
 * Groq service implementation
 */
class GroqService extends BaseModelService {
  constructor(config) {
    super('groq', config);
    this.baseURL = config.baseUrl;
  }
  
  async generateCompletion({ prompt, model, parameters }) {
    const params = this.mergeParameters(parameters);
    
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: params.temperature,
          max_tokens: params.max_tokens,
          top_p: params.top_p,
          frequency_penalty: params.frequency_penalty,
          presence_penalty: params.presence_penalty,
          stop: params.stop,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );
      
      const choice = response.data.choices[0];
      return {
        content: choice.message.content,
        usage: response.data.usage,
        metadata: {
          model: response.data.model,
          finish_reason: choice.finish_reason
        }
      };
    } catch (error) {
      this.handleApiError(error, 'Groq completion');
    }
  }
  
  async generateStreamingCompletion({ prompt, model, parameters }, onChunk) {
    const params = this.mergeParameters(parameters);
    
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: params.temperature,
          max_tokens: params.max_tokens,
          top_p: params.top_p,
          frequency_penalty: params.frequency_penalty,
          presence_penalty: params.presence_penalty,
          stop: params.stop,
          stream: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 60000
        }
      );
      
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;
              if (delta?.content) {
                onChunk({ content: delta.content, type: 'content' });
              }
            } catch (e) {
              // Ignore parsing errors for streaming
            }
          }
        }
      });
      
    } catch (error) {
      this.handleApiError(error, 'Groq streaming completion');
    }
  }
}



/**
 * Google AI service implementation
 */
class GoogleAIService extends BaseModelService {
  constructor(config) {
    super('google', config);
    this.baseURL = config.baseUrl || 'https://generativelanguage.googleapis.com';
    this.speechToTextEnabled = true;
    this.textToSpeechEnabled = true;
  }

  async generateCompletion({ prompt, model, parameters }) {
    const params = this.mergeParameters(parameters);
    
    try {
      const response = await axios.post(
        `${this.baseURL}/v1beta/models/${model}:generateContent`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: params.temperature,
            maxOutputTokens: params.max_tokens,
            topP: params.top_p,
            stopSequences: params.stop
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            key: this.config.apiKey
          },
          timeout: 60000
        }
      );
      
      const candidate = response.data.candidates?.[0];
      if (!candidate) {
        throw new APIError('No response generated', 'GOOGLE_AI_NO_RESPONSE');
      }
      
      return {
        content: candidate.content.parts[0].text,
        metadata: {
          model: model,
          finish_reason: candidate.finishReason
        }
      };
    } catch (error) {
      this.handleApiError(error, 'Google AI completion');
    }
  }
  
  async generateStreamingCompletion({ prompt, model, parameters }, onChunk) {
    // Google AI streaming implementation would go here
    // For now, fall back to non-streaming
    const result = await this.generateCompletion({ prompt, model, parameters });
    onChunk({ content: result.content, type: 'content' });
    onChunk({ type: 'done' });
  }
  
  /**
   * Transcribe speech to text using Gemini model
   * @param {Object} options - Transcription options
   * @param {ArrayBuffer} options.audioData - Audio data as ArrayBuffer
   * @param {string} options.model - Model name (defaults to gemini-2.5-flash-lite)
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeSpeech({ audioData, model = 'gemini-2.5-flash-lite' }) {
    if (!this.speechToTextEnabled) {
      throw new ConfigurationError('Speech-to-text is not enabled for this provider', 'google');
    }
    
    try {
      // Convert audio data to base64
      const audioBase64 = Buffer.from(audioData, 'base64').toString('base64');
      
      // Log audio data length for debugging
      logger.debug(`Audio data length: ${audioBase64.length} characters`);
      
      const response = await axios.post(
        `${this.baseURL}/v1beta/models/${model}:generateContent`,
        {
          contents: [{
            parts: [
              { inline_data: { mime_type: "audio/wav", data: audioBase64 } }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40
          },
          tools: [{
            functionDeclarations: [{
              name: "speech_to_text",
              description: "Convert speech audio to text",
              parameters: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    description: "The transcribed text from the audio"
                  }
                },
                required: ["text"]
              }
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            key: this.config.apiKey
          },
          timeout: 60000
        }
      );
      
      // Log the response structure for debugging
      logger.debug('Google AI speech transcription response:', JSON.stringify(response.data, null, 2));
      
      const candidate = response.data.candidates?.[0];
      if (!candidate) {
        throw new APIError('No transcription generated', 'GOOGLE_AI_NO_RESPONSE');
      }
      
      // Check for function call response
      const functionCallPart = candidate.content.parts.find(part => part.functionCall?.name === 'speech_to_text');
      if (functionCallPart) {
        const args = JSON.parse(functionCallPart.functionCall.args);
        return {
          text: args.text,
          metadata: {
            model: model,
            finish_reason: candidate.finishReason
          }
        };
      }
      
      // Fallback to regular text response
      return {
        text: candidate.content.parts[0].text,
        metadata: {
          model: model,
          finish_reason: candidate.finishReason
        }
      };
    } catch (error) {
      this.handleApiError(error, 'Google AI speech transcription');
    }
  }
  
  /**
   * Generate speech from text using Gemini model
   * @param {Object} options - Speech synthesis options
   * @param {string} options.text - Text to convert to speech
   * @param {string} options.model - Model name (defaults to gemini-2.5-flash-lite)
   * @returns {Promise<Object>} Speech synthesis result with audio data
   */
  async generateSpeech({ text, model = 'gemini-2.5-flash-lite' }) {
    if (!this.textToSpeechEnabled) {
      throw new ConfigurationError('Text-to-speech is not enabled for this provider', 'google');
    }
    
    try {
      // Use the proper Gemini API endpoint for text-to-speech
      const response = await axios.post(
        `${this.baseURL}/v1beta/models/${model}:generateContent`,
        {
          contents: [{
            parts: [{ text }]
          }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40
          },
          tools: [{
            functionDeclarations: [{
              name: "text_to_speech",
              description: "Convert text to speech audio",
              parameters: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    description: "The text to convert to speech"
                  }
                },
                required: ["text"]
              }
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            key: this.config.apiKey
          },
          timeout: 60000
        }
      );
      
      // Log the response structure for debugging
      logger.debug('Google AI speech synthesis response:', JSON.stringify(response.data, null, 2));
      
      const candidate = response.data.candidates?.[0];
      if (!candidate) {
        throw new APIError('No speech generated', 'GOOGLE_AI_NO_RESPONSE');
      }
      
      // Extract audio data from response
      const audioData = candidate.content.parts.find(part => part.functionCall?.name === 'text_to_speech' || part.inline_data?.mime_type?.startsWith('audio/'));
      
      if (!audioData) {
        throw new APIError('No audio data in response', 'GOOGLE_AI_NO_AUDIO');
      }
      
      // Handle different response formats
      if (audioData.inline_data) {
        return {
          audioData: Buffer.from(audioData.inline_data.data, 'base64'),
          mimeType: audioData.inline_data.mime_type || 'audio/wav',
          metadata: {
            model: model,
            finish_reason: candidate.finishReason
          }
        };
      } else if (audioData.functionCall) {
        // If the response contains a function call with audio data
        const args = JSON.parse(audioData.functionCall.args);
        if (args.audio_data) {
          return {
            audioData: Buffer.from(args.audio_data, 'base64'),
            mimeType: args.mime_type || 'audio/wav',
            metadata: {
              model: model,
              finish_reason: candidate.finishReason
            }
          };
        }
      }
      
      throw new APIError('Unexpected response format from Gemini API', 'GOOGLE_AI_UNEXPECTED_FORMAT');
    } catch (error) {
      this.handleApiError(error, 'Google AI speech synthesis');
    }
  }
}

/**
 * Factory function to create appropriate model service
 * @param {string} provider - Provider name
 * @param {Object} config - Provider configuration
 * @returns {BaseModelService} Model service instance
 */
function createModelService(provider, config) {
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIService(config);
    case 'anthropic':
      return new AnthropicService(config);
    case 'groq':
      return new GroqService(config);
    case 'google':
      return new GoogleAIService(config);

    default:
      throw new ConfigurationError(`Unsupported provider: ${provider}`);
  }
}

module.exports = {
  BaseModelService,
  OpenAIService,
  AnthropicService,
  GroqService,
  GoogleAIService,
  createModelService
};