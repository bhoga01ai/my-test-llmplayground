/**
 * Frontend integration example for the AI Model Backend Service
 * This file shows how to integrate the backend service with the existing frontend
 */

class BackendAPIClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    console.log('BackendAPIClient initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Check if the backend service is healthy
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      throw new Error(`Backend service unavailable: ${error.message}`);
    }
  }

  /**
   * Get available AI providers and their status
   * @returns {Promise<Object>} Providers information
   */
  async getProviders() {
    try {
      const response = await fetch(`${this.baseUrl}/api/models/providers`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }
  }

  /**
   * Get available models for a specific provider
   * @param {string} provider - Provider name (openai, anthropic, google)
   * @returns {Promise<Object>} Models information
   */
  async getProviderModels(provider) {
    try {
      const response = await fetch(`${this.baseUrl}/api/models/${provider}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch ${provider} models: ${error.message}`);
    }
  }

  /**
   * Send a chat completion request
   * @param {Object} options - Chat completion options
   * @param {string} options.prompt - The user prompt
   * @param {string} options.model - Model identifier
   * @param {string} options.provider - Provider name
   * @param {Object} options.parameters - Model parameters
   * @returns {Promise<Object>} Chat completion response
   */
  async chatCompletion({ prompt, model, provider, parameters = {} }) {
    try {
      console.log('Sending chat completion request:', { prompt, model, provider, parameters });
      
      const response = await fetch(`${this.baseUrl}/api/models/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          model,
          provider,
          parameters
        })
      });

      const data = await response.json();
      console.log('Chat completion response:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // The API returns a nested response structure
      if (data.response && data.response.content) {
        return {
          content: data.response.content,
          usage: data.response.usage,
          metadata: data.response.metadata
        };
      }
      return data;
    } catch (error) {
      throw new Error(`Chat completion failed: ${error.message}`);
    }
  }

  /**
   * Send a streaming chat completion request
   * @param {Object} options - Chat completion options
   * @param {Function} onChunk - Callback for each chunk
   * @param {Function} onComplete - Callback when stream completes
   * @param {Function} onError - Callback for errors
   */
  async streamChatCompletion({ prompt, model, provider, parameters = {} }, onChunk, onComplete, onError) {
    try {
      const response = await fetch(`${this.baseUrl}/api/models/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          model,
          provider,
          parameters
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete?.();
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete?.();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                onError?.(new Error(parsed.error));
                return;
              }
              onChunk?.(parsed);
            } catch (e) {
              // Ignore parsing errors for streaming
            }
          }
        }
      }
    } catch (error) {
      onError?.(error);
    }
  }
}

// Backend API Client is now available globally as BackendAPIClient
// It will be used by the LLMPlayground class in script.js

// Example usage:
// const client = new BackendAPIClient();
// client.checkHealth().then(health => console.log('Backend health:', health));

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BackendAPIClient };
}