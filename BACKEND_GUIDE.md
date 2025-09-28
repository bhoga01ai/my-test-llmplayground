# AI Model Backend Service - Complete Guide

This guide provides comprehensive instructions for setting up, configuring, and using the AI Model Backend Service.

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Start the backend server
npm start

# Or start in development mode with auto-reload
npm run dev
```

### 2. Configuration

The service uses environment variables for configuration. Update your `.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Add your API keys here
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
GOOGLE_AI_API_KEY=your-google-ai-key-here

```

### 3. Testing

```bash
# Run the test suite
node test-backend.js
```

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` or `production` |

### AI Provider API Keys

| Provider | Variable | Where to Get |
|----------|----------|-------------|
| OpenAI | `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Anthropic | `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/) |
| Google AI | `GOOGLE_AI_API_KEY` | [Google AI Studio](https://makersuite.google.com/app/apikey) |


### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_TEMPERATURE` | `0.7` | Default temperature for all models |
| `DEFAULT_MAX_TOKENS` | `1000` | Default max tokens |
| `DEFAULT_TOP_P` | `1.0` | Default top-p value |
| `DEFAULT_FREQUENCY_PENALTY` | `0.0` | Default frequency penalty |
| `DEFAULT_PRESENCE_PENALTY` | `0.0` | Default presence penalty |

## 📡 API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### Get Available Providers

```http
GET /api/models/providers
```

**Response:**
```json
{
  "providers": {
    "openai": {
      "available": true,
      "models": [
        {
          "id": "gpt-4",
          "name": "GPT-4",
          "description": "Most capable model, best for complex tasks"
        }
      ]
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Provider Models

```http
GET /api/models/{provider}
```

**Parameters:**
- `provider`: One of `openai`, `anthropic`, `google`

**Response:**
```json
{
  "provider": "openai",
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "description": "Most capable model, best for complex tasks"
    }
  ],
  "available": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Chat Completion

```http
POST /api/models/chat
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Explain quantum computing in simple terms",
  "model": "gpt-4",
  "provider": "openai",
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 1000,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0,
    "stop": ["\n\n"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "provider": "openai",
  "model": "gpt-4",
  "response": {
    "content": "Quantum computing is a revolutionary approach to computation...",
    "usage": {
      "prompt_tokens": 12,
      "completion_tokens": 150,
      "total_tokens": 162
    },
    "metadata": {
      "model": "gpt-4",
      "finish_reason": "stop"
    }
  },
  "duration": 2500,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Streaming Chat Completion

```http
POST /api/models/stream
Content-Type: application/json
```

**Request Body:** Same as chat completion

**Response:** Server-Sent Events (SSE) stream
```
data: {"content": "Quantum", "type": "content"}
data: {"content": " computing", "type": "content"}
data: [DONE]
```

## 🔌 Frontend Integration

### Using the BackendAPIClient

```javascript
// Import the client
const { BackendAPIClient } = require('./backend-integration.js');

// Create client instance
const client = new BackendAPIClient('http://localhost:3001');

// Check health
const health = await client.checkHealth();
console.log('Backend status:', health.status);

// Get providers
const providers = await client.getProviders();
console.log('Available providers:', Object.keys(providers.providers));

// Send chat completion
const response = await client.chatCompletion({
  prompt: 'Hello, world!',
  model: 'gpt-3.5-turbo',
  provider: 'openai',
  parameters: {
    temperature: 0.7,
    max_tokens: 100
  }
});

console.log('Response:', response.response.content);
```

### Streaming Example

```javascript
await client.streamChatCompletion(
  {
    prompt: 'Write a story about AI',
    model: 'gpt-4',
    provider: 'openai'
  },
  // onChunk
  (chunk) => {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  },
  // onComplete
  () => {
    console.log('\nStreaming completed!');
  },
  // onError
  (error) => {
    console.error('Streaming error:', error.message);
  }
);
```

### Integration with Existing Frontend

```javascript
// Extend your existing LLMPlayground class
class EnhancedLLMPlayground extends LLMPlayground {
  constructor() {
    super();
    this.backendClient = new BackendAPIClient();
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    const provider = this.getSelectedProvider();
    const model = this.getSelectedModel();
    
    try {
      const response = await this.backendClient.chatCompletion({
        prompt: message,
        model,
        provider,
        parameters: this.getModelParameters()
      });
      
      this.addMessage(response.response.content, 'assistant');
    } catch (error) {
      this.addMessage(`Error: ${error.message}`, 'error');
    }
  }
}
```

## 🛡️ Security Best Practices

### Environment Variables
- Never commit API keys to version control
- Use different API keys for development and production
- Rotate API keys regularly
- Use environment-specific `.env` files

### Production Deployment
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use HTTPS in production
- Implement rate limiting
- Set up monitoring and logging

### API Key Management
```bash
# Development
cp .env.example .env.development

# Production
cp .env.example .env.production

# Load environment-specific config
NODE_ENV=production node server.js
```

## 🔍 Error Handling

### Common Error Responses

**Validation Error (400):**
```json
{
  "error": "ValidationError",
  "message": "Request validation failed",
  "details": [
    {
      "field": "prompt",
      "message": "Prompt is required",
      "value": null
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Provider Unavailable (503):**
```json
{
  "error": "Provider Unavailable",
  "message": "Provider 'openai' is not configured or API key is missing",
  "provider": "openai"
}
```

**API Error (varies):**
```json
{
  "error": "APIError",
  "message": "Rate limit exceeded",
  "provider": "openai",
  "userMessage": "Rate Limited - Too many requests, please try again later",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Handling in Frontend

```javascript
try {
  const response = await client.chatCompletion(options);
  // Handle success
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Handle rate limiting
    showMessage('Please wait before sending another message');
  } else if (error.message.includes('API key')) {
    // Handle authentication issues
    showMessage('Service configuration error');
  } else {
    // Handle other errors
    showMessage(`Error: ${error.message}`);
  }
}
```

## 📊 Monitoring and Logging

### Server Logs
The service provides comprehensive logging:

```
[2024-01-15T10:30:00.000Z] INFO: Server running on port 3001
[2024-01-15T10:30:15.123Z] INFO: POST /api/models/chat {"provider":"openai","model":"gpt-4","duration":2500}
[2024-01-15T10:30:20.456Z] WARN: Request validation failed {"errors":[{"field":"prompt","message":"Prompt is required"}]}
[2024-01-15T10:30:25.789Z] ERROR: Chat completion request failed {"provider":"openai","error":"Rate limit exceeded"}
```

### Health Monitoring

```bash
# Check service health
curl http://localhost:3001/health

# Check provider status
curl http://localhost:3001/api/models/providers
```

## 🚀 Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "ai-backend"

# Monitor
pm2 monit

# Logs
pm2 logs ai-backend
```

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t ai-backend .
docker run -p 3001:3001 --env-file .env ai-backend
```

### Environment Variables in Production

```bash
# Set environment variables
export NODE_ENV=production
export PORT=3001
export OPENAI_API_KEY=your-production-key

# Or use a .env.production file
node -r dotenv/config server.js dotenv_config_path=.env.production
```

## 🔧 Troubleshooting

### Common Issues

**Server won't start:**
- Check if port 3001 is available
- Verify Node.js version (requires Node 14+)
- Check for syntax errors in configuration files

**API calls failing:**
- Verify API keys are correctly set
- Check network connectivity
- Review server logs for detailed error messages

**Validation errors:**
- Ensure all required fields are provided
- Check parameter ranges (temperature: 0-2, max_tokens: 1-8000)
- Verify model-provider compatibility

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development DEBUG=* node server.js

# Check specific provider
curl -X GET http://localhost:3001/api/models/openai

# Test with minimal request
curl -X POST http://localhost:3001/api/models/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello",
    "model": "gpt-3.5-turbo",
    "provider": "openai"
  }'
```

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Google AI API Documentation](https://ai.google.dev/docs)
- [Cohere API Documentation](https://docs.cohere.ai/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🤝 Contributing

To add support for new AI providers:

1. Update `config/environment.js` with new provider configuration
2. Add validation rules in `middleware/validation.js`
3. Implement service class in `services/modelService.js`
4. Update route handlers in `routes/models.js`
5. Add tests and documentation

For detailed contribution guidelines, see the main README.md file.