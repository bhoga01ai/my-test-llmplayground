/**
 * Frontend UI Test Script using Puppeteer
 * Tests the actual frontend interface with default prompts
 */

const puppeteer = require('puppeteer');

class FrontendUITester {
    constructor() {
        this.frontendUrl = 'http://localhost:8000';
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async runUITests() {
        console.log('🚀 Starting Frontend UI Tests...');
        console.log(`Testing URL: ${this.frontendUrl}`);
        console.log('\n' + '='.repeat(60));

        try {
            // Launch browser
            this.browser = await puppeteer.launch({ 
                headless: false, // Set to true for headless mode
                defaultViewport: { width: 1280, height: 800 }
            });
            this.page = await this.browser.newPage();

            // Navigate to frontend
            await this.page.goto(this.frontendUrl, { waitUntil: 'networkidle2' });

            // Run tests
            await this.testPageLoad();
            await this.testProviderSelection();
            await this.testDefaultPrompts();
            await this.testModelParameters();
            await this.testChatInterface();
            await this.testErrorHandling();

            // Display results
            this.displayResults();

        } catch (error) {
            console.error('❌ UI Test suite failed:', error.message);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async testPageLoad() {
        console.log('\n🔍 Testing page load and basic elements...');
        
        try {
            // Check if main elements are present
            const title = await this.page.$('.title');
            const sidebar = await this.page.$('.sidebar');
            const chatContainer = await this.page.$('.chat-container');
            const inputContainer = await this.page.$('.input-container');
            
            if (title && sidebar && chatContainer && inputContainer) {
                this.addTestResult('Page Load', true, 'All main UI elements loaded successfully');
            } else {
                this.addTestResult('Page Load', false, 'Some main UI elements missing');
            }

            // Check for provider badges
            const badges = await this.page.$$('.badge');
            this.addTestResult('Provider Badges', badges.length > 0, `Found ${badges.length} provider badges`);

        } catch (error) {
            this.addTestResult('Page Load', false, `Error: ${error.message}`);
        }
    }

    async testProviderSelection() {
        console.log('\n🔍 Testing provider selection...');
        
        try {
            // Check if provider select exists
            const providerSelect = await this.page.$('#provider');
            if (!providerSelect) {
                this.addTestResult('Provider Selection', false, 'Provider select element not found');
                return;
            }

            // Get available providers
            const providers = await this.page.$$eval('#provider option', options => 
                options.map(option => option.value).filter(value => value)
            );

            this.addTestResult('Provider Options', providers.length > 0, `Found providers: ${providers.join(', ')}`);

            // Test provider switching
            if (providers.length > 1) {
                await this.page.select('#provider', providers[1]);
                await this.page.waitForTimeout(1000); // Wait for model update
                
                const modelOptions = await this.page.$$eval('#model option', options => 
                    options.map(option => option.value).filter(value => value)
                );
                
                this.addTestResult('Provider Switching', modelOptions.length > 0, 'Models updated after provider change');
            }

        } catch (error) {
            this.addTestResult('Provider Selection', false, `Error: ${error.message}`);
        }
    }

    async testDefaultPrompts() {
        console.log('\n🔍 Testing default prompts...');
        
        try {
            // Check if default prompts section exists
            const defaultPromptsSection = await this.page.$('.default-prompts');
            if (!defaultPromptsSection) {
                this.addTestResult('Default Prompts Section', false, 'Default prompts section not found');
                return;
            }

            // Get all default prompt buttons
            const promptButtons = await this.page.$$('.prompt-btn');
            this.addTestResult('Default Prompt Buttons', promptButtons.length > 0, `Found ${promptButtons.length} default prompts`);

            // Test clicking a default prompt
            if (promptButtons.length > 0) {
                const firstPrompt = promptButtons[0];
                const promptText = await this.page.evaluate(el => el.textContent, firstPrompt);
                
                await firstPrompt.click();
                await this.page.waitForTimeout(500);
                
                // Check if prompt was inserted into input
                const inputValue = await this.page.$eval('#user-input', el => el.value);
                
                if (inputValue.includes(promptText.trim())) {
                    this.addTestResult('Default Prompt Click', true, 'Prompt correctly inserted into input');
                } else {
                    this.addTestResult('Default Prompt Click', false, 'Prompt not inserted correctly');
                }
            }

        } catch (error) {
            this.addTestResult('Default Prompts', false, `Error: ${error.message}`);
        }
    }

    async testModelParameters() {
        console.log('\n🔍 Testing model parameters...');
        
        try {
            // Check parameter controls
            const temperatureSlider = await this.page.$('#temperature');
            const maxTokensInput = await this.page.$('#max-tokens');
            const topPSlider = await this.page.$('#top-p');
            
            const parametersFound = [temperatureSlider, maxTokensInput, topPSlider].filter(Boolean).length;
            this.addTestResult('Parameter Controls', parametersFound === 3, `Found ${parametersFound}/3 parameter controls`);

            // Test parameter adjustment
            if (temperatureSlider) {
                await this.page.evaluate(() => {
                    const slider = document.getElementById('temperature');
                    slider.value = '0.8';
                    slider.dispatchEvent(new Event('input'));
                });
                
                const temperatureValue = await this.page.$eval('#temperature-value', el => el.textContent);
                this.addTestResult('Parameter Adjustment', temperatureValue === '0.8', 'Temperature slider working');
            }

        } catch (error) {
            this.addTestResult('Model Parameters', false, `Error: ${error.message}`);
        }
    }

    async testChatInterface() {
        console.log('\n🔍 Testing chat interface...');
        
        try {
            // Clear any existing input
            await this.page.$eval('#user-input', el => el.value = '');
            
            // Type a test message
            const testMessage = 'Hello, this is a test message.';
            await this.page.type('#user-input', testMessage);
            
            // Check if send button is enabled
            const sendButton = await this.page.$('#send-btn');
            const isEnabled = await this.page.evaluate(btn => !btn.disabled, sendButton);
            
            this.addTestResult('Send Button State', isEnabled, 'Send button enabled with text input');

            // Test message display (without actually sending to avoid API calls)
            const inputValue = await this.page.$eval('#user-input', el => el.value);
            this.addTestResult('Message Input', inputValue === testMessage, 'Message correctly entered in input field');

        } catch (error) {
            this.addTestResult('Chat Interface', false, `Error: ${error.message}`);
        }
    }

    async testErrorHandling() {
        console.log('\n🔍 Testing error handling...');
        
        try {
            // Test empty message handling
            await this.page.$eval('#user-input', el => el.value = '');
            
            const sendButton = await this.page.$('#send-btn');
            const isDisabled = await this.page.evaluate(btn => btn.disabled, sendButton);
            
            this.addTestResult('Empty Message Handling', isDisabled, 'Send button disabled for empty input');

            // Test very long message
            const longMessage = 'A'.repeat(10000);
            await this.page.$eval('#user-input', el => el.value = '');
            await this.page.type('#user-input', longMessage);
            
            const inputValue = await this.page.$eval('#user-input', el => el.value);
            this.addTestResult('Long Message Handling', inputValue.length > 0, 'Long message input handled');

        } catch (error) {
            this.addTestResult('Error Handling', false, `Error: ${error.message}`);
        }
    }

    addTestResult(testName, passed, details) {
        this.testResults.push({ testName, passed, details });
        const status = passed ? '✅' : '❌';
        console.log(`   ${status} ${testName}: ${details}`);
    }

    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 UI TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const passRate = ((passed / total) * 100).toFixed(1);
        
        console.log(`\n🎯 Overall Results: ${passed}/${total} tests passed (${passRate}%)`);
        
        if (passed === total) {
            console.log('🎉 All UI tests passed! Frontend interface is working correctly.');
        } else {
            console.log('⚠️  Some UI tests failed. Check the details above.');
        }
        
        console.log('\n📋 Detailed Results:');
        this.testResults.forEach((result, index) => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${result.testName}`);
            if (!result.passed) {
                console.log(`   └─ ${result.details}`);
            }
        });
    }
}

// Check if puppeteer is available
try {
    const tester = new FrontendUITester();
    tester.runUITests().catch(error => {
        console.error('❌ UI Test execution failed:', error);
    });
} catch (error) {
    console.log('⚠️  Puppeteer not available. Install with: npm install puppeteer');
    console.log('   Running basic frontend tests instead...');
    
    // Fallback to basic tests
    require('./test-frontend.js');
}