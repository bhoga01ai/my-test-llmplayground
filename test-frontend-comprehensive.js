/**
 * Comprehensive Frontend Test Script
 * Tests the frontend by making actual HTTP requests and analyzing responses
 */

const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');

class ComprehensiveFrontendTester {
    constructor() {
        this.frontendUrl = 'http://localhost:8000';
        this.backendUrl = 'http://localhost:3001';
        this.testResults = [];
        this.defaultPrompts = [
            "Explain quantum computing in simple terms",
            "Write a creative story about AI and humans", 
            "Help me debug this Python code",
            "Summarize the latest trends in machine learning",
            "Create a business plan for a tech startup",
            "Explain the difference between React and Vue.js",
            "Generate a SQL query for data analysis",
            "Design a REST API architecture"
        ];
    }

    async runComprehensiveTests() {
        console.log('🚀 Starting Comprehensive Frontend Tests...');
        console.log(`Frontend URL: ${this.frontendUrl}`);
        console.log(`Backend URL: ${this.backendUrl}`);
        console.log('\n' + '='.repeat(70));

        try {
            // Test 1: Frontend file structure analysis
            await this.testFrontendStructure();
            
            // Test 2: Frontend accessibility
            await this.testFrontendAccessibility();
            
            // Test 3: Backend connectivity
            await this.testBackendConnectivity();
            
            // Test 4: Default prompts functionality
            await this.testDefaultPromptsFunctionality();
            
            // Test 5: Provider and model integration
            await this.testProviderModelIntegration();
            
            // Test 6: Parameter controls validation
            await this.testParameterControls();
            
            // Test 7: Error handling scenarios
            await this.testErrorScenarios();
            
            // Test 8: Performance and responsiveness
            await this.testPerformance();
            
            // Display comprehensive results
            this.displayComprehensiveResults();
            
        } catch (error) {
            console.error('❌ Comprehensive test suite failed:', error.message);
        }
    }

    async testFrontendStructure() {
        console.log('\n🔍 Testing frontend file structure...');
        
        const files = [
            { name: 'public/index.html', required: true },
            { name: 'public/script.js', required: true },
            { name: 'public/styles.css', required: true }
        ];

        for (const file of files) {
            try {
                const content = fs.readFileSync(file.name, 'utf8');
                this.addTestResult(`File Structure: ${file.name}`, true, `File exists (${content.length} characters)`);
                
                // Analyze file content
                if (file.name === 'index.html') {
                    await this.analyzeHTMLStructure(content);
                } else if (file.name === 'script.js') {
                    await this.analyzeJavaScriptStructure(content);
                } else if (file.name === 'style.css') {
                    await this.analyzeCSSStructure(content);
                }
            } catch (error) {
                this.addTestResult(`File Structure: ${file.name}`, false, `File missing or unreadable`);
            }
        }
    }

    async analyzeHTMLStructure(content) {
        // Check for essential HTML elements with correct IDs
        const elements = [
            { id: 'messageInput', name: 'Main Message Input' },
            { id: 'sendBtn', name: 'Main Send Button' },
            { id: 'fixedMessageInput', name: 'Fixed Message Input' },
            { id: 'fixedSendBtn', name: 'Fixed Send Button' },
            { id: 'providerSelect', name: 'Provider Select' },
            { id: 'modelSelect', name: 'Model Select' },
            { id: 'temperature', name: 'Temperature Control' },
            { id: 'maxTokens', name: 'Max Tokens Control' },
            { id: 'topP', name: 'Top-P Control' }
        ];

        elements.forEach(element => {
            const found = content.includes(`id="${element.id}"`);
            this.addTestResult(`HTML Element: ${element.name}`, found, found ? 'Element found' : 'Element missing');
        });

        // Check for default prompts
        const promptCards = content.match(/data-prompt="[^"]+"/g);
        if (promptCards) {
            this.addTestResult('Default Prompts in HTML', true, `Found ${promptCards.length} prompt cards`);
            
            // Extract and validate prompts
            const prompts = promptCards.map(card => {
                const match = card.match(/data-prompt="([^"]+)"/);
                return match ? match[1] : '';
            }).filter(prompt => prompt.length > 0);

            console.log('   📝 Default Prompts Found in HTML:');
            prompts.forEach((prompt, index) => {
                console.log(`      ${index + 1}. "${prompt}"`);
            });
        } else {
            this.addTestResult('Default Prompts in HTML', false, 'No prompt cards found');
        }
    }

    async analyzeJavaScriptStructure(content) {
        // Check for essential JavaScript functionality
        const features = [
            { pattern: 'class LLMPlayground', name: 'Main Class Definition' },
            { pattern: 'initializeProviderSelection', name: 'Provider Initialization' },
            { pattern: 'sendMessage', name: 'Send Message Function' },
            { pattern: 'displayMessage', name: 'Display Message Function' },
            { pattern: 'updateModelOptions', name: 'Model Update Function' },
            { pattern: 'addEventListener', name: 'Event Listeners' },
            { pattern: 'fetch\(', name: 'API Calls' },
            { pattern: 'this\.models', name: 'Model Configuration' }
        ];

        features.forEach(feature => {
            const regex = new RegExp(feature.pattern);
            const found = regex.test(content);
            this.addTestResult(`JS Feature: ${feature.name}`, found, found ? 'Feature implemented' : 'Feature missing');
        });

        // Check provider support
        const providers = ['openai', 'anthropic', 'google'];
        providers.forEach(provider => {
            const found = content.toLowerCase().includes(provider);
            this.addTestResult(`JS Provider: ${provider.toUpperCase()}`, found, found ? 'Provider supported' : 'Provider not found');
        });
    }

    async analyzeCSSStructure(content) {
        // Check for essential CSS features
        const features = [
            { pattern: '\.chat-container', name: 'Chat Container Styles' },
            { pattern: '\.input-container', name: 'Input Container Styles' },
            { pattern: '\.prompt-card', name: 'Prompt Card Styles' },
            { pattern: '\.sidebar', name: 'Sidebar Styles' },
            { pattern: '@media', name: 'Responsive Design' },
            { pattern: 'flex', name: 'Flexbox Layout' },
            { pattern: 'transition', name: 'Animations' }
        ];

        features.forEach(feature => {
            const regex = new RegExp(feature.pattern);
            const found = regex.test(content);
            this.addTestResult(`CSS Feature: ${feature.name}`, found, found ? 'Style implemented' : 'Style missing');
        });
    }

    async testFrontendAccessibility() {
        console.log('\n🔍 Testing frontend accessibility...');
        
        try {
            const response = await this.makeRequest(this.frontendUrl);
            
            if (response.statusCode === 200) {
                this.addTestResult('Frontend Accessibility', true, 'Frontend server responding');
                
                // Check content type
                const contentType = response.headers['content-type'] || '';
                const isHTML = contentType.includes('text/html');
                this.addTestResult('Frontend Content Type', isHTML, `Content-Type: ${contentType}`);
                
            } else {
                this.addTestResult('Frontend Accessibility', false, `HTTP ${response.statusCode}`);
            }
        } catch (error) {
            this.addTestResult('Frontend Accessibility', false, `Connection failed: ${error.message}`);
        }
    }

    async testBackendConnectivity() {
        console.log('\n🔍 Testing backend connectivity...');
        
        try {
            const response = await this.makeRequest(`${this.backendUrl}/health`);
            const data = JSON.parse(response.body);
            
            if (response.statusCode === 200 && data.status === 'healthy') {
                this.addTestResult('Backend Health', true, 'Backend is healthy');
                
                // Test providers endpoint
                const providersResponse = await this.makeRequest(`${this.backendUrl}/api/models/providers`);
                const providersData = JSON.parse(providersResponse.body);
                
                if (providersResponse.statusCode === 200) {
                    const providerCount = Object.keys(providersData.providers || {}).length;
                    this.addTestResult('Backend Providers', true, `${providerCount} providers available`);
                } else {
                    this.addTestResult('Backend Providers', false, 'Providers endpoint failed');
                }
                
            } else {
                this.addTestResult('Backend Health', false, 'Backend health check failed');
            }
        } catch (error) {
            this.addTestResult('Backend Health', false, `Backend connection failed: ${error.message}`);
        }
    }

    async testDefaultPromptsFunctionality() {
        console.log('\n🔍 Testing default prompts functionality...');
        
        // Test a subset of default prompts with different providers
        const testCases = [
            { prompt: this.defaultPrompts[0], provider: 'openai', model: 'gpt-3.5-turbo' },
            { prompt: this.defaultPrompts[1], provider: 'anthropic', model: 'claude-3-haiku' },
            { prompt: this.defaultPrompts[2], provider: 'google', model: 'gemini-pro' }
        ];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            await this.testSinglePrompt(testCase, i + 1);
            
            // Add delay to avoid rate limiting
            if (i < testCases.length - 1) {
                await this.delay(1500);
            }
        }
    }

    async testSinglePrompt(testCase, testNumber) {
        const testName = `Default Prompt ${testNumber} (${testCase.provider})`;
        
        try {
            const requestBody = {
                prompt: testCase.prompt,
                model: testCase.model,
                provider: testCase.provider,
                parameters: {
                    temperature: 0.7,
                    max_tokens: 100
                }
            };
            
            console.log(`   Testing: "${testCase.prompt.substring(0, 40)}..." with ${testCase.provider}`);
            
            const response = await this.makeRequest(`${this.backendUrl}/api/models/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            const data = JSON.parse(response.body);
            
            if (response.statusCode === 200 && data.success) {
                const responseLength = data.response?.content?.length || 0;
                this.addTestResult(testName, true, `Generated ${responseLength} characters`);
            } else {
                this.addTestResult(testName, false, data.message || `HTTP ${response.statusCode}`);
            }
        } catch (error) {
            this.addTestResult(testName, false, `Error: ${error.message}`);
        }
    }

    async testProviderModelIntegration() {
        console.log('\n🔍 Testing provider and model integration...');
        
        const providers = ['openai', 'anthropic', 'google'];
        
        for (const provider of providers) {
            try {
                const response = await this.makeRequest(`${this.backendUrl}/api/models/${provider}`);
                const data = JSON.parse(response.body);
                
                if (response.statusCode === 200 && data.available) {
                    const modelCount = data.models ? data.models.length : 0;
                    this.addTestResult(`Provider Integration: ${provider.toUpperCase()}`, true, `${modelCount} models available`);
                } else {
                    this.addTestResult(`Provider Integration: ${provider.toUpperCase()}`, false, 'Provider not available');
                }
            } catch (error) {
                this.addTestResult(`Provider Integration: ${provider.toUpperCase()}`, false, `Error: ${error.message}`);
            }
        }
    }

    async testParameterControls() {
        console.log('\n🔍 Testing parameter controls...');
        
        const parameterTests = [
            { temperature: 0.1, max_tokens: 50, description: 'Low temperature test' },
            { temperature: 1.5, max_tokens: 200, description: 'High temperature test' },
            { temperature: 0.7, max_tokens: 100, top_p: 0.5, description: 'Balanced parameters test' }
        ];
        
        for (let i = 0; i < parameterTests.length; i++) {
            const params = parameterTests[i];
            await this.testParameterVariation(params, i + 1);
            
            if (i < parameterTests.length - 1) {
                await this.delay(1000);
            }
        }
    }

    async testParameterVariation(params, testNumber) {
        const testName = `Parameter Test ${testNumber}`;
        
        try {
            const requestBody = {
                prompt: "Write a brief explanation of AI.",
                model: 'gpt-3.5-turbo',
                provider: 'openai',
                parameters: {
                    temperature: params.temperature,
                    max_tokens: params.max_tokens,
                    top_p: params.top_p || 1.0
                }
            };
            
            console.log(`   Testing: ${params.description}`);
            
            const response = await this.makeRequest(`${this.backendUrl}/api/models/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            const data = JSON.parse(response.body);
            
            if (response.statusCode === 200 && data.success) {
                this.addTestResult(testName, true, params.description);
            } else {
                this.addTestResult(testName, false, data.message || 'Parameter test failed');
            }
        } catch (error) {
            this.addTestResult(testName, false, `Error: ${error.message}`);
        }
    }

    async testErrorScenarios() {
        console.log('\n🔍 Testing error handling scenarios...');
        
        const errorTests = [
            {
                name: 'Empty Prompt',
                body: { prompt: '', model: 'gpt-3.5-turbo', provider: 'openai' },
                expectError: true
            },
            {
                name: 'Invalid Provider',
                body: { prompt: 'Test', model: 'gpt-3.5-turbo', provider: 'invalid' },
                expectError: true
            },
            {
                name: 'Invalid Model',
                body: { prompt: 'Test', model: 'invalid-model', provider: 'openai' },
                expectError: true
            }
        ];
        
        for (const test of errorTests) {
            await this.testErrorCase(test);
            await this.delay(500);
        }
    }

    async testErrorCase(test) {
        try {
            console.log(`   Testing: ${test.name}`);
            
            const response = await this.makeRequest(`${this.backendUrl}/api/models/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(test.body)
            });
            
            const data = JSON.parse(response.body);
            
            if (test.expectError && response.statusCode !== 200) {
                this.addTestResult(`Error Handling: ${test.name}`, true, 'Correctly rejected invalid request');
            } else if (!test.expectError && response.statusCode === 200) {
                this.addTestResult(`Error Handling: ${test.name}`, true, 'Request processed successfully');
            } else {
                this.addTestResult(`Error Handling: ${test.name}`, false, 'Unexpected response behavior');
            }
        } catch (error) {
            this.addTestResult(`Error Handling: ${test.name}`, false, `Test error: ${error.message}`);
        }
    }

    async testPerformance() {
        console.log('\n🔍 Testing performance and responsiveness...');
        
        try {
            // Test frontend response time
            const startTime = Date.now();
            await this.makeRequest(this.frontendUrl);
            const frontendTime = Date.now() - startTime;
            
            this.addTestResult('Frontend Response Time', frontendTime < 1000, `${frontendTime}ms`);
            
            // Test backend response time
            const backendStartTime = Date.now();
            await this.makeRequest(`${this.backendUrl}/health`);
            const backendTime = Date.now() - backendStartTime;
            
            this.addTestResult('Backend Response Time', backendTime < 500, `${backendTime}ms`);
            
        } catch (error) {
            this.addTestResult('Performance Test', false, `Error: ${error.message}`);
        }
    }

    makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            
            const req = client.request(requestOptions, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    addTestResult(testName, passed, details) {
        this.testResults.push({ testName, passed, details });
        const status = passed ? '✅' : '❌';
        console.log(`   ${status} ${testName}: ${details}`);
    }

    displayComprehensiveResults() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
        console.log('='.repeat(70));
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const passRate = ((passed / total) * 100).toFixed(1);
        
        console.log(`\n🎯 Overall Results: ${passed}/${total} tests passed (${passRate}%)`);
        
        // Categorize results
        const categories = {
            'Frontend Structure': this.testResults.filter(r => r.testName.includes('File Structure') || r.testName.includes('HTML Element') || r.testName.includes('JS Feature') || r.testName.includes('CSS Feature')),
            'Connectivity': this.testResults.filter(r => r.testName.includes('Accessibility') || r.testName.includes('Health') || r.testName.includes('Response Time')),
            'Default Prompts': this.testResults.filter(r => r.testName.includes('Default Prompt')),
            'Provider Integration': this.testResults.filter(r => r.testName.includes('Provider Integration') || r.testName.includes('JS Provider')),
            'Parameter Controls': this.testResults.filter(r => r.testName.includes('Parameter Test')),
            'Error Handling': this.testResults.filter(r => r.testName.includes('Error Handling')),
            'Performance': this.testResults.filter(r => r.testName.includes('Response Time'))
        };

        console.log('\n📋 Results by Category:');
        Object.entries(categories).forEach(([category, results]) => {
            if (results.length > 0) {
                const categoryPassed = results.filter(r => r.passed).length;
                const categoryTotal = results.length;
                const categoryRate = ((categoryPassed / categoryTotal) * 100).toFixed(0);
                const status = categoryRate == 100 ? '🟢' : categoryRate >= 75 ? '🟡' : '🔴';
                console.log(`\n   ${status} ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
            }
        });

        if (passRate >= 90) {
            console.log('\n🎉 Excellent! Frontend is working very well.');
        } else if (passRate >= 75) {
            console.log('\n👍 Good! Frontend is mostly functional with minor issues.');
        } else if (passRate >= 50) {
            console.log('\n⚠️  Fair. Frontend has some functionality but needs improvements.');
        } else {
            console.log('\n❌ Poor. Frontend has significant issues that need attention.');
        }

        console.log('\n💡 Testing Summary:');
        console.log('   ✓ Frontend structure and file analysis completed');
        console.log('   ✓ Default prompts tested with multiple providers');
        console.log('   ✓ Parameter controls and error handling verified');
        console.log('   ✓ Performance and connectivity assessed');
        console.log('\n🌐 Next Steps:');
        console.log('   - Open http://localhost:8000 in your browser');
        console.log('   - Try clicking the default prompt cards');
        console.log('   - Test different providers and models');
        console.log('   - Adjust parameters and observe responses');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the comprehensive tests
const tester = new ComprehensiveFrontendTester();
tester.runComprehensiveTests().catch(error => {
    console.error('❌ Comprehensive test execution failed:', error);
});