# Guardrails Implementation

## Overview

This project implements content moderation guardrails using Meta's Llama Guard models to ensure safe interactions with AI models. The implementation consists of two main components:

1. **Input Moderation** - Uses `meta-llama/Llama-Prompt-Guard-2-86M` to detect and block prompt injections, jailbreaks, and other unsafe user inputs.
2. **Response Moderation** - Uses `meta-llama/Llama-Guard-3-8B` to detect and filter unsafe AI model responses.

## Configuration

The guardrail system can be configured through environment variables:

```
# Enable/disable guardrails
ENABLE_GUARDRAILS=true

# Llama Guard API key and base URL
LLAMA_GUARD_API_KEY=your_api_key_here
LLAMA_GUARD_BASE_URL=https://api.example.com

# Model names
LLAMA_GUARD_RESPONSE_MODEL=meta-llama/Llama-Guard-3-8B
LLAMA_GUARD_PROMPT_MODEL=meta-llama/Llama-Prompt-Guard-2-86M
```

## Implementation Details

### Services

1. **LlamaGuardService** (`services/llamaGuardService.js`)
   - Handles response moderation using Llama Guard 3
   - Implements the MLCommons hazard taxonomy for content classification
   - Returns moderation results with safety categories

2. **PromptGuardService** (`services/promptGuardService.js`)
   - Handles input moderation using Llama Prompt Guard 2
   - Detects prompt injections, jailbreaks, and other unsafe inputs
   - Returns moderation results with safety assessment

3. **GuardrailService** (`services/guardrailService.js`)
   - Factory service that creates and manages moderation services
   - Provides unified interface for input and response moderation
   - Handles configuration and error cases

### Middleware

**Content Moderation Middleware** (`middleware/contentModeration.js`)
- Validates user inputs before they reach the model API
- Rejects unsafe requests with appropriate error messages
- Logs moderation decisions for auditing

### API Integration

The guardrail system is integrated into both streaming and non-streaming API endpoints in `routes/models.js`:

1. **Non-streaming endpoint** - Moderates both input and response
2. **Streaming endpoint** - Moderates input before streaming begins

## Testing

A test script (`test-guardrails.js`) is provided to verify the guardrail implementation. It tests both safe and unsafe inputs/responses to ensure the system works as expected.

To run the tests:

```bash
node test-guardrails.js
```

## Best Practices

1. **Fail-open approach** - If moderation services fail, requests proceed with warnings logged
2. **Detailed logging** - All moderation decisions are logged for auditing
3. **Clear error messages** - Users receive appropriate error messages for rejected content
4. **Configurable** - Guardrails can be enabled/disabled through environment variables

## Future Improvements

1. Implement caching for moderation results to improve performance
2. Add more granular configuration options for different safety categories
3. Implement user feedback mechanism for false positives
4. Add support for additional moderation models and services