# LLM Playground

An interactive AI model testing interface with support for multiple providers including OpenAI, Anthropic, Groq, and Google AI. Features a comprehensive backend service that dynamically interacts with multiple AI models through a unified API and a modern frontend interface for testing.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic, Groq, and Google AI
- **Interactive Frontend**: Modern web interface for testing AI models
- **Real-time Testing**: Interactive chat interface with parameter controls
- **Environment-Based Configuration**: Secure API key management through .env files
- **Request Validation**: Comprehensive input validation with detailed error messages
- **Error Handling**: Robust error handling with provider-specific error mapping
- **Streaming Support**: Real-time streaming responses for supported providers
- **Speech Synthesis**: Text-to-speech capabilities with Web Speech API and Gemini
- **Voice Input**: Speech-to-text for voice-based interactions
- **Modular Architecture**: Easy to extend with new AI providers
- **Logging**: Comprehensive logging for monitoring and debugging
- **CORS Support**: Cross-origin resource sharing for web applications
- **Vercel Ready**: Configured for easy deployment to Vercel

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env` file and add your API keys:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com

# Google AI Configuration
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
GOOGLE_AI_BASE_URL=https://generativelanguage.googleapis.com



# Default Model Parameters
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=1000
DEFAULT_TOP_P=1.0
DEFAULT_FREQUENCY_PENALTY=0.0
DEFAULT_PRESENCE_PENALTY=0.0
```

### 3. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your .env file).

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status and configuration information.

### Get Available Providers

```http
GET /api/models/providers
```

Returns all available AI providers and their configuration status.

### Get Provider Models

```http
GET /api/models/:provider
```

Returns available models for a specific provider (openai, anthropic, google).

### Chat Completion

```http
POST /api/models/chat
Content-Type: application/json
```

### Speech Synthesis

```http
POST /api/speech/synthesize
Content-Type: application/json

{
  "text": "Text to convert to speech",
  "model": "gemini-2.5-flash-lite",
  "provider": "google"
}
```

Converts text to speech using the specified provider and model. Returns audio data.

### Speech Transcription

```http
POST /api/speech/transcribe
Content-Type: application/json

{
  "audioData": "base64_encoded_audio_data",
  "model": "gemini-2.5-flash-lite",
  "provider": "google"
}
```

Transcribes speech to text using the specified provider and model.
{
  "prompt": "Explain quantum computing in simple terms",
  "model": "gpt-4",
  "provider": "openai",
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 1000,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  }
}
```

### Streaming Chat Completion

```http
POST /api/models/stream
Content-Type: application/json

{
  "prompt": "Write a creative story about space exploration",
  "model": "gpt-3.5-turbo",
  "provider": "openai",
  "parameters": {
    "temperature": 0.8,
    "max_tokens": 2000
  }
}
```

## Supported Models

### OpenAI
- `gpt-4` - Most capable model, best for complex tasks
- `gpt-4-turbo` - Faster and more efficient GPT-4
- `gpt-3.5-turbo` - Fast and efficient for most tasks

### Anthropic
- `claude-3-opus` - Most powerful Claude model
- `claude-3-sonnet` - Balanced performance and speed
- `claude-3-haiku` - Fastest Claude model

### Google AI
- `gemini-pro` - Google's most capable text model
- `gemini-pro-vision` - Multimodal model with vision capabilities



## Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | The input text prompt |
| `model` | string | required | Model identifier |
| `provider` | string | required | AI provider (openai, anthropic, google) |
| `parameters.temperature` | number | 0.7 | Controls randomness (0.0-2.0) |
| `parameters.max_tokens` | number | 1000 | Maximum tokens to generate |
| `parameters.top_p` | number | 1.0 | Nucleus sampling parameter |
| `parameters.frequency_penalty` | number | 0.0 | Frequency penalty (-2.0 to 2.0) |
| `parameters.presence_penalty` | number | 0.0 | Presence penalty (-2.0 to 2.0) |
| `parameters.stop` | array | null | Stop sequences |

## Error Handling

The service provides comprehensive error handling with standardized error responses:

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
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705312200000_abc123"
}
```

## Security Best Practices

1. **Environment Variables**: All API keys are stored in environment variables, never in code
2. **Input Validation**: All requests are validated using Joi schemas
3. **Error Sanitization**: Error messages don't expose sensitive information
4. **CORS Configuration**: Properly configured CORS for production environments
5. **Request Logging**: Comprehensive logging without exposing sensitive data

## Architecture

```
├── server.js                 # Main application entry point
├── config/
│   └── environment.js        # Environment variable validation
├── middleware/
│   ├── validation.js         # Request validation middleware
│   └── errorHandler.js       # Error handling middleware
├── routes/
│   └── models.js            # API route definitions
├── services/
│   └── modelService.js      # AI provider service implementations
└── utils/
    └── logger.js            # Logging utility
```

## Adding New Providers

To add a new AI provider:

1. **Update Environment Configuration** (`config/environment.js`)
2. **Add Validation Rules** (`middleware/validation.js`)
3. **Implement Service Class** (`services/modelService.js`)
4. **Update Route Handler** (`routes/models.js`)

Example service implementation:

```javascript
class NewProviderService extends BaseModelService {
  constructor(config) {
    super('newprovider', config);
    this.baseURL = config.baseUrl;
  }
  
  async generateCompletion({ prompt, model, parameters }) {
    // Implementation here
  }
}
```

## Development

### Running Tests

```bash
# Run tests (when implemented)
npm test
```

### Development Mode

```bash
# Start with auto-reload
npm run dev
```

### Production Deployment

1. Set `NODE_ENV=production`
2. Configure production API keys
3. Set up proper CORS origins
4. Configure logging for production
5. Set up process management (PM2, Docker, etc.)

## Deployment to Vercel

### Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Vercel account

### Deployment Steps

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy the Application**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**
   In the Vercel dashboard, add the following environment variables:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `GROQ_API_KEY`
   - `GOOGLE_AI_API_KEY`
   - `NODE_ENV=production`

### Project Structure for Vercel

```
├── public/              # Frontend static files (served by Vercel)
│   ├── index.html      # Main HTML file
│   ├── script.js       # Frontend JavaScript
│   ├── styles.css      # CSS styles
│   └── backend-integration.js
├── server.js           # Backend API (Vercel serverless function)
├── vercel.json         # Vercel deployment configuration
└── package.json        # Dependencies and scripts
```

## Monitoring

The service includes comprehensive logging for:

- Request/response cycles
- API call performance
- Error tracking
- Provider availability
- Usage statistics

## License

MIT License - see LICENSE file for details.