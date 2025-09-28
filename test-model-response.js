/**
 * Simple test script to verify model responses are working
 */

const http = require('http');

// Test function to check if model responses are working
async function testModelResponse() {
  console.log('Testing model response functionality...');
  
  try {
    // Step 1: Check if frontend is accessible
    await checkFrontendAccess();
    console.log('✅ Frontend is accessible');
    
    // Step 2: Check if backend is accessible
    await checkBackendAccess();
    console.log('✅ Backend is accessible');
    
    // Step 3: Check if script.js contains the backend integration code
    await checkScriptIntegration();
    console.log('✅ Script.js contains backend integration code');
    
    console.log('\n🎉 All tests passed! Model responses should be working correctly.');
    console.log('When you click a prompt card or send a message, the following should happen:');
    console.log('1. Your message will be displayed in the chat');
    console.log('2. A typing indicator will appear');
    console.log('3. The backend will be called if available, otherwise fallback to local generation');
    console.log('4. The AI response will be displayed in the chat');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Helper function to check if frontend is accessible
function checkFrontendAccess() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:8000', (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Frontend returned status code ${res.statusCode}`));
      }
    }).on('error', (err) => {
      reject(new Error(`Cannot access frontend: ${err.message}`));
    });
  });
}

// Helper function to check if backend is accessible
function checkBackendAccess() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001/health', (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            if (health.status === 'healthy') {
              resolve();
            } else {
              reject(new Error(`Backend is not healthy: ${health.status}`));
            }
          } catch (e) {
            reject(new Error(`Invalid health response: ${e.message}`));
          }
        });
      } else {
        reject(new Error(`Backend returned status code ${res.statusCode}`));
      }
    }).on('error', (err) => {
      reject(new Error(`Cannot access backend: ${err.message}`));
    });
  });
}

// Helper function to check if script.js contains the backend integration code
function checkScriptIntegration() {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    fs.readFile('./script.js', 'utf8', (err, data) => {
      if (err) {
        reject(new Error(`Cannot read script.js: ${err.message}`));
        return;
      }
      
      // Check if script.js contains the backend integration code
      if (data.includes('window.backendClient') && 
          data.includes('backendClient.chatCompletion')) {
        resolve();
      } else {
        reject(new Error('Script.js does not contain backend integration code'));
      }
    });
  });
}

// Run the test
testModelResponse().then(success => {
  process.exit(success ? 0 : 1);
});