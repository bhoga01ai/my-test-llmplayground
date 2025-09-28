/**
 * Manual Frontend Test Script
 * Tests frontend functionality by examining the HTML structure and JavaScript
 */

const fs = require('fs');
const path = require('path');

class ManualFrontendTester {
    constructor() {
        this.testResults = [];
        this.htmlContent = '';
        this.jsContent = '';
        this.cssContent = '';
    }

    async runManualTests() {
        console.log('🚀 Starting Manual Frontend Tests...');
        console.log('Analyzing frontend files for functionality and structure');
        console.log('\n' + '='.repeat(60));

        try {
            // Load frontend files
            await this.loadFrontendFiles();
            
            // Run tests
            await this.testHTMLStructure();
            await this.testDefaultPrompts();
            await this.testJavaScriptFunctionality();
            await this.testProviderConfiguration();
            await this.testUIComponents();
            await this.testResponsiveDesign();
            
            // Display results
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Manual test suite failed:', error.message);
        }
    }

    async loadFrontendFiles() {
        console.log('\n🔍 Loading frontend files...');
        
        try {
            this.htmlContent = fs.readFileSync('index.html', 'utf8');
            this.addTestResult('HTML File Load', true, 'index.html loaded successfully');
        } catch (error) {
            this.addTestResult('HTML File Load', false, 'Failed to load index.html');
        }

        try {
            this.jsContent = fs.readFileSync('script.js', 'utf8');
            this.addTestResult('JavaScript File Load', true, 'script.js loaded successfully');
        } catch (error) {
            this.addTestResult('JavaScript File Load', false, 'Failed to load script.js');
        }

        try {
            this.cssContent = fs.readFileSync('style.css', 'utf8');
            this.addTestResult('CSS File Load', true, 'style.css loaded successfully');
        } catch (error) {
            this.addTestResult('CSS File Load', false, 'Failed to load style.css');
        }
    }

    async testHTMLStructure() {
        console.log('\n🔍 Testing HTML structure...');
        
        // Test essential HTML elements
        const essentialElements = [
            { selector: 'title', name: 'Page Title' },
            { selector: 'class="sidebar"', name: 'Sidebar' },
            { selector: 'class="chat-container"', name: 'Chat Container' },
            { selector: 'class="input-container"', name: 'Input Container' },
            { selector: 'id="provider"', name: 'Provider Select' },
            { selector: 'id="model"', name: 'Model Select' },
            { selector: 'id="user-input"', name: 'User Input' },
            { selector: 'id="send-btn"', name: 'Send Button' },
            { selector: 'class="default-prompts"', name: 'Default Prompts Section' }
        ];

        essentialElements.forEach(element => {
            const found = this.htmlContent.includes(element.selector);
            this.addTestResult(`HTML Element: ${element.name}`, found, found ? 'Element found' : 'Element missing');
        });

        // Test meta tags
        const hasViewport = this.htmlContent.includes('name="viewport"');
        this.addTestResult('Responsive Meta Tag', hasViewport, hasViewport ? 'Viewport meta tag present' : 'Viewport meta tag missing');
    }

    async testDefaultPrompts() {
        console.log('\n🔍 Testing default prompts...');
        
        // Extract default prompts from HTML
        const promptMatches = this.htmlContent.match(/class="prompt-btn"[^>]*>([^<]+)</g);
        
        if (promptMatches && promptMatches.length > 0) {
            const prompts = promptMatches.map(match => {
                const textMatch = match.match(/>([^<]+)/);
                return textMatch ? textMatch[1].trim() : '';
            }).filter(prompt => prompt.length > 0);

            this.addTestResult('Default Prompts Found', prompts.length > 0, `Found ${prompts.length} default prompts`);
            
            // Test prompt variety
            const categories = {
                technical: ['code', 'debug', 'API', 'SQL', 'React', 'Vue'],
                creative: ['story', 'creative', 'write'],
                educational: ['explain', 'learn', 'understand', 'simple terms'],
                business: ['business', 'plan', 'startup', 'analysis']
            };

            const categoryCounts = {};
            Object.keys(categories).forEach(category => {
                categoryCounts[category] = prompts.filter(prompt => 
                    categories[category].some(keyword => 
                        prompt.toLowerCase().includes(keyword.toLowerCase())
                    )
                ).length;
            });

            const totalCategorized = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
            this.addTestResult('Prompt Variety', totalCategorized > 0, `Prompts cover ${Object.keys(categoryCounts).filter(k => categoryCounts[k] > 0).join(', ')} categories`);

            // List found prompts
            console.log('   📝 Default Prompts Found:');
            prompts.forEach((prompt, index) => {
                console.log(`      ${index + 1}. "${prompt}"`);
            });

        } else {
            this.addTestResult('Default Prompts Found', false, 'No default prompts found in HTML');
        }
    }

    async testJavaScriptFunctionality() {
        console.log('\n🔍 Testing JavaScript functionality...');
        
        // Test class definition
        const hasLLMPlaygroundClass = this.jsContent.includes('class LLMPlayground');
        this.addTestResult('LLMPlayground Class', hasLLMPlaygroundClass, hasLLMPlaygroundClass ? 'Main class defined' : 'Main class missing');

        // Test essential methods
        const essentialMethods = [
            'initializeProviderSelection',
            'sendMessage',
            'displayMessage',
            'updateModelOptions',
            'validateInput'
        ];

        essentialMethods.forEach(method => {
            const found = this.jsContent.includes(method);
            this.addTestResult(`JS Method: ${method}`, found, found ? 'Method found' : 'Method missing');
        });

        // Test provider configuration
        const hasProviderConfig = this.jsContent.includes('this.models') && this.jsContent.includes('openai');
        this.addTestResult('Provider Configuration', hasProviderConfig, hasProviderConfig ? 'Provider models configured' : 'Provider configuration missing');

        // Test event listeners
        const hasEventListeners = this.jsContent.includes('addEventListener');
        this.addTestResult('Event Listeners', hasEventListeners, hasEventListeners ? 'Event listeners implemented' : 'Event listeners missing');

        // Test API integration
        const hasAPIIntegration = this.jsContent.includes('fetch') && this.jsContent.includes('/api/');
        this.addTestResult('API Integration', hasAPIIntegration, hasAPIIntegration ? 'API calls implemented' : 'API integration missing');
    }

    async testProviderConfiguration() {
        console.log('\n🔍 Testing provider configuration...');
        
        // Extract provider information from JavaScript
        const providers = ['openai', 'anthropic', 'google'];
        
        providers.forEach(provider => {
            const found = this.jsContent.toLowerCase().includes(provider);
            this.addTestResult(`Provider: ${provider.toUpperCase()}`, found, found ? 'Provider configured' : 'Provider not found');
        });

        // Test model mappings
        const hasModelMappings = this.jsContent.includes('gpt-') || this.jsContent.includes('claude-') || this.jsContent.includes('gemini-');
        this.addTestResult('Model Mappings', hasModelMappings, hasModelMappings ? 'Model mappings found' : 'Model mappings missing');
    }

    async testUIComponents() {
        console.log('\n🔍 Testing UI components...');
        
        // Test parameter controls
        const parameterControls = [
            { id: 'temperature', name: 'Temperature Slider' },
            { id: 'max-tokens', name: 'Max Tokens Input' },
            { id: 'top-p', name: 'Top-P Slider' }
        ];

        parameterControls.forEach(control => {
            const found = this.htmlContent.includes(`id="${control.id}"`);
            this.addTestResult(`UI Control: ${control.name}`, found, found ? 'Control found' : 'Control missing');
        });

        // Test responsive design elements
        const responsiveElements = this.cssContent.includes('@media') || this.cssContent.includes('flex') || this.cssContent.includes('grid');
        this.addTestResult('Responsive Design', responsiveElements, responsiveElements ? 'Responsive CSS found' : 'Responsive design missing');

        // Test theme support
        const hasThemeSupport = this.cssContent.includes('--') || this.cssContent.includes('var(');
        this.addTestResult('CSS Variables/Theming', hasThemeSupport, hasThemeSupport ? 'CSS variables used' : 'No CSS variables found');
    }

    async testResponsiveDesign() {
        console.log('\n🔍 Testing responsive design...');
        
        // Test CSS structure
        const cssFeatures = [
            { pattern: 'display:\s*flex', name: 'Flexbox Layout' },
            { pattern: 'display:\s*grid', name: 'Grid Layout' },
            { pattern: '@media', name: 'Media Queries' },
            { pattern: 'max-width', name: 'Responsive Widths' },
            { pattern: 'overflow', name: 'Overflow Handling' }
        ];

        cssFeatures.forEach(feature => {
            const regex = new RegExp(feature.pattern, 'i');
            const found = regex.test(this.cssContent);
            this.addTestResult(`CSS Feature: ${feature.name}`, found, found ? 'Feature implemented' : 'Feature missing');
        });
    }

    addTestResult(testName, passed, details) {
        this.testResults.push({ testName, passed, details });
        const status = passed ? '✅' : '❌';
        console.log(`   ${status} ${testName}: ${details}`);
    }

    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 MANUAL TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const passRate = ((passed / total) * 100).toFixed(1);
        
        console.log(`\n🎯 Overall Results: ${passed}/${total} tests passed (${passRate}%)`);
        
        if (passed === total) {
            console.log('🎉 All manual tests passed! Frontend structure is solid.');
        } else {
            console.log('⚠️  Some tests failed. Check the implementation.');
        }
        
        // Group results by category
        const categories = {
            'File Loading': this.testResults.filter(r => r.testName.includes('File Load')),
            'HTML Structure': this.testResults.filter(r => r.testName.includes('HTML Element') || r.testName.includes('Meta Tag')),
            'Default Prompts': this.testResults.filter(r => r.testName.includes('Prompt')),
            'JavaScript': this.testResults.filter(r => r.testName.includes('JS') || r.testName.includes('Class') || r.testName.includes('API')),
            'Providers': this.testResults.filter(r => r.testName.includes('Provider') || r.testName.includes('Model')),
            'UI Components': this.testResults.filter(r => r.testName.includes('UI') || r.testName.includes('CSS'))
        };

        console.log('\n📋 Results by Category:');
        Object.entries(categories).forEach(([category, results]) => {
            if (results.length > 0) {
                const categoryPassed = results.filter(r => r.passed).length;
                const categoryTotal = results.length;
                const categoryRate = ((categoryPassed / categoryTotal) * 100).toFixed(0);
                console.log(`\n   ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
                
                results.forEach(result => {
                    const status = result.passed ? '✅' : '❌';
                    console.log(`      ${status} ${result.testName}`);
                });
            }
        });

        console.log('\n💡 Recommendations:');
        console.log('   - Test the frontend in a browser at http://localhost:8000');
        console.log('   - Try clicking different default prompts');
        console.log('   - Test provider and model switching');
        console.log('   - Verify parameter controls work correctly');
        console.log('   - Check responsive design on different screen sizes');
    }
}

// Run the manual tests
const tester = new ManualFrontendTester();
tester.runManualTests().catch(error => {
    console.error('❌ Manual test execution failed:', error);
});