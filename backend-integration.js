/**
 * Frontend integration example for the AI Model Backend Service
 * This file shows how to integrate the backend service with the existing frontend
 */

class BackendAPIClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.uploadedFiles = []; // Store uploaded file contents
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
   * @param {Array} options.conversation_history - Previous messages in the conversation
   * @param {Object} options.parameters - Model parameters
   * @returns {Promise<Object>} Chat completion response
   */
  /**
   * Add uploaded file to the client's storage
   * @param {Object} fileData - File data object
   * @param {string} fileData.name - File name
   * @param {string} fileData.content - File content
   * @param {string} fileData.type - File type
   */
  addUploadedFile(fileData) {
    this.uploadedFiles.push(fileData);
    console.log(`Added file to backend client storage: ${fileData.name}`);
  }

  /**
   * Clear all uploaded files
   */
  clearUploadedFiles() {
    this.uploadedFiles = [];
    console.log('Cleared all uploaded files from backend client storage');
  }

  /**
   * Get all uploaded file contents formatted for the model
   * @returns {string} Formatted file contents
   */
  getUploadedFilesContent() {
    if (this.uploadedFiles.length === 0) return '';
    
    let content = '\n\n--- Uploaded Files ---\n';
    this.uploadedFiles.forEach((file, index) => {
      content += `\n**File: ${file.name}** [file-${index + 1}]\n`;
      content += file.content + '\n';
    });
    
    return content;
  }

  async chatCompletion({ prompt, model, provider, conversation_history = [], parameters = {} }) {
    try {
      // Add file content to the prompt if files are uploaded
      const fileContent = this.getUploadedFilesContent();
      const fullPrompt = fileContent ? prompt + fileContent : prompt;
      
      console.log('Sending chat completion request:', { 
        prompt: fullPrompt.length > 100 ? fullPrompt.substring(0, 100) + '...' : fullPrompt, 
        model, 
        provider, 
        conversation_history: conversation_history.length, 
        parameters,
        hasFileContent: fileContent.length > 0
      });
      
      const response = await fetch(`${this.baseUrl}/api/models/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          model,
          provider,
          conversation_history,
          parameters
        })
      });

      const data = await response.json();
      console.log('Chat completion response:', data);

      if (!response.ok) {
        // Extract more detailed error information if available
        const errorMessage = data.message || `HTTP ${response.status}: ${response.statusText}`;
        const errorDetails = data.details || data.error || '';
        
        console.error('API Error:', {
          status: response.status,
          message: errorMessage,
          details: errorDetails
        });
        
        throw new Error(errorMessage + (errorDetails ? ` (${errorDetails})` : ''));
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
      // Add file content to the prompt if files are uploaded
      const fileContent = this.getUploadedFilesContent();
      const fullPrompt = fileContent ? prompt + fileContent : prompt;
      
      console.log('Sending streaming chat completion request:', { 
        prompt: fullPrompt.length > 100 ? fullPrompt.substring(0, 100) + '...' : fullPrompt, 
        model, 
        provider, 
        parameters,
        hasFileContent: fileContent.length > 0
      });
      
      const response = await fetch(`${this.baseUrl}/api/models/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: fullPrompt,
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