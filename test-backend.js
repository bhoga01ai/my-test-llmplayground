/**
 * Simple test script to verify the backend service functionality
 * Run this after starting the server to test the API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

/**
 * Test the health endpoint
 */
async function testHealth() {
  try {
    console.log('\n🔍 Testing health endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

/**
 * Test the providers endpoint
 */
async function testProviders() {
  try {
    console.log('\n🔍 Testing providers endpoint...');
    const response = await axios.get(`${BASE_URL}/api/models/providers`);
    console.log('✅ Providers endpoint passed');
    console.log('Available providers:', Object.keys(response.data.providers));
    
    // Show which providers are configured
    const configuredProviders = Object.entries(response.data.providers)
      .filter(([_, config]) => config.available)
      .map(([name, _]) => name);
    
    console.log('Configured providers:', configuredProviders.length > 0 ? configuredProviders : 'None (add API keys to .env)');
    return true;
  } catch (error) {
    console.error('❌ Providers endpoint failed:', error.message);
    return false;
  }
}

/**
 * Test a specific provider endpoint
 */
async function testProviderModels(provider = 'openai') {
  try {
    console.log(`\n🔍 Testing ${provider} models endpoint...`);
    const response = await axios.get(`${BASE_URL}/api/models/${provider}`);
    console.log(`✅ ${provider} models endpoint passed`);
    console.log(`Available ${provider} models:`, response.data.models.map(m => m.id));
    return true;
  } catch (error) {
    if (error.response?.status === 503) {
      console.log(`⚠️  ${provider} not configured (missing API key)`);
    } else {
      console.error(`❌ ${provider} models endpoint failed:`, error.message);
    }
    return false;
  }
}

/**
 * Test chat completion (only if provider is configured)
 */
async function testChatCompletion() {
  try {
    console.log('\n🔍 Testing chat completion...');
    
    // First check if any providers are available
    const providersResponse = await axios.get(`${BASE_URL}/api/models/providers`);
    const availableProviders = Object.entries(providersResponse.data.providers)
      .filter(([_, config]) => config.available)
      .map(([name, _]) => name);
    
    if (availableProviders.length === 0) {
      console.log('⚠️  No providers configured - skipping chat completion test');
      console.log('   Add API keys to .env file to test chat completion');
      return true;
    }
    
    const provider = availableProviders[0];
    const models = providersResponse.data.providers[provider].models;
    const model = models[0].id;
    
    console.log(`Using ${provider} with model ${model}`);
    
    const response = await axios.post(`${BASE_URL}/api/models/chat`, {
      prompt: 'Say "Hello, World!" and nothing else.',
      model,
      provider,
      parameters: {
        temperature: 0.1,
        max_tokens: 50
      }
    });
    
    console.log('✅ Chat completion passed');
    console.log('Response:', response.data.response.content.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Chat completion failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test validation errors
 */
async function testValidation() {
  try {
    console.log('\n🔍 Testing validation...');
    
    // Test with invalid request
    await axios.post(`${BASE_URL}/api/models/chat`, {
      prompt: '', // Empty prompt should fail
      model: 'invalid-model',
      provider: 'invalid-provider'
    });
    
    console.error('❌ Validation test failed - should have rejected invalid request');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation test passed - correctly rejected invalid request');
      return true;
    } else {
      console.error('❌ Validation test failed with unexpected error:', error.message);
      return false;
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting backend service tests...');
  console.log('Make sure the server is running on http://localhost:3001');
  
  const tests = [
    testHealth,
    testProviders,
    () => testProviderModels('openai'),
    () => testProviderModels('anthropic'),
    testValidation,
    testChatCompletion
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
    } catch (error) {
      console.error('❌ Test failed with error:', error.message);
    }
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Backend service is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
  
  console.log('\n💡 Tips:');
  console.log('   - Add API keys to .env file to test actual AI model calls');
  console.log('   - Check server logs for detailed error information');
  console.log('   - Use the /health endpoint to verify server status');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };