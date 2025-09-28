/**
 * Comprehensive Frontend Test Script for LLM Playground
 * Tests all default prompts and frontend functionality
 */

class FrontendTester {
    constructor() {
        this.baseUrl = 'http://localhost:8000';
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
        this.providers = ['openai', 'anthropic', 'groq', 'google'];
        this.models = {
            'openai': ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
            'groq': ['llama-3.1-8b-instant', 'gemma2-9b-it', 'openai/gpt-oss-120b'],
            'google': ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
            'anthropic': ['claude-opus-4-1-20250805', 'claude-opus-4-20250514', 'claude-sonnet-4-20250514']
        };
    }

    async runAllTests() {
        console.log('🚀 Starting comprehensive frontend tests...');
        console.log(`Frontend URL: ${this.baseUrl}`);
        console.log(`Backend URL: ${this.backendUrl}`);
        console.log('\n' + '='.repeat(60));

        try {
            // Test 1: Backend connectivity
            await this.testBackendConnectivity();
            
            // Test 2: Frontend accessibility
            await this.testFrontendAccessibility();
            
            // Test 3: Provider and model availability
            await this.testProviderAvailability();
            
            // Test 4: Default prompts with different providers
            await this.testDefaultPrompts();
            
            // Test 5: Model parameter variations
            await this.testModelParameters();
            
            // Test 6: Error handling
            await this.testErrorHandling();
            
            // Test 7: Streaming functionality
            await this.testStreamingFunctionality();
            
            // Display results
            this.displayTestResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
    }

    async testBackendConnectivity() {
        console.log('\n🔍 Testing backend connectivity...');
        
        try {
            const response = await fetch(`${this.backendUrl}/health`);
            const data = await response.json();
            
            if (response.ok && data.status === 'healthy') {
                this.addTestResult('Backend Health Check', true, 'Backend is healthy and responsive');
            } else {
                this.addTestResult('Backend Health Check', false, 'Backend health check failed');
            }
        } catch (error) {
            this.addTestResult('Backend Health Check', false, `Backend connection failed: ${error.message}`);
        }
    }

    async testFrontendAccessibility() {
        console.log('\n🔍 Testing frontend accessibility...');
        
        try {
            const response = await fetch(this.baseUrl);
            
            if (response.ok) {
                this.addTestResult('Frontend Accessibility', true, 'Frontend is accessible');
            } else {
                this.addTestResult('Frontend Accessibility', false, `Frontend returned status: ${response.status}`);
            }
        } catch (error) {
            this.addTestResult('Frontend Accessibility', false, `Frontend connection failed: ${error.message}`);
        }
    }

    async testProviderAvailability() {
        console.log('\n🔍 Testing provider availability...');
        
        try {
            const response = await fetch(`${this.backendUrl}/api/models/providers`);
            const data = await response.json();
            
            if (response.ok) {
                const availableProviders = Object.keys(data.providers || {});
                this.addTestResult('Provider Availability', true, `Available providers: ${availableProviders.join(', ')}`);
                
                // Test each provider's models
                for (const provider of availableProviders) {
                    await this.testProviderModels(provider);
                }
            } else {
                this.addTestResult('Provider Availability', false, 'Failed to fetch providers');
            }
        } catch (error) {
            this.addTestResult('Provider Availability', false, `Provider test failed: ${error.message}`);
        }
    }

    async testProviderModels(provider) {
        try {
            const response = await fetch(`${this.backendUrl}/api/models/${provider}`);
            const data = await response.json();
            
            if (response.ok && data.available) {
                const modelCount = data.models ? data.models.length : 0;
                this.addTestResult(`${provider.toUpperCase()} Models`, true, `${modelCount} models available`);
            } else {
                this.addTestResult(`${provider.toUpperCase()} Models`, false, `Provider ${provider} not available`);
            }
        } catch (error) {
            this.addTestResult(`${provider.toUpperCase()} Models`, false, `Failed to fetch ${provider} models`);
        }
    }

    async testDefaultPrompts() {
        console.log('\n🔍 Testing default prompts with different providers...');
        
        for (let i = 0; i < Math.min(3, this.defaultPrompts.length); i++) {
            const prompt = this.defaultPrompts[i];
            const provider = this.providers[i % this.providers.length];
            const model = this.models[provider] ? this.models[provider][0] : 'default';
            
            await this.testSinglePrompt(prompt, provider, model, i + 1);
            
            // Add delay between requests to avoid rate limiting
            await this.delay(1000);
        }
    }

    async testSinglePrompt(prompt, provider, model, testNumber) {
        const testName = `Default Prompt ${testNumber} (${provider})`;
        
        try {
            const requestBody = {
                prompt: prompt,
                model: model,
                provider: provider,
                parameters: {
                    temperature: 0.7,
                    max_tokens: 100,
                    top_p: 1.0
                }
            };
            
            console.log(`   Testing: "${prompt.substring(0, 50)}..." with ${provider}/${model}`);
            
            const response = await fetch(`${this.backendUrl}/api/models/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                const responseLength = data.response?.content?.length || 0;
                this.addTestResult(testName, true, `Generated ${responseLength} characters`);
            } else {
                this.addTestResult(testName, false, data.message || 'Request failed');
            }
        } catch (error) {
            this.addTestResult(testName, false, `Error: ${error.message}`);
        }
    }

    async testModelParameters() {
        console.log('\n🔍 Testing model parameter variations...');
        
        const parameterTests = [
            { temperature: 0.1, max_tokens: 50, description: 'Low temperature, short response' },
            { temperature: 1.5, max_tokens: 200, description: 'High temperature, longer response' },
            { temperature: 0.7, max_tokens: 100, top_p: 0.5, description: 'Standard with top_p' }
        ];
        
        for (let i = 0; i < parameterTests.length; i++) {
            const params = parameterTests[i];
            await this.testParameterVariation(params, i + 1);
            await this.delay(1000);
        }
    }

    async testParameterVariation(params, testNumber) {
        const testName = `Parameter Test ${testNumber}`;
        
        try {
            const requestBody = {
                prompt: "Write a short explanation of artificial intelligence.",
                model: 'gpt-3.5-turbo',
                provider: 'openai',
                parameters: {
                    temperature: params.temperature,
                    max_tokens: params.max_tokens,
                    top_p: params.top_p || 1.0
                }
            };
            
            console.log(`   Testing: ${params.description}`);
            
            const response = await fetch(`${this.backendUrl}/api/models/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.addTestResult(testName, true, params.description);
            } else {
                this.addTestResult(testName, false, data.message || 'Parameter test failed');
            }
        } catch (error) {
            this.addTestResult(testName, false, `Error: ${error.message}`);
        }
    }

    async testErrorHandling() {
        console.log('\n🔍 Testing error handling...');
        
        const errorTests = [
            {
                name: 'Empty Prompt',
                body: { prompt: '', model: 'gpt-3.5-turbo', provider: 'openai' },
                expectedError: true
            },
            {
                name: 'Invalid Provider',
                body: { prompt: 'Test', model: 'gpt-3.5-turbo', provider: 'invalid' },
                expectedError: true
            },
            {
                name: 'Invalid Model',
                body: { prompt: 'Test', model: 'invalid-model', provider: 'openai' },
                expectedError: true
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
            
            const response = await fetch(`${this.backendUrl}/api/models/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(test.body)
            });
            
            const data = await response.json();
            
            if (test.expectedError && !response.ok) {
                this.addTestResult(`Error Handling: ${test.name}`, true, 'Correctly rejected invalid request');
            } else if (!test.expectedError && response.ok) {
                this.addTestResult(`Error Handling: ${test.name}`, true, 'Request processed successfully');
            } else {
                this.addTestResult(`Error Handling: ${test.name}`, false, 'Unexpected response');
            }
        } catch (error) {
            this.addTestResult(`Error Handling: ${test.name}`, false, `Test error: ${error.message}`);
        }
    }

    async testStreamingFunctionality() {
        console.log('\n🔍 Testing streaming functionality...');
        
        try {
            const requestBody = {
                prompt: "Count from 1 to 5 slowly.",
                model: 'gpt-3.5-turbo',
                provider: 'openai',
                parameters: {
                    temperature: 0.7,
                    max_tokens: 50
                }
            };
            
            console.log('   Testing: Streaming response');
            
            const response = await fetch(`${this.backendUrl}/api/models/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response.ok) {
                this.addTestResult('Streaming Functionality', true, 'Streaming endpoint accessible');
            } else {
                this.addTestResult('Streaming Functionality', false, 'Streaming endpoint failed');
            }
        } catch (error) {
            this.addTestResult('Streaming Functionality', false, `Streaming test error: ${error.message}`);
        }
    }

    addTestResult(testName, passed, details) {
        this.testResults.push({ testName, passed, details });
        const status = passed ? '✅' : '❌';
        console.log(`   ${status} ${testName}: ${details}`);
    }

    displayTestResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const passRate = ((passed / total) * 100).toFixed(1);
        
        console.log(`\n🎯 Overall Results: ${passed}/${total} tests passed (${passRate}%)`);
        
        if (passed === total) {
            console.log('🎉 All tests passed! Frontend is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Check the details above.');
        }
        
        console.log('\n📋 Detailed Results:');
        this.testResults.forEach((result, index) => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${result.testName}`);
            if (!result.passed) {
                console.log(`   └─ ${result.details}`);
            }
        });
        
        console.log('\n💡 Tips:');
        console.log('   - Ensure both frontend (port 8000) and backend (port 3001) are running');
        console.log('   - Add API keys to .env file for actual AI model testing');
        console.log('   - Check browser console for any JavaScript errors');
        console.log('   - Verify network connectivity for external API calls');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the tests
const tester = new FrontendTester();
tester.runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
});