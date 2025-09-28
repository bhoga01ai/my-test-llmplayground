class LLMPlayground {
    constructor() {
        this.messages = [];
        this.currentConfig = {
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2048,
            topP: 1.0
        };
        
        this.initializeElements();
        this.bindEvents();
        this.updateConfigDisplay();
        
        // Initialize provider/model selection
        this.initializeProviderSelection();
    }
    
    initializeProviderSelection() {
        // Model mapping for each provider
        this.providerModels = {
            'openai': [
                { value: 'gpt-4', text: 'GPT-4' },
                { value: 'gpt-4-turbo', text: 'GPT-4 Turbo' },
                { value: 'gpt-4o', text: 'GPT-4o' },
                { value: 'gpt-4o-mini', text: 'GPT-4o Mini' },
                { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' }
            ],
            'groq': [
                { value: 'llama-3.1-8b-instant', text: 'Llama 3.1 8B Instant' },
                { value: 'gemma2-9b-it', text: 'Gemma2 9B IT' },
                { value: 'openai/gpt-oss-120b', text: 'GPT OSS 120B' }
            ],
            'google': [
                { value: 'gemini-2.5-pro', text: 'Gemini 2.5 Pro' },
                { value: 'gemini-2.5-flash', text: 'Gemini 2.5 Flash' },
                { value: 'gemini-2.5-flash-lite', text: 'Gemini 2.5 Flash-Lite' },
                { value: 'gemini-2.0-flash', text: 'Gemini 2.0 Flash' },
                { value: 'gemini-2.0-flash-lite', text: 'Gemini 2.0 Flash-Lite' }
            ],
            'anthropic': [
                { value: 'claude-opus-4-1-20250805', text: 'Claude Opus 4.1' },
                { value: 'claude-opus-4-20250514', text: 'Claude Opus 4' },
                { value: 'claude-sonnet-4-20250514', text: 'Claude Sonnet 4' }
            ]
        };

        // Bind provider selection change event
        const providerSelect = document.getElementById('providerSelect');
        const modelSelect = document.getElementById('modelSelect');
        
        if (providerSelect && modelSelect) {
            providerSelect.addEventListener('change', (e) => {
                this.updateModelOptions(e.target.value, modelSelect);
            });
            
            // Add event listener for model selection changes
            modelSelect.addEventListener('change', (e) => {
                this.currentConfig.model = e.target.value;
            });
            
            // Initialize with default provider
            this.updateModelOptions(providerSelect.value, modelSelect);
        }
    }

    updateModelOptions(provider, modelSelect) {
        // Clear existing options
        modelSelect.innerHTML = '';
        
        // Add new options based on selected provider
        const models = this.providerModels[provider] || [];
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.text;
            modelSelect.appendChild(option);
        });
        
        // Update the current config with the first model of the new provider
        if (models.length > 0) {
            this.currentConfig.model = models[0].value;
            modelSelect.value = models[0].value;
        }
    }
    
    initializeElements() {
        // Main elements
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.fixedMessageInput = document.getElementById('fixedMessageInput');
        this.fixedSendBtn = document.getElementById('fixedSendBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatContainer = document.querySelector('.chat-container');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.configPanel = document.getElementById('configPanel');
        this.closeConfig = document.getElementById('closeConfig');
        
        // Configuration elements
        this.modelSelect = document.getElementById('modelSelect');
        this.temperatureSlider = document.getElementById('temperature');
        this.maxTokensSlider = document.getElementById('maxTokens');
        this.topPSlider = document.getElementById('topP');
        
        // Value display elements
        this.tempValue = document.getElementById('tempValue');
        this.tokensValue = document.getElementById('tokensValue');
        this.topPValue = document.getElementById('topPValue');
        
        // Sidebar elements
        this.newChatBtn = document.querySelector('.new-chat-btn');
    }
    
    bindEvents() {
        // Message input events for both input containers
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.fixedMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage(true);
            }
        });
        
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.fixedSendBtn.addEventListener('click', () => this.sendMessage(true));
        
        // Configuration panel events
        this.settingsBtn.addEventListener('click', () => this.toggleConfigPanel());
        this.closeConfig.addEventListener('click', () => this.closeConfigPanel());
        
        // Configuration controls
        this.modelSelect.addEventListener('change', (e) => {
            this.currentConfig.model = e.target.value;
        });
        
        this.temperatureSlider.addEventListener('input', (e) => {
            this.currentConfig.temperature = parseFloat(e.target.value);
            this.tempValue.textContent = e.target.value;
        });
        
        this.maxTokensSlider.addEventListener('input', (e) => {
            this.currentConfig.maxTokens = parseInt(e.target.value);
            this.tokensValue.textContent = e.target.value;
        });
        
        this.topPSlider.addEventListener('input', (e) => {
            this.currentConfig.topP = parseFloat(e.target.value);
            this.topPValue.textContent = e.target.value;
        });
        
        // Additional configuration controls
        const presencePenaltySlider = document.getElementById('presencePenalty');
        const frequencyPenaltySlider = document.getElementById('frequencyPenalty');
        
        if (presencePenaltySlider) {
            presencePenaltySlider.addEventListener('input', (e) => {
                document.getElementById('presencePenaltyValue').textContent = e.target.value;
            });
        }
        
        if (frequencyPenaltySlider) {
            frequencyPenaltySlider.addEventListener('input', (e) => {
                document.getElementById('frequencyPenaltyValue').textContent = e.target.value;
            });
        }
        
        // New chat button
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        
        // Default prompt cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.prompt-card')) {
                const promptCard = e.target.closest('.prompt-card');
                const promptText = promptCard.getAttribute('data-prompt');
                this.messageInput.value = promptText;
                this.messageInput.focus();
                this.updateSendButton();
                // Automatically send the message
                this.sendMessage();
            }
        });
        
        // Close config panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.configPanel.classList.contains('open') && 
                !this.configPanel.contains(e.target) && 
                !this.settingsBtn.contains(e.target)) {
                this.closeConfigPanel();
            }
        });
        
        // Input validation for both inputs
        this.messageInput.addEventListener('input', () => {
            this.updateSendButton();
        });
        
        this.fixedMessageInput.addEventListener('input', () => {
            this.updateSendButton(true);
        });
    }
    
    updateConfigDisplay() {
        this.modelSelect.value = this.currentConfig.model;
        this.temperatureSlider.value = this.currentConfig.temperature;
        this.maxTokensSlider.value = this.currentConfig.maxTokens;
        this.topPSlider.value = this.currentConfig.topP;
        
        this.tempValue.textContent = this.currentConfig.temperature;
        this.tokensValue.textContent = this.currentConfig.maxTokens;
        this.topPValue.textContent = this.currentConfig.topP;
    }
    
    updateSendButton(isFixed = false) {
        if (isFixed) {
            const hasText = this.fixedMessageInput.value.trim().length > 0;
            this.fixedSendBtn.disabled = !hasText;
        } else {
            const hasText = this.messageInput.value.trim().length > 0;
            this.sendBtn.disabled = !hasText;
        }
    }
    
    toggleConfigPanel() {
        this.configPanel.classList.toggle('open');
    }
    
    closeConfigPanel() {
        this.configPanel.classList.remove('open');
    }
    
    async sendMessage(isFixed = false) {
        const messageInput = isFixed ? this.fixedMessageInput : this.messageInput;
        const messageText = messageInput.value.trim();
        if (!messageText) return;
        
        // Add user message
        this.addMessage('user', messageText);
        
        // Clear input
        messageInput.value = '';
        this.updateSendButton(isFixed);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Use the backend API client if available, otherwise fallback to local generation
            if (window.backendClient) {
                console.log('Using backend client for chat completion');
                const response = await window.backendClient.chatCompletion({
                    prompt: messageText,
                    model: this.currentConfig.model,
                    provider: document.getElementById('providerSelect').value,
                    parameters: {
                        temperature: this.currentConfig.temperature,
                        max_tokens: this.currentConfig.maxTokens,
                        top_p: this.currentConfig.topP
                    }
                });
                
                console.log('Received response from backend:', response);
                this.hideTypingIndicator();
                this.addMessage('assistant', response.content);
            } else {
                console.log('Backend client not available, using local generation');
                // Fallback to local generation if backend is not available
                setTimeout(() => {
                    this.hideTypingIndicator();
                    this.generateResponse(messageText);
                }, 1000 + Math.random() * 2000);
            }
        } catch (error) {
            console.error('Error getting model response:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', 'Sorry, I encountered an error processing your request. Please try again.');
        }
    }
    
    addMessage(role, content) {
        const message = { role, content, timestamp: new Date() };
        this.messages.push(message);
        
        const messageElement = this.createMessageElement(role, content);
        this.chatMessages.appendChild(messageElement);
        
        // Add has-messages class when first message is added
        if (this.messages.length === 1) {
            this.chatContainer.classList.add('has-messages');
        }
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Update chat header visibility
        this.updateChatHeader();
        
        // Auto-save to localStorage
        localStorage.setItem('llm-playground-messages', JSON.stringify(this.messages));
    }
    
    createMessageElement(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        return messageDiv;
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingElement = this.chatMessages.querySelector('.typing');
        if (typingElement) {
            typingElement.remove();
        }
    }
    
    generateResponse(userMessage) {
        // Simulate different types of responses based on user input
        let response;
        
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            response = "Hello! I'm an AI assistant. How can I help you today?";
        } else if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
            response = "I'd be happy to help you with coding! What programming language or specific problem are you working on?";
        } else if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
            response = "I can explain various topics for you. Could you be more specific about what you'd like me to explain?";
        } else if (lowerMessage.includes('help')) {
            response = "I'm here to help! I can assist with coding, explanations, creative writing, analysis, and much more. What would you like to work on?";
        } else if (lowerMessage.includes('temperature')) {
            response = `The current temperature setting is ${this.currentConfig.temperature}. This controls the randomness of my responses - lower values make responses more focused and deterministic, while higher values make them more creative and varied.`;
        } else if (lowerMessage.includes('model')) {
            response = `I'm currently configured to use ${this.currentConfig.model}. You can change the model in the settings panel if needed.`;
        } else {
            const responses = [
                "That's an interesting question! Let me think about that...",
                "I understand what you're asking. Here's my perspective on that:",
                "Great question! I'd be happy to help you with that.",
                "Let me provide you with some information about that topic.",
                "That's a thoughtful inquiry. Here's what I can tell you:"
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
            
            // Add some context-aware content
            if (lowerMessage.length > 50) {
                response += " I can see you've provided quite a bit of detail, which helps me give you a more targeted response.";
            }
        }
        
        this.addMessage('assistant', response);
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    updateChatHeader() {
        const chatHeader = document.querySelector('.chat-welcome');
        if (chatHeader) {
            if (this.messages.length > 0) {
                chatHeader.style.display = 'none';
                this.chatContainer.classList.add('has-messages');
            } else {
                chatHeader.style.display = 'block';
                this.chatContainer.classList.remove('has-messages');
            }
        }
    }
    
    startNewChat() {
        this.messages = [];
        this.chatMessages.innerHTML = '';
        this.messageInput.value = '';
        this.fixedMessageInput.value = '';
        this.updateSendButton();
        this.updateSendButton(true);
        this.chatContainer.classList.remove('has-messages');
        this.updateChatHeader();
        this.messageInput.focus();
    }
    
    // Utility methods
    formatTimestamp(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    exportChat() {
        const chatData = {
            messages: this.messages,
            config: this.currentConfig,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
}

// Initialize the playground when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.llmPlayground = new LLMPlayground();
    
    // Initialize backend client
    try {
        window.backendClient = new BackendAPIClient();
        console.log('Backend client initialized');
        
        // Check backend health
        window.backendClient.checkHealth()
            .then(health => {
                console.log('Backend health:', health);
                document.querySelector('.status-indicator').classList.add('online');
                document.querySelector('.status-text').textContent = 'Backend Connected';
            })
            .catch(error => {
                console.error('Backend health check failed:', error);
                document.querySelector('.status-text').textContent = 'Local Mode';
            });
    } catch (error) {
        console.error('Failed to initialize backend client:', error);
        document.querySelector('.status-text').textContent = 'Local Mode';
    }
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus on input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('messageInput').focus();
    }
    
    // Ctrl/Cmd + Shift + C to start new chat
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        window.playground.startNewChat();
    }
    
    // Escape to close config panel
    if (e.key === 'Escape') {
        window.playground.closeConfigPanel();
    }
});

// Add mobile menu toggle functionality
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
}

// Add mobile menu button for smaller screens
if (window.innerWidth <= 768) {
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.style.cssText = `
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 1002;
        background: #2d2d2d;
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    document.body.appendChild(mobileMenuBtn);
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.remove('open');
    }
});