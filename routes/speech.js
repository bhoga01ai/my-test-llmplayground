const express = require('express');
const router = express.Router();
const { validateRequest } = require('../middleware/validation');
const { createModelService } = require('../services/modelService');
const { logger } = require('../utils/logger');

/**
 * @route POST /api/speech/transcribe
 * @description Transcribe speech to text using Gemini model
 * @access Public
 */
router.post('/transcribe', async (req, res, next) => {
  try {
    const { audioData, model = 'gemini-2.5-flash-lite', provider = 'google' } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }
    
    // Get API key from environment variables
    const envKey = `${provider.toUpperCase()}_API_KEY`;
    // For Google, we need to check both GOOGLE_API_KEY and GOOGLE_AI_API_KEY
    let apiKey = process.env[envKey];
    if (!apiKey && provider.toUpperCase() === 'GOOGLE') {
      apiKey = process.env['GOOGLE_AI_API_KEY'];
    }
    
    if (!apiKey) {
      return res.status(400).json({ error: `API key for ${provider} is not configured. Looking for ${envKey}` });
    }
    
    // Create model service
    const modelService = createModelService(provider, { apiKey });
    
    // Check if speech-to-text is supported
    if (!modelService.speechToTextEnabled) {
      return res.status(400).json({ error: `Speech-to-text is not supported by ${provider}` });
    }
    
    // Transcribe speech
    const result = await modelService.transcribeSpeech({ audioData, model });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/speech/synthesize
 * @description Generate speech from text using Gemini model
 * @access Public
 */
router.post('/synthesize', async (req, res, next) => {
  try {
    const { text, model = 'gemini-2.5-flash-lite', provider = 'google' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Get API key from environment variables
    const envKey = `${provider.toUpperCase()}_API_KEY`;
    // For Google, we need to check both GOOGLE_API_KEY and GOOGLE_AI_API_KEY
    let apiKey = process.env[envKey];
    if (!apiKey && provider.toUpperCase() === 'GOOGLE') {
      apiKey = process.env['GOOGLE_AI_API_KEY'];
    }
    
    if (!apiKey) {
      return res.status(400).json({ error: `API key for ${provider} is not configured. Looking for ${envKey}` });
    }
    
    // Create model service
    const modelService = createModelService(provider, { apiKey });
    
    // Check if text-to-speech is supported
    if (!modelService.textToSpeechEnabled) {
      return res.status(400).json({ error: `Text-to-speech is not supported by ${provider}` });
    }
    
    // Generate speech
    const result = await modelService.generateSpeech({ text, model });
    
    // Set appropriate headers for audio response
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', 'attachment; filename="speech.wav"');
    
    // Send audio data
    res.send(result.audioData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;