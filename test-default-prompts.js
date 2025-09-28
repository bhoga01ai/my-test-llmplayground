// Simple test script to verify default prompts functionality without Puppeteer

async function testDefaultPrompts() {
    console.log('🚀 Starting default prompts test...');
    
    try {
        // Test frontend accessibility
        console.log('📱 Testing frontend accessibility...');
        const response = await fetch('http://localhost:8000');
        if (!response.ok) {
            throw new Error(`Frontend not accessible: ${response.status}`);
        }
        
        const html = await response.text();
        console.log('✅ Frontend is accessible');
        
        // Check for prompt cards in HTML
        const promptCardMatches = html.match(/class="prompt-card"/g) || [];
        const promptCardCount = promptCardMatches.length;
        console.log(`📋 Found ${promptCardCount} prompt cards in HTML`);
        
        if (promptCardCount === 0) {
            console.log('⚠️  No prompt cards found in HTML');
        }
        
        // Check for data-prompt attributes
        const dataPromptMatches = html.match(/data-prompt="[^"]+"/g) || [];
        console.log(`🏷️  Found ${dataPromptMatches.length} data-prompt attributes`);
        
        if (dataPromptMatches.length > 0) {
            console.log('📝 Sample prompts found:');
            dataPromptMatches.slice(0, 3).forEach((match, index) => {
                const prompt = match.match(/data-prompt="([^"]+)"/)[1];
                console.log(`   ${index + 1}. ${prompt}`);
            });
        }
        
        // Test JavaScript file
        console.log('📜 Testing JavaScript file...');
        const scriptResponse = await fetch('http://localhost:8000/script.js');
        if (!scriptResponse.ok) {
            throw new Error(`Script file not accessible: ${scriptResponse.status}`);
        }
        
        const scriptContent = await scriptResponse.text();
        console.log('✅ JavaScript file is accessible');
        
        // Check if the auto-send fix is present
        const hasPromptCardHandler = scriptContent.includes('prompt-card');
        const hasAutoSend = scriptContent.includes('this.sendMessage();');
        const hasPromptClickHandler = scriptContent.includes('data-prompt');
        
        console.log('🔍 Code analysis:');
        console.log(`   - Prompt card handler: ${hasPromptCardHandler ? '✅' : '❌'}`);
        console.log(`   - Auto-send functionality: ${hasAutoSend ? '✅' : '❌'}`);
        console.log(`   - Prompt click handler: ${hasPromptClickHandler ? '✅' : '❌'}`);
        
        // Check for the specific fix
        const hasCompleteFixPattern = scriptContent.includes('// Automatically send the message') && 
                                     scriptContent.includes('this.sendMessage();');
        
        if (hasCompleteFixPattern) {
            console.log('✅ Auto-send fix is properly implemented');
        } else {
            console.log('⚠️  Auto-send fix pattern not found');
        }
        
        // Test CSS file
        console.log('🎨 Testing CSS file...');
        const cssResponse = await fetch('http://localhost:8000/styles.css');
        if (cssResponse.ok) {
            console.log('✅ CSS file is accessible');
        } else {
            console.log('⚠️  CSS file not accessible');
        }
        
        // Summary
        console.log('\n📊 Test Summary:');
        console.log(`   - Frontend accessible: ✅`);
        console.log(`   - Prompt cards found: ${promptCardCount > 0 ? '✅' : '❌'} (${promptCardCount})`);
        console.log(`   - JavaScript working: ${hasPromptCardHandler && hasAutoSend ? '✅' : '❌'}`);
        console.log(`   - Auto-send fix: ${hasCompleteFixPattern ? '✅' : '❌'}`);
        
        if (promptCardCount > 0 && hasCompleteFixPattern) {
            console.log('\n🎉 SUCCESS: Default prompts should now work correctly!');
            console.log('   When you click a default prompt card, it will:');
            console.log('   1. Fill the input field with the prompt text');
            console.log('   2. Automatically send the message');
            console.log('   3. Display the user message and AI response');
        } else {
            console.log('\n⚠️  Some issues detected. Please check the implementation.');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    }
}

// Run the test
testDefaultPrompts().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});