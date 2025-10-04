class LLMPlayground {
    constructor() {
        this.messages = [];
        this.currentConfig = {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2048,
            topP: 1.0,
            presencePenalty: 0.0,
            frequencyPenalty: 0.0,
            seed: null,
            stopSequence: ''
        };
        
        // Voice functionality state
        this.isRecording = false;
        this.fromVoice = false;
        this.currentVoiceInputFixed = false;
        this.voiceInputAnnounced = false;
        this.speechDetectionTimeout = null;
        
        // Load voice output preference from localStorage or default to true
        const savedVoiceOutputPref = localStorage.getItem('voiceOutputEnabled');
        this.voiceOutputEnabled = savedVoiceOutputPref !== null ?
            savedVoiceOutputPref === 'true' : true;
        
        this.recognition = null;
        
        // File upload state
        this.uploadedFiles = [];
        this.maxFileSize = 1024 * 1024; // 1MB in bytes
        this.allowedFileTypes = ['text/plain', 'application/pdf', 'application/json', 'text/markdown', 'text/csv'];
        this.allowedExtensions = ['.txt', '.pdf', '.json', '.md', '.csv'];
        
        this.initializeElements();
        this.bindEvents();
        
        // Initialize provider/model selection first
        this.initializeProviderSelection();
        
        // Then update config display
        this.updateConfigDisplay();
        
        // Add tooltips to settings
        this.addTooltips();
        
        // Initialize code modal
        this.initializeCodeModal();
        
        // Initialize speech recognition
        this.initializeSpeechRecognition();
        
        // Initialize speech synthesis
        this.initializeSpeechSynthesis();
        
        // Initialize file upload functionality
        this.initializeFileUpload();
        
        // Set PDF.js worker path
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        
        // Load chat history on initialization
        this.loadChatHistoryList();
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
                this.currentConfig.provider = e.target.value;
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
        
        // Voice elements
        this.voiceInputBtn = document.getElementById('voiceInputBtn');
        this.fixedVoiceInputBtn = document.getElementById('fixedVoiceInputBtn');
        this.voiceOutputBtn = document.getElementById('mainVoiceOutputBtn');
        this.fixedVoiceOutputBtn = document.getElementById('fixedVoiceOutputBtn');
        
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
        
        // Code modal elements
        this.viewCodeBtn = document.getElementById('viewCodeBtn');
        this.codeModal = document.getElementById('codeModal');
        this.closeCodeModalBtn = document.getElementById('closeCodeModal');
        this.codeTypeButtons = document.querySelectorAll('.code-type-btn');
        this.codeDisplay = document.getElementById('codeDisplay');
        this.copyCodeBtn = document.getElementById('copyCodeBtn');
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
        
        // Voice control events
        if (this.voiceInputBtn) {
            this.voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
        }
        if (this.fixedVoiceInputBtn) {
            this.fixedVoiceInputBtn.addEventListener('click', () => this.toggleVoiceInput(true));
        }
        if (this.voiceOutputBtn) {
            this.voiceOutputBtn.addEventListener('click', () => this.toggleVoiceOutput());
        }
        if (this.fixedVoiceOutputBtn) {
            this.fixedVoiceOutputBtn.addEventListener('click', () => this.toggleVoiceOutput());
        }
        // Gemini speech toggle buttons have been removed
        
        // Code modal events
        if (this.viewCodeBtn) {
            this.viewCodeBtn.addEventListener('click', () => this.openCodeModal());
        }
        if (this.closeCodeModalBtn) {
            this.closeCodeModalBtn.addEventListener('click', () => this.closeCodeModal());
        }
        if (this.copyCodeBtn) {
            this.copyCodeBtn.addEventListener('click', () => this.copyCodeToClipboard());
        }
        if (this.codeTypeButtons) {
            this.codeTypeButtons.forEach(button => {
                button.addEventListener('click', () => this.switchCodeType(button.dataset.codeType));
            });
        }
        
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
                this.currentConfig.presencePenalty = parseFloat(e.target.value);
                document.getElementById('presencePenaltyValue').textContent = e.target.value;
            });
        }
        
        if (frequencyPenaltySlider) {
            frequencyPenaltySlider.addEventListener('input', (e) => {
                this.currentConfig.frequencyPenalty = parseFloat(e.target.value);
                document.getElementById('frequencyPenaltyValue').textContent = e.target.value;
            });
        }
        
        // Seed and stop sequence inputs
        const seedInput = document.getElementById('seed');
        const stopSequenceInput = document.getElementById('stopSequence');
        
        if (seedInput) {
            seedInput.addEventListener('input', (e) => {
                this.currentConfig.seed = e.target.value ? parseInt(e.target.value) : null;
            });
        }
        
        if (stopSequenceInput) {
            stopSequenceInput.addEventListener('input', (e) => {
                this.currentConfig.stopSequence = e.target.value;
            });
        }
        
        // New chat button
        this.newChatBtn.addEventListener('click', async () => await this.startNewChat());
        
        // Default prompt cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.prompt-card')) {
                const promptCard = e.target.closest('.prompt-card');
                const promptText = promptCard.getAttribute('data-prompt');
                this.messageInput.value = promptText;
                this.messageInput.focus();
                this.updateSendButton();
                // Don't automatically send - let user press Enter to send
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
        const providerSelect = document.getElementById('providerSelect');
        if (providerSelect && this.currentConfig.provider) {
            providerSelect.value = this.currentConfig.provider;
            this.updateModelOptions(this.currentConfig.provider, this.modelSelect);
        }
        
        this.modelSelect.value = this.currentConfig.model;
        this.temperatureSlider.value = this.currentConfig.temperature;
        this.maxTokensSlider.value = this.currentConfig.maxTokens;
        this.topPSlider.value = this.currentConfig.topP;
        
        this.tempValue.textContent = this.currentConfig.temperature;
        this.tokensValue.textContent = this.currentConfig.maxTokens;
        this.topPValue.textContent = this.currentConfig.topP;
        
        // Update additional parameters
        const presencePenaltySlider = document.getElementById('presencePenalty');
        const frequencyPenaltySlider = document.getElementById('frequencyPenalty');
        const seedInput = document.getElementById('seed');
        const stopSequenceInput = document.getElementById('stopSequence');
        
        if (presencePenaltySlider) {
            presencePenaltySlider.value = this.currentConfig.presencePenalty || 0.0;
            document.getElementById('presencePenaltyValue').textContent = this.currentConfig.presencePenalty || 0.0;
        }
        
        if (frequencyPenaltySlider) {
            frequencyPenaltySlider.value = this.currentConfig.frequencyPenalty || 0.0;
            document.getElementById('frequencyPenaltyValue').textContent = this.currentConfig.frequencyPenalty || 0.0;
        }
        
        if (seedInput) {
            seedInput.value = this.currentConfig.seed || '';
        }
        
        if (stopSequenceInput) {
            stopSequenceInput.value = this.currentConfig.stopSequence || '';
        }
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
        // Add a small delay to ensure the DOM is ready
        setTimeout(() => {
            this.configPanel.classList.toggle('open');
        }, 0);
    }
    
    closeConfigPanel() {
        this.configPanel.classList.remove('open');
    }
    
    addTooltips() {
        // Add tooltips to each setting
        this.createTooltip('providerSelect', 'Select the AI provider to use for generating responses.', 'Examples: OpenAI, Anthropic, etc.');
        this.createTooltip('modelSelect', 'Choose the specific model from the selected provider.', 'Examples: GPT-4, Claude, etc.');
        this.createTooltip('temperature', 'Controls randomness. Lower values are more deterministic, higher values more creative.', 'Examples: 0.2 for factual, 0.8 for creative');
        this.createTooltip('maxTokens', 'Maximum number of tokens (words/characters) in the generated response.', 'Examples: 256 for short, 1024 for detailed');
        this.createTooltip('topP', 'Controls diversity via nucleus sampling. Lower values make output more focused.', 'Examples: 0.1 for focused, 0.9 for diverse');
        this.createTooltip('seed', 'Optional seed for deterministic outputs. Same seed with same prompt gives same result.', 'Examples: 42, 12345, etc.');
        this.createTooltip('stopSequence', 'Sequence that stops generation when encountered.', 'Examples: "###", "END", etc.');
        this.createTooltip('presencePenalty', 'Penalizes new tokens based on their presence in text so far.', 'Examples: 0.0 for no penalty, 1.0 for high penalty');
        this.createTooltip('frequencyPenalty', 'Penalizes new tokens based on their frequency in text so far.', 'Examples: 0.0 for no penalty, 1.0 for high penalty');
        this.createTooltip('systemPrompt', 'Instructions that guide the AI\'s behavior throughout the conversation.', 'Example: "You are a helpful assistant."');
    }
    
    createTooltip(elementId, description, examples) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Find the label for this element
        let label = element.previousElementSibling;
        if (!label || label.tagName !== 'LABEL') {
            // If no direct label, look for parent's first child that's a label
            const parent = element.parentElement;
            if (parent) {
                label = parent.querySelector('label');
            }
        }
        
        if (label) {
            // Create tooltip container
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip';
            
            // Create tooltip icon
            const icon = document.createElement('span');
            icon.className = 'tooltip-icon';
            icon.textContent = '?';
            tooltip.appendChild(icon);
            
            // Create tooltip text
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltip-text';
            tooltipText.textContent = description;
            
            // Add examples if provided
            if (examples) {
                const examplesEl = document.createElement('div');
                examplesEl.className = 'tooltip-examples';
                examplesEl.textContent = examples;
                tooltipText.appendChild(examplesEl);
            }
            
            tooltip.appendChild(tooltipText);
            label.appendChild(tooltip);
        }
    }
    
    initializeSpeechRecognition() {
        // Check if the browser supports the Web Speech API for speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            console.log('Speech recognition is supported in this browser');
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Track recognition attempts and no-speech errors
            this.recognitionAttempts = 0;
            this.noSpeechErrors = 0;
            
            // Configure speech recognition settings
            this.recognition.continuous = true; // Continue listening until manually stopped
            this.recognition.interimResults = true; // Get interim results for real-time feedback
            this.recognition.lang = 'en-US'; // Set language to English (US)
            this.recognition.maxAlternatives = 5; // Get more alternatives for better accuracy
            
            // Add service-specific settings for better performance
            if (this.recognition.serviceURI) {
                this.recognition.serviceURI = 'wss://www.google.com/speech-api/v2/recognize';
            }
            
            // Event handler for when speech recognition starts
            this.recognition.onstart = () => {
                console.log('Speech recognition started - ready to detect speech');
                this.isRecording = true;
                this.updateVoiceButtonState();
                
                // Reset error counters on each new start
                this.recognitionAttempts++;
                this.noSpeechErrors = 0;
                
                // Show different messages based on attempt count
                let message = 'Listening... Speak clearly into your microphone';
                if (this.recognitionAttempts > 1) {
                    message = `Listening again (attempt ${this.recognitionAttempts})... Please speak clearly and loudly`;
                }
                
                this.showNotification(message, 'info');
                
                // Add a visual indicator that microphone is active
                const messageInput = this.currentVoiceInputFixed ? this.fixedMessageInput : this.messageInput;
                messageInput.placeholder = 'Listening... Speak now';
            };
            
            // Event handler for speech recognition results
            this.recognition.onresult = (event) => {
                const resultIndex = event.resultIndex;
                const result = event.results[resultIndex];
                const isFinal = result.isFinal;
                
                // Get the transcript with highest confidence
                let bestTranscript = result[0].transcript;
                let bestConfidence = result[0].confidence;
                
                // Log all alternatives for debugging
                for (let i = 0; i < result.length; i++) {
                    console.log(`Alternative ${i}: ${result[i].transcript} (confidence: ${result[i].confidence})`);
                    if (result[i].confidence > bestConfidence) {
                        bestTranscript = result[i].transcript;
                        bestConfidence = result[i].confidence;
                    }
                }
                
                console.log(`Speech recognition result (${isFinal ? 'final' : 'interim'}):`, bestTranscript);
                
                // Always update the input field with interim results for real-time feedback
                const messageInput = this.currentVoiceInputFixed ? this.fixedMessageInput : this.messageInput;
                messageInput.value = bestTranscript;
                
                // Process for auto-sending only on final results or high-confidence interim results
                if (isFinal || bestConfidence > 0.8) {
                    this.handleVoiceInput(bestTranscript);
                }
            };
            
            // Event handler for speech recognition errors
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error, event);
                this.isRecording = false;
                this.updateVoiceButtonState();
                
                // Clear any pending speech detection timeout
                if (this.speechDetectionTimeout) {
                    clearTimeout(this.speechDetectionTimeout);
                    this.speechDetectionTimeout = null;
                }
                
                let errorMessage = 'Voice input failed';
                switch (event.error) {
                    case 'no-speech':
                        errorMessage = 'No speech detected. Please check your microphone and speak clearly.';
                        console.log('No speech detected - will restart recognition');
                        
                        // Reset recording state properly
                        this.isRecording = false;
                        this.updateVoiceButtonState();
                        
                        // Show a notification
                        this.showNotification('⚠️ No speech detected. Click the microphone button to try again', 'warning');
                        
                        // Reset the input placeholder
                        const messageInput = this.currentVoiceInputFixed ? this.fixedMessageInput : this.messageInput;
                        messageInput.placeholder = 'Type a message or use voice input...';
                        
                        return; // Skip the rest of the error handler
                    case 'audio-capture':
                        errorMessage = 'Microphone not accessible. Please check permissions.';
                        break;
                    case 'not-allowed':
                        errorMessage = 'Microphone permission denied. Please enable microphone access.';
                        break;
                    case 'network':
                        errorMessage = 'Network error occurred. Please check your connection.';
                        break;
                    case 'aborted':
                        errorMessage = 'Speech recognition was aborted.';
                        break;
                    default:
                        errorMessage = `Voice input error: ${event.error}`;
                }
                
                this.showNotification(errorMessage, 'error');
            };
            
            // Event handler for when speech recognition ends
            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                this.isRecording = false;
                this.updateVoiceButtonState();
                
                // Clear any pending speech detection timeout
                if (this.speechDetectionTimeout) {
                    clearTimeout(this.speechDetectionTimeout);
                    this.speechDetectionTimeout = null;
                }
                
                // Reset the input placeholder
                const messageInput = this.currentVoiceInputFixed ? this.fixedMessageInput : this.messageInput;
                messageInput.placeholder = 'Type a message or use voice input...';
            };
        } else {
            console.warn('Speech recognition not supported in this browser');
            // Disable voice input buttons if speech recognition is not supported
            if (this.voiceInputBtn) this.voiceInputBtn.disabled = true;
            if (this.fixedVoiceInputBtn) this.fixedVoiceInputBtn.disabled = true;
            this.showNotification('Speech recognition is not supported in this browser', 'error');
        }
    }
    
    initializeSpeechSynthesis() {
        // Initialize speech synthesis
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            console.log('Speech synthesis initialized');
            
            // Always use Gemini for speech
            this.useGeminiForSpeech = true;
            localStorage.setItem('useGeminiForSpeech', 'true');
            
            // Load voices
            let voices = this.speechSynthesis.getVoices();
            if (voices.length === 0) {
                // Chrome needs a callback to get voices
                window.speechSynthesis.onvoiceschanged = () => {
                    voices = this.speechSynthesis.getVoices();
                    console.log(`Loaded ${voices.length} voices for speech synthesis`);
                };
            } else {
                console.log(`Loaded ${voices.length} voices for speech synthesis`);
            }
        } else {
            console.warn('Speech synthesis not supported in this browser');
            this.speechSynthesis = null;
            
            // Disable voice output if speech synthesis is not supported
            this.voiceOutputEnabled = false;
            if (this.voiceOutputBtn) {
                this.voiceOutputBtn.disabled = true;
                this.voiceOutputBtn.title = 'Text-to-speech not supported in this browser';
            }
        }
        
        // Initialize voice output button state
        if (this.voiceOutputBtn) {
            this.updateVoiceOutputButton();
        }
    }
    
    /**
     * Initialize file upload functionality
     */
    initializeFileUpload() {
        this.fileInput = document.getElementById('fileInput');
        this.fileChipsContainer = document.getElementById('fileChipsContainer');
        this.uploadFileBtn = document.getElementById('uploadFileBtn');
        this.sendFilesBtn = document.getElementById('sendFilesBtn');
        
        // Add event listener for the standalone upload button
        if (this.uploadFileBtn && this.fileInput) {
            this.uploadFileBtn.addEventListener('click', (e) => {
                console.log('Upload button clicked');
                e.preventDefault();
                this.fileInput.click();
            });
        }
        
        // Add a document-level event listener for the attach button and its icon
        document.addEventListener('click', (e) => {
            // Check if the click is on the plus icon or the button itself
            const isPlusIcon = e.target.tagName === 'I' && e.target.classList.contains('fa-plus');
            const isAttachBtn = e.target.id === 'attachBtn' || e.target.classList.contains('attach-btn');
            
            if ((isPlusIcon || isAttachBtn) && this.fileInput) {
                console.log('Attach button or plus icon clicked');
                e.preventDefault();
                e.stopPropagation();
                this.fileInput.click();
            }
        });
        
        // File input change handler
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                console.log('File input changed:', e.target.files);
                this.handleFileSelection(e.target.files);
            });
            
            // Drag and drop functionality
            this.initializeDragAndDrop();
        }
        
        // Add event listener for the Send Files button
        if (this.sendFilesBtn) {
            this.sendFilesBtn.addEventListener('click', (e) => {
                console.log('Send Files button clicked');
                e.preventDefault();
                // Send only files without a message
                this.sendMessage(false, true);
            });
        }
    }
    
    /**
     * Initialize drag and drop functionality
     */
    initializeDragAndDrop() {
        const inputContainer = document.querySelector('.input-container');
        
        if (inputContainer) {
            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                inputContainer.addEventListener(eventName, this.preventDefaults, false);
                document.body.addEventListener(eventName, this.preventDefaults, false);
            });
            
            // Highlight drop area when item is dragged over it
            ['dragenter', 'dragover'].forEach(eventName => {
                inputContainer.addEventListener(eventName, () => this.highlight(inputContainer), false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                inputContainer.addEventListener(eventName, () => this.unhighlight(inputContainer), false);
            });
            
            // Handle dropped files
            inputContainer.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                this.handleFileSelection(files);
            }, false);
        }
    }
    
    /**
     * Prevent default drag behaviors
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    /**
     * Highlight drop area
     */
    highlight(element) {
        element.classList.add('drag-over');
    }
    
    /**
     * Remove highlight from drop area
     */
    unhighlight(element) {
        element.classList.remove('drag-over');
    }
    
    /**
     * Handle file selection from input or drag and drop
     */
    handleFileSelection(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.processFile(file);
            }
        });
        
        // Clear the file input
        if (this.fileInput) {
            this.fileInput.value = '';
        }
    }
    
    /**
     * Validate file type and size
     */
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            this.showNotification(`File "${file.name}" is too large. Maximum size is 1MB.`, 'error');
            return false;
        }
        
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.allowedExtensions.includes(fileExtension)) {
            this.showNotification(`File type "${fileExtension}" is not supported. Allowed types: ${this.allowedExtensions.join(', ')}`, 'error');
            return false;
        }
        
        // Check if file already exists
        if (this.uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
            this.showNotification(`File "${file.name}" is already uploaded.`, 'warning');
            return false;
        }
        
        return true;
    }
    
    /**
     * Process and extract content from file
     */
    async processFile(file) {
        try {
            let content = '';
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (fileExtension === '.pdf') {
                content = await this.extractPDFContent(file);
            } else {
                // For text files (txt, json, md, csv)
                content = await this.readTextFile(file);
            }
            
            const fileData = {
                name: file.name,
                size: file.size,
                type: fileExtension,
                content: content,
                id: Date.now() + Math.random() // Simple unique ID
            };
            
            this.uploadedFiles.push(fileData);
            this.displayFileChip(fileData);
            this.showNotification(`File "${file.name}" uploaded successfully.`, 'success');
            
        } catch (error) {
            console.error('Error processing file:', error);
            this.showNotification(`Error processing file "${file.name}": ${error.message}`, 'error');
        }
    }
    
    /**
     * Read text content from file
     */
    readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                    
                    // Format JSON files for better readability
                    if (fileExtension === '.json') {
                        try {
                            const jsonObj = JSON.parse(content);
                            resolve(JSON.stringify(jsonObj, null, 2)); // Pretty print JSON
                        } catch (jsonError) {
                            // If JSON parsing fails, return as plain text
                            console.warn('Failed to parse JSON, returning as plain text:', jsonError);
                            resolve(content);
                        }
                    } else {
                        // Return other text files as-is
                        resolve(content);
                    }
                } catch (error) {
                    reject(new Error(`Failed to process file: ${error.message}`));
                }
            };
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Extract content from PDF file using PDF.js
     */
    async extractPDFContent(file) {
        return new Promise((resolve, reject) => {
            try {
                // Ensure PDF.js is available
                if (!window.pdfjsLib) {
                    console.error('PDF.js library not loaded');
                    reject(new Error('PDF.js library not loaded. Please refresh the page and try again.'));
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const typedArray = new Uint8Array(event.target.result);
                    
                    // Initialize PDF.js with proper error handling
                    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
                    
                    try {
                        const pdf = await loadingTask.promise;
                        let fullText = `[PDF File: ${file.name}]\n\n`;
                        
                        // Extract text from each page (with page limit for very large PDFs)
                        const maxPages = Math.min(pdf.numPages, 50); // Limit to 50 pages for performance
                        
                        if (pdf.numPages > 50) {
                            fullText += `[Note: This PDF has ${pdf.numPages} pages. Only the first 50 pages are shown.]\n\n`;
                        }
                        
                        // Set a timeout for the entire PDF processing
                        const pdfProcessingTimeout = setTimeout(() => {
                            reject(new Error('PDF processing took too long. Try with a smaller PDF file.'));
                        }, 30000); // 30 second timeout
                        
                        try {
                            for (let i = 1; i <= maxPages; i++) {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                const pageText = textContent.items.map(item => item.str).join(' ');
                                fullText += `--- Page ${i} ---\n${pageText}\n\n`;
                            }
                            
                            clearTimeout(pdfProcessingTimeout);
                            resolve(fullText);
                        } catch (pageError) {
                            clearTimeout(pdfProcessingTimeout);
                            console.error('Error extracting page content:', pageError);
                            // If we've extracted some content, return what we have with an error note
                            if (fullText.length > 0) {
                                fullText += `\n[Error: Could not extract all content. ${pageError.message}]`;
                                resolve(fullText);
                            } else {
                                reject(new Error(`Failed to extract PDF content: ${pageError.message}`));
                            }
                        }
                    } catch (error) {
                        console.error('Error parsing PDF:', error);
                        reject(new Error(`Failed to parse PDF: ${error.message}`));
                    }
                };
                
                reader.onerror = (error) => {
                    reject(new Error('Failed to read PDF file'));
                };
                
                reader.readAsArrayBuffer(file);
            } catch (error) {
                console.error('Error in PDF extraction:', error);
                reject(new Error(`PDF extraction failed: ${error.message}`));
            }
        });
    }
    
    /**
     * Display file chip in the UI
     */
    displayFileChip(fileData) {
        if (!this.fileChipsContainer) return;
        
        const chip = document.createElement('div');
        chip.className = 'file-chip';
        chip.dataset.fileId = fileData.id;
        
        const icon = this.getFileIcon(fileData.type);
        const sizeText = this.formatFileSize(fileData.size);
        
        chip.innerHTML = `
            <i class="file-chip-icon ${icon}"></i>
            <span class="file-chip-name">${fileData.name}</span>
            <span class="file-chip-size">${sizeText}</span>
            <button class="file-chip-remove" onclick="playground.removeFile('${fileData.id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.fileChipsContainer.appendChild(chip);
        this.fileChipsContainer.style.display = 'flex';
        
        // Show the Send Files button when files are uploaded
        if (this.sendFilesBtn) {
            this.sendFilesBtn.style.display = 'inline-flex';
        }
    }
    
    /**
     * Get appropriate icon for file type
     */
    getFileIcon(fileType) {
        const iconMap = {
            '.txt': 'fas fa-file-alt',
            '.md': 'fas fa-file-alt',
            '.csv': 'fas fa-file-csv',
            '.json': 'fas fa-file-code',
            '.pdf': 'fas fa-file-pdf'
        };
        return iconMap[fileType] || 'fas fa-file';
    }
    
    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Remove file from uploaded files
     */
    removeFile(fileId) {
        // Remove from uploaded files array
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id != fileId);
        
        // Remove chip from UI
        const chip = this.fileChipsContainer.querySelector(`[data-file-id="${fileId}"]`);
        if (chip) {
            chip.remove();
        }
        
        // Hide container and Send Files button if no files
        if (this.uploadedFiles.length === 0) {
            this.fileChipsContainer.style.display = 'none';
            
            // Hide the Send Files button
            if (this.sendFilesBtn) {
                this.sendFilesBtn.style.display = 'none';
            }
        }
        
        this.showNotification('File removed successfully.', 'info');
    }
    
    /**
     * Get all uploaded file contents for sending with message
     */
    getUploadedFilesContent() {
        if (this.uploadedFiles.length === 0) return '';
        
        let content = '\n\n--- Uploaded Files ---\n';
        this.uploadedFiles.forEach((file, index) => {
            // Add a unique identifier for each file that can be used for citations
            file.id = `file-${index + 1}`;
            content += `\n**File: ${file.name}** [${file.id}]\n`;
            content += file.content + '\n';
        });
        
        return content;
    }
    
    /**
     * Clear all uploaded files after sending message
     */
    clearUploadedFiles() {
        this.uploadedFiles = [];
        
        // Clear all chips from UI
        if (this.fileChipsContainer) {
            this.fileChipsContainer.innerHTML = '';
            this.fileChipsContainer.style.display = 'none';
        }
        
        // Hide the Send Files button
        if (this.sendFilesBtn) {
            this.sendFilesBtn.style.display = 'none';
        }
    }
    
    toggleVoiceInput(isFixed = false) {
        this.fromVoice = true;
        this.currentVoiceInputFixed = isFixed;
        
        if (!this.recognition) {
            console.error('Speech recognition not available');
            this.showNotification('Speech recognition not supported in this browser', 'error');
            return;
        }
        
        if (this.isRecording) {
            // Stop recording
            try {
                // Clear any pending speech detection timeout
                if (this.speechDetectionTimeout) {
                    clearTimeout(this.speechDetectionTimeout);
                    this.speechDetectionTimeout = null;
                }
                
                this.recognition.stop();
                console.log('Stopping voice input');
                this.showNotification('Voice input stopped', 'info');
                
                // Reset voice announcement flag when stopping
                this.voiceInputAnnounced = false;
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        } else {
            // Start recording
            try {
                // First request microphone permission explicitly with enhanced audio settings
                navigator.mediaDevices.getUserMedia({ audio: { 
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,  // Mono channel for speech recognition
                    sampleRate: 44100 // Higher sample rate for better quality
                }})
                    .then(stream => {
                        console.log('Microphone permission granted');
                        
                        // Test microphone audio levels before starting recognition
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const analyser = audioContext.createAnalyser();
                        const microphone = audioContext.createMediaStreamSource(stream);
                        const dataArray = new Uint8Array(analyser.frequencyBinCount);
                        
                        microphone.connect(analyser);
                        analyser.fftSize = 256;
                        
                        // Test for 2 seconds to see if microphone is picking up audio
                        let testDuration = 0;
                        let audioDetected = false;
                        
                        const testInterval = setInterval(() => {
                            analyser.getByteFrequencyData(dataArray);
                            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                            
                            if (average > 10) { // Threshold for audio detection
                                audioDetected = true;
                                clearInterval(testInterval);
                                audioContext.close();
                                this.startSpeechRecognition(stream);
                                return;
                            }
                            
                            testDuration += 100;
                            if (testDuration >= 2000) { // Test for 2 seconds
                                clearInterval(testInterval);
                                audioContext.close();
                                if (!audioDetected) {
                                    this.showNotification('Microphone test: Low audio levels detected. Please speak louder or check microphone settings.', 'warning');
                                }
                                this.startSpeechRecognition(stream);
                            }
                        }, 100);
                        
                        // Stop the stream after testing
                        setTimeout(() => {
                            stream.getTracks().forEach(track => track.stop());
                        }, 2100);
                        
                        // Now start speech recognition using the dedicated method
                        this.startSpeechRecognition();
                    })
                    .catch(err => {
                        console.error('Microphone permission denied:', err);
                        this.showNotification('Microphone access denied. Please enable microphone permissions.', 'error');
                    });
            } catch (error) {
                console.error('Error requesting microphone permission:', error);
                this.showNotification('Error accessing microphone. Please try again.', 'error');
            }
        }
    }
    
    /**
     * Start speech recognition after microphone testing
     * @param {MediaStream} stream - The media stream from getUserMedia (optional)
     */
    startSpeechRecognition(stream = null) {
        try {
            // Cancel any ongoing speech synthesis before starting recognition
            if (this.speechSynthesis) {
                this.speechSynthesis.cancel();
            }
            
            // Reset the input field before starting new recognition
            const messageInput = this.currentVoiceInputFixed ? this.fixedMessageInput : this.messageInput;
            messageInput.value = '';
            
            this.recognition.start();
            console.log('Starting voice input with Web Speech API');
            this.showNotification('Listening with Web Speech API... Speak clearly into your microphone. End with "send" to submit', 'info');
            
            // Voice input is enabled - no voice announcement as per user request
            this.voiceInputAnnounced = true;
            
            // Set a longer timeout to check if speech is detected
            this.speechDetectionTimeout = setTimeout(() => {
                // If we're still recording but no speech has been detected
                const messageInput = this.currentVoiceInputFixed ? this.fixedMessageInput : this.messageInput;
                if (this.isRecording && messageInput.value === '') {
                    this.showNotification('No speech detected yet. Please speak louder or check your microphone.', 'warning');
                    // Try to restart recognition automatically
                    try {
                        this.recognition.stop();
                        setTimeout(() => {
                            if (!this.isRecording) {
                                this.toggleVoiceInput(this.currentVoiceInputFixed);
                            }
                        }, 1000);
                    } catch (error) {
                        console.error('Error restarting recognition:', error);
                    }
                }
            }, 8000); // Check after 8 seconds instead of 5
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.showNotification('Error starting voice input. Please try again.', 'error');
        }
    }
    
    /**
     * Initialize speech recognition with Gemini model
     * @param {MediaStream} stream - The media stream from getUserMedia
     */
    initializeGeminiSpeechRecognition(stream) {
        // Set up audio recording
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];
        
        this.mediaRecorder.addEventListener('dataavailable', event => {
            this.audioChunks.push(event.data);
        });
        
        this.mediaRecorder.addEventListener('stop', async () => {
            if (this.audioChunks.length === 0) {
                console.log('No audio data recorded');
                this.showNotification('No audio data recorded', 'error');
                this.isRecording = false;
                this.updateVoiceButtonState();
                return;
            }
            
            try {
                // Convert audio chunks to blob
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                
                // Convert blob to array buffer
                const arrayBuffer = await audioBlob.arrayBuffer();
                
                // Send to server for transcription
                // Convert ArrayBuffer to Base64 properly
                const uint8Array = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < uint8Array.byteLength; i++) {
                    binary += String.fromCharCode(uint8Array[i]);
                }
                const base64Data = btoa(binary);
                
                const response = await fetch('/api/speech/transcribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        audioData: base64Data,
                        model: 'gemini-2.5-flash-lite',
                        provider: 'google'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                // Process transcription result
                if (result.text) {
                    this.handleVoiceInput(result.text);
                } else {
                    this.showNotification('No speech detected', 'warning');
                }
            } catch (error) {
                console.error('Error transcribing speech with Gemini:', error);
                this.showNotification(`Error: ${error.message}`, 'error');
            } finally {
                // Clean up
                this.audioChunks = [];
                this.isRecording = false;
                this.updateVoiceButtonState();
                
                // Reset input placeholder
                const messageInput = this.currentVoiceInputFixed ? this.fixedMessageInput : this.messageInput;
                messageInput.placeholder = 'Type a message or use voice input...';
                
                // Release microphone
                stream.getTracks().forEach(track => track.stop());
            }
        });
        
        // Start recording
        this.mediaRecorder.start();
        
        // Automatically stop after 10 seconds if no stop is triggered
        this.recordingTimeout = setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                console.log('Automatically stopping Gemini speech recognition after timeout');
                this.mediaRecorder.stop();
            }
        }, 10000);
    }
    
    /**
     * Stop speech recognition using Gemini model
     */
    stopGeminiSpeechRecognition() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        
        if (this.recordingTimeout) {
            clearTimeout(this.recordingTimeout);
            this.recordingTimeout = null;
        }
    }
    
    handleVoiceInput(transcript) {
        if (!transcript) return;
        
        const trimmedTranscript = transcript.trim();
        if (trimmedTranscript === '') return;
        
        // Input field is already updated in onresult handler for real-time feedback
        const messageInput = this.currentVoiceInputFixed ? this.fixedMessageInput : this.messageInput;
        
        // Update the UI to show the recognized text
        this.showNotification(`Recognized: "${trimmedTranscript.substring(0, 30)}${trimmedTranscript.length > 30 ? '...' : ''}"`,'info');
        
        // Don't auto-send with continuous recognition
        // Only send if the transcript ends with specific phrases like "send", "submit", etc.
        if (trimmedTranscript.toLowerCase().match(/(send|submit|go|done|finish)\s*$/)) {
            // Remove the send command from the transcript
            messageInput.value = trimmedTranscript.replace(/(send|submit|go|done|finish)\s*$/, '').trim();
            
            // Auto-send the message
            this.sendMessage(this.currentVoiceInputFixed);
            
            // Stop recording after sending
            if (this.isRecording) {
                this.recognition.stop();
            }
        }
    }
    
    updateVoiceButtonState() {
        // Update voice input button states based on recording status
        if (this.voiceInputBtn) {
            this.voiceInputBtn.classList.toggle('recording', this.isRecording);
            this.voiceInputBtn.title = this.isRecording ? 'Stop recording' : 'Voice input';
        }
        
        if (this.fixedVoiceInputBtn) {
            this.fixedVoiceInputBtn.classList.toggle('recording', this.isRecording);
            this.fixedVoiceInputBtn.title = this.isRecording ? 'Stop recording' : 'Voice input';
        }
    }
    
    toggleVoiceOutput() {
        this.voiceOutputEnabled = !this.voiceOutputEnabled;
        
        // Save preference to localStorage
        localStorage.setItem('voiceOutputEnabled', this.voiceOutputEnabled);
        
        // Update button state
        this.updateVoiceOutputButton();
        
        // Use current speech provider setting
        this.showNotification(`Voice ${this.voiceOutputEnabled ? 'output enabled' : 'output disabled'} using ${this.useGeminiForSpeech ? 'Gemini' : 'Web Speech API'}`, 'info');
        if (this.voiceOutputEnabled) {
            this.speakText('Voice output is now enabled');
            this.showNotification('Voice output enabled', 'success');
        } else {
            // Stop any ongoing speech
            if (this.speechSynthesis) {
                this.speechSynthesis.cancel();
            }
            this.showNotification('Voice output disabled', 'info');
        }
    }
    
    updateVoiceOutputButton() {
        // Update voice output button states based on enabled status
        if (this.voiceOutputBtn) {
            this.voiceOutputBtn.classList.toggle('active', this.voiceOutputEnabled);
            this.voiceOutputBtn.title = this.voiceOutputEnabled ? 'Disable voice output' : 'Enable voice output';
            if (this.voiceOutputBtn.innerHTML) {
                this.voiceOutputBtn.innerHTML = `<i class="fas fa-volume-${this.voiceOutputEnabled ? 'up' : 'mute'}"></i>`;
            }
        }
        
        if (this.fixedVoiceOutputBtn) {
            this.fixedVoiceOutputBtn.classList.toggle('active', this.voiceOutputEnabled);
            this.fixedVoiceOutputBtn.title = this.voiceOutputEnabled ? 'Disable voice output' : 'Enable voice output';
            if (this.fixedVoiceOutputBtn.innerHTML) {
                this.fixedVoiceOutputBtn.innerHTML = `<i class="fas fa-volume-${this.voiceOutputEnabled ? 'up' : 'mute'}"></i>`;
            }
        }
        
        // Gemini toggle buttons have been removed
    }
    
    // Gemini toggle button functionality has been removed
    
    // Gemini speech functionality has been removed
    
    speakText(text) {
        if (!this.voiceOutputEnabled || !text) return;
        
        // Prepare text for speech
        const cleanText = this.prepareTextForSpeech(text);
        if (!cleanText) return;
        
        // Add visual feedback
        if (this.voiceOutputBtn) {
            this.voiceOutputBtn.classList.add('speaking');
        }
        if (this.fixedVoiceOutputBtn) {
            this.fixedVoiceOutputBtn.classList.add('speaking');
        }
        
        // Use Web Speech API
        if (!this.speechSynthesis) {
            this.speechSynthesis = window.speechSynthesis;
        }
        
        // Cancel any ongoing speech before starting a new one
        this.speechSynthesis.cancel();
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Select a voice (preferably a female voice)
        const voices = this.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Try to find a female English voice
            const femaleVoice = voices.find(voice => 
                voice.name.includes('female') && voice.lang.startsWith('en'));
            
            // If no specific female voice, try any English voice
            const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
            
            // Set the voice, with fallbacks
            utterance.voice = femaleVoice || englishVoice || voices[0];
        }
        
        // Set other properties
        utterance.rate = 1.0; // Normal speed
        utterance.pitch = 1.0; // Normal pitch
        utterance.volume = 1.0; // Full volume
        
        // Handle speech end
        utterance.onend = () => {
            if (this.voiceOutputBtn) {
                this.voiceOutputBtn.classList.remove('speaking');
            }
            if (this.fixedVoiceOutputBtn) {
                this.fixedVoiceOutputBtn.classList.remove('speaking');
            }
        };
        
        // Speak the text only once
        this.speechSynthesis.speak(utterance);
    }
    
    /**
     * Prepare text for speech synthesis by removing code blocks, URLs, and formatting
     * @param {string} text - The text to prepare
     * @returns {string} - The processed text ready for speech synthesis
     */
    /**
     * Prepare text for speech synthesis by removing code blocks, URLs, and formatting
     * @param {string} text - The text to prepare
     * @returns {string} - The processed text ready for speech synthesis
     */
    prepareTextForSpeech(text) {
        if (!text) return '';
        
        // Remove code blocks, URLs, and excessive punctuation
        let cleanText = text
            .replace(/```[\s\S]*?```/g, 'code block omitted') // Remove code blocks
            .replace(/`[^`]+`/g, '') // Remove inline code
            .replace(/https?:\/\/\S+/g, 'URL') // Replace URLs
            .replace(/\*\*|__/g, '') // Remove bold markers
            .replace(/\*|_/g, '') // Remove italic markers
            .replace(/#+\s/g, '') // Remove heading markers
            .replace(/\n\s*\n/g, '. ') // Replace double line breaks with period and space
            .replace(/\n/g, ' ') // Replace single line breaks with space
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
        
        // Limit length to prevent very long speeches
        const maxLength = 500;
        if (cleanText.length > maxLength) {
            cleanText = cleanText.substring(0, maxLength) + '... The rest of the message is omitted for brevity.';
        }
        
        return cleanText;
    }
    
    /**
      * Show a temporary notification message
      * @param {string} message - The message to display
      * @param {string} type - The type of notification (info, error, etc.)
      */
     showNotification(message, type = 'info') {
         const notification = document.createElement('div');
         notification.className = `notification ${type}`;
         notification.textContent = message;
         
         document.body.appendChild(notification);
         
         // Fade in
         setTimeout(() => {
             notification.classList.add('show');
         }, 10);
         
         // Fade out and remove
         setTimeout(() => {
             notification.classList.remove('show');
             setTimeout(() => {
                 notification.remove();
             }, 300);
         }, 3000);
     }
     
     /**
      * Send a message to the AI
      * @param {boolean} isFixed - Whether to use the fixed message input
      * @param {boolean} filesOnly - Whether to send only files without a message
      */
    async sendMessage(isFixed = false, filesOnly = false) {
        const messageInput = isFixed ? this.fixedMessageInput : this.messageInput;
        const messageText = filesOnly ? '' : messageInput.value.trim();
        
        // Get uploaded file content
        const fileContent = this.getUploadedFilesContent();
        
        // Only return if both message text and file content are empty
        if (!messageText && !fileContent) return;
        
        // Store the uploaded files for citation reference before clearing
        const currentUploadedFiles = [...this.uploadedFiles];
        
        const fullMessage = messageText + fileContent;
        
        // Add user message (display typed text or a file upload message)
        if (messageText) {
            this.addMessage('user', messageText);
        } else if (fileContent) {
            this.addMessage('user', '[File content uploaded]');
        }
        
        // Clear input
        messageInput.value = '';
        this.updateSendButton(isFixed);
        
        // Transfer uploaded files to backend client if available
        if (window.backendClient && currentUploadedFiles.length > 0) {
            // First clear any existing files in the backend client
            window.backendClient.clearUploadedFiles();
            
            // Add each file to the backend client
            currentUploadedFiles.forEach(file => {
                window.backendClient.addUploadedFile(file);
            });
        }
        
        // Clear uploaded files from UI after sending
        this.clearUploadedFiles();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Use the backend API client if available, otherwise fallback to local generation
            if (window.backendClient) {
                console.log('Using backend client for chat completion');
                
                // Add instructions for the model to use citations
                let promptWithInstructions = messageText; // Only send the message text, not the file content
                if (currentUploadedFiles.length > 0) {
                    promptWithInstructions = `When answering the following question, you MUST use the content from the uploaded files to provide your answer. Base your response primarily on the information in these files. Please cite your sources using the file identifiers in square brackets (e.g., [file-1]). If you're using information from multiple files, include all relevant citations.\n\n${messageText}`;
                }
                
                const response = await window.backendClient.chatCompletion({
                    prompt: promptWithInstructions,
                    model: this.currentConfig.model,
                    provider: document.getElementById('providerSelect').value,
                    parameters: {
                        temperature: this.currentConfig.temperature,
                        max_tokens: this.currentConfig.maxTokens,
                        top_p: this.currentConfig.topP,
                        presence_penalty: this.currentConfig.presencePenalty,
                        frequency_penalty: this.currentConfig.frequencyPenalty,
                        seed: this.currentConfig.seed,
                        stop: this.currentConfig.stopSequence ? [this.currentConfig.stopSequence] : undefined
                    }
                });
                
                console.log('Received response from backend:', response);
                this.hideTypingIndicator();
                
                // Temporarily restore the uploaded files for citation formatting
                this.uploadedFiles = currentUploadedFiles;
                this.addMessage('assistant', response.content);
                // Clear the uploaded files again after adding the message
                this.uploadedFiles = [];
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
        
        // Speak assistant messages if voice output is enabled
        if (role === 'assistant' && this.voiceOutputEnabled) {
            // Stop any ongoing speech when a new message is added
            if (this.speechSynthesis) {
                this.speechSynthesis.cancel();
            }
            
            // Speak the assistant's message
            this.speakText(content);
        }
    }
    
    createMessageElement(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        // Generate a unique ID for this message
        const messageId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        messageDiv.setAttribute('data-message-id', messageId);
        
        // Create avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        const avatarIcon = document.createElement('i');
        if (role === 'user') {
            avatarIcon.className = 'fas fa-user';
        } else {
            avatarIcon.className = 'fas fa-robot';
        }
        avatarDiv.appendChild(avatarIcon);
        
        // Create content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (role === 'assistant') {
            // Process content for citations if it's from the assistant
            contentDiv.innerHTML = this.formatMessageWithCitations(content);
        } else {
            contentDiv.textContent = content;
        }
        
        // Append in correct order based on role
        if (role === 'user') {
            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(avatarDiv);
        } else {
            messageDiv.appendChild(avatarDiv);
            messageDiv.appendChild(contentDiv);
            
            // Add feedback buttons for AI responses
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'message-feedback';
            
            const thumbsUpBtn = document.createElement('button');
            thumbsUpBtn.className = 'feedback-btn thumbs-up';
            thumbsUpBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
            thumbsUpBtn.title = 'Helpful response';
            thumbsUpBtn.addEventListener('click', () => this.saveFeedback(messageId, 'positive'));
            
            const thumbsDownBtn = document.createElement('button');
            thumbsDownBtn.className = 'feedback-btn thumbs-down';
            thumbsDownBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
            thumbsDownBtn.title = 'Not helpful response';
            thumbsDownBtn.addEventListener('click', () => this.saveFeedback(messageId, 'negative'));
            
            feedbackDiv.appendChild(thumbsUpBtn);
            feedbackDiv.appendChild(thumbsDownBtn);
            messageDiv.appendChild(feedbackDiv);
        }
        
        return messageDiv;
    }
    
    /**
     * Format message content with citations
     * @param {string} content - The message content
     * @returns {string} - Formatted HTML with citations
     */
    formatMessageWithCitations(content) {
        // Check if we have any uploaded files to reference
        if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
            return this.escapeHTML(content);
        }
        
        // Create a map of file IDs to file names for quick lookup
        const fileMap = {};
        this.uploadedFiles.forEach(file => {
            if (file.id) {
                fileMap[file.id] = file.name;
            }
        });
        
        // Replace citation patterns like [file-1] with linked citations
        let formattedContent = this.escapeHTML(content);
        
        // Replace citation patterns
        const citationRegex = /\[(file-\d+)\]/g;
        formattedContent = formattedContent.replace(citationRegex, (match, fileId) => {
            const fileName = fileMap[fileId] || 'Unknown file';
            return `<span class="citation" title="${fileName}">[${fileName}]</span>`;
        });
        
        // Convert line breaks to <br> tags
        formattedContent = formattedContent.replace(/\n/g, '<br>');
        
        return formattedContent;
    }
    
    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} text - The text to escape
     * @returns {string} - Escaped HTML
     */
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
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
    
    async startNewChat() {
        // Save current chat if it has messages
        if (this.messages.length > 0) {
            await this.saveCurrentChat();
        }
        
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
    
    async saveCurrentChat() {
        const chatData = {
            messages: this.messages,
            config: this.currentConfig,
            savedAt: new Date().toISOString(),
            chatId: `chat-${Date.now()}`,
            messageCount: this.messages.length,
            title: this.generateChatTitle()
        };
        
        try {
            // Save to chat_history folder via backend
            const response = await fetch('/api/save-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chatData)
            });
            
            if (response.ok) {
                console.log('Chat saved to file:', chatData.chatId);
                // Update sidebar with new chat
                this.addChatToSidebar(chatData);
            } else {
                console.error('Failed to save chat to file');
            }
        } catch (error) {
            console.error('Error saving chat:', error);
        }
        
        // Save to localStorage for persistence
        const savedChats = JSON.parse(localStorage.getItem('llm-playground-saved-chats') || '[]');
        savedChats.push(chatData);
        localStorage.setItem('llm-playground-saved-chats', JSON.stringify(savedChats));
        
        console.log('Chat saved:', chatData.chatId);
    }
    
    generateChatTitle() {
        if (this.messages.length === 0) return 'Empty Chat';
        
        const firstUserMessage = this.messages.find(msg => msg.role === 'user');
        if (firstUserMessage) {
            // Take first 30 characters of the first user message
            let title = firstUserMessage.content.substring(0, 30);
            if (firstUserMessage.content.length > 30) {
                title += '...';
            }
            return title;
        }
        
        return `Chat ${new Date().toLocaleDateString()}`;
    }
    
    addChatToSidebar(chatData) {
        const chatHistoryContainer = document.getElementById('chatHistory');
        if (!chatHistoryContainer) return;
        
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-history-item';
        chatItem.dataset.chatId = chatData.chatId;
        
        chatItem.innerHTML = `
            <div class="chat-item-content">
                <div class="chat-title">${chatData.title}</div>
                <div class="chat-meta">
                    <span class="chat-date">${new Date(chatData.savedAt).toLocaleDateString()}</span>
                    <span class="chat-count">${chatData.messageCount} messages</span>
                </div>
            </div>
            <button class="chat-delete-btn" onclick="llmPlayground.deleteChatHistory('${chatData.chatId}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        chatItem.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-delete-btn')) {
                this.loadChatHistory(chatData.chatId);
            }
        });
        
        chatHistoryContainer.insertBefore(chatItem, chatHistoryContainer.firstChild);
    }
    
    async loadChatHistory(chatId) {
        try {
            const response = await fetch(`/api/load-chat/${chatId}`);
            if (response.ok) {
                const chatData = await response.json();
                
                // Clear current chat
                this.messages = [];
                this.chatMessages.innerHTML = '';
                
                // Load messages
                this.messages = chatData.messages;
                chatData.messages.forEach(message => {
                    const messageElement = this.createMessageElement(message.role, message.content);
                    this.chatMessages.appendChild(messageElement);
                });
                
                // Load configuration
                if (chatData.config) {
                    // Ensure provider field exists (for backward compatibility)
                    if (!chatData.config.provider) {
                        chatData.config.provider = 'openai'; // Default fallback
                    }
                    
                    this.currentConfig = {
                        ...chatData.config,
                        provider: chatData.config.provider || 'openai', // Fallback for older chats
                        presencePenalty: chatData.config.presencePenalty || 0.0,
                        frequencyPenalty: chatData.config.frequencyPenalty || 0.0,
                        seed: chatData.config.seed || null,
                        stopSequence: chatData.config.stopSequence || ''
                    };
                    this.updateConfigDisplay();
                    
                    // Update provider and model selections
                    const providerSelect = document.getElementById('providerSelect');
                    const modelSelect = document.getElementById('modelSelect');
                    const temperatureSlider = document.getElementById('temperatureSlider');
                    const temperatureValue = document.getElementById('temperatureValue');
                    
                    if (providerSelect) providerSelect.value = chatData.config.provider;
                    if (modelSelect) {
                        this.updateModelOptions(chatData.config.provider, modelSelect);
                        modelSelect.value = chatData.config.model;
                    }
                    if (temperatureSlider) {
                        temperatureSlider.value = chatData.config.temperature;
                        temperatureValue.textContent = chatData.config.temperature;
                    }
                }
                
                // Update UI state
                this.chatContainer.classList.add('has-messages');
                this.updateChatHeader();
                this.scrollToBottom();
                
                console.log('Chat loaded:', chatId);
            } else {
                console.error('Failed to load chat');
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    }
    
    async deleteChatHistory(chatId) {
        if (!confirm('Are you sure you want to delete this chat?')) return;
        
        try {
            const response = await fetch(`/api/delete-chat/${chatId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove from sidebar
                const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
                if (chatItem) {
                    chatItem.remove();
                }
                
                // Remove from localStorage
                const savedChats = JSON.parse(localStorage.getItem('llm-playground-saved-chats') || '[]');
                const updatedChats = savedChats.filter(chat => chat.chatId !== chatId);
                localStorage.setItem('llm-playground-saved-chats', JSON.stringify(updatedChats));
                
                console.log('Chat deleted:', chatId);
            } else {
                console.error('Failed to delete chat');
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    }
    
    async loadChatHistoryList() {
        try {
            const response = await fetch('/api/chat-history');
            if (response.ok) {
                const chatHistory = await response.json();
                const chatHistoryContainer = document.getElementById('chatHistory');
                
                if (chatHistoryContainer) {
                    chatHistoryContainer.innerHTML = '';
                    chatHistory.forEach(chatData => {
                        this.addChatToSidebar(chatData);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            // Fallback to localStorage
            const savedChats = JSON.parse(localStorage.getItem('llm-playground-saved-chats') || '[]');
            const chatHistoryContainer = document.getElementById('chatHistory');
            
            if (chatHistoryContainer) {
                chatHistoryContainer.innerHTML = '';
                savedChats.reverse().forEach(chatData => {
                    this.addChatToSidebar(chatData);
                });
            }
        }
    }
    
    async clearAllHistory() {
        if (!confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) return;
        
        try {
            const response = await fetch('/api/clear-chat-history', {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Clear sidebar
                const chatHistoryContainer = document.getElementById('chatHistory');
                if (chatHistoryContainer) {
                    chatHistoryContainer.innerHTML = '';
                }
                
                // Clear localStorage
                localStorage.removeItem('llm-playground-saved-chats');
                
                console.log('All chat history cleared');
            } else {
                console.error('Failed to clear chat history');
            }
        } catch (error) {
            console.error('Error clearing chat history:', error);
        }
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
    
    initializeCodeModal() {
        // Initialize code modal if elements exist
        if (!this.codeModal) return;
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.codeModal) {
                this.closeCodeModal();
            }
        });
        
        // Initialize with JavaScript code view by default
        this.switchCodeType('javascript');
    }
    
    openCodeModal() {
        if (this.codeModal) {
            this.codeModal.style.display = 'flex';
            this.generateCode();
        }
    }
    
    generateCode() {
        // Get the latest message if available
        const latestMessage = this.messages.length > 0 ? this.messages[this.messages.length - 1].content : '';
        
        // Generate code based on current model parameters and latest message
        const codeType = document.querySelector('.code-type-btn.active')?.dataset.codeType || 'curl';
        
        if (codeType === 'curl') {
            this.generateCurlCommand(latestMessage);
        } else if (codeType === 'python') {
            this.generatePythonCode(latestMessage);
        }
    }
    
    closeCodeModal() {
        if (this.codeModal) {
            this.codeModal.style.display = 'none';
        }
    }
    
    switchCodeType(codeType) {
         if (!this.codeDisplay) return;
         
         // Update active button
         if (this.codeTypeButtons) {
             this.codeTypeButtons.forEach(btn => {
                 btn.classList.toggle('active', btn.dataset.codeType === codeType);
             });
         }
         
         // Generate code based on selected type
         let code = '';
         switch(codeType) {
             case 'curl':
                 code = this.generateCurlCommand();
                 break;
             case 'python':
                 code = this.generatePythonCode();
                 break;
             default:
                 code = this.generateCurlCommand();
         }
         
         this.codeDisplay.textContent = code;
     }
     

     getLatestUserMessage() {
         // Get the latest user message from the conversation
         if (this.messages.length === 0) {
             return "Your message here";
         }
         
         // Find the last user message
         for (let i = this.messages.length - 1; i >= 0; i--) {
             if (this.messages[i].role === 'user') {
                 return this.messages[i].content;
             }
         }
         
         return "Your message here";
     }
     
     generateCurlCommand(customMessage = null) {
        // Create a curl command based on current configuration
        const parameters = {
            temperature: this.currentConfig.temperature,
            max_tokens: this.currentConfig.maxTokens,
            top_p: this.currentConfig.topP,
        };
        
        // Add optional parameters if they have values
        if (this.currentConfig.presencePenalty !== 0) {
            parameters.presence_penalty = this.currentConfig.presencePenalty;
        }
        if (this.currentConfig.frequencyPenalty !== 0) {
            parameters.frequency_penalty = this.currentConfig.frequencyPenalty;
        }
        if (this.currentConfig.seed !== null) {
            parameters.seed = this.currentConfig.seed;
        }
        if (this.currentConfig.stopSequence) {
            parameters.stop = [this.currentConfig.stopSequence];
        }
        
        // Use custom message if provided, otherwise get the latest user message
        const latestMessage = customMessage || this.getLatestUserMessage();
         
         // Format the parameters as JSON string with proper indentation
         const parametersJson = JSON.stringify({
             model: this.currentConfig.model,
             messages: [
                 { role: "system", content: "You are a helpful assistant." },
                 { role: "user", content: latestMessage }
             ],
             ...parameters
         }, null, 2);
         
         // Generate the curl command based on provider
         let baseUrl = '';
         let headers = '';
         
         switch(this.currentConfig.provider) {
             case 'openai':
                 baseUrl = 'https://api.openai.com/v1/chat/completions';
                 headers = '-H "Authorization: Bearer YOUR_OPENAI_API_KEY"';
                 break;
             case 'groq':
                 baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
                 headers = '-H "Authorization: Bearer YOUR_GROQ_API_KEY"';
                 break;
             case 'google':
                 baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + this.currentConfig.model + ':generateContent';
                 headers = '-H "x-goog-api-key: YOUR_GOOGLE_API_KEY"';
                 break;
             case 'anthropic':
                 baseUrl = 'https://api.anthropic.com/v1/messages';
                 headers = '-H "x-api-key: YOUR_ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01"';
                 break;
             default:
                 baseUrl = 'https://api.openai.com/v1/chat/completions';
                 headers = '-H "Authorization: Bearer YOUR_API_KEY"';
         }
         
         return `curl -X POST ${baseUrl} \
 ${headers} \
 -H "Content-Type: application/json" \
 -d '${parametersJson.replace(/'/g, "\'")}'`;
     }
     
     generatePythonCode(customMessage = null) {
        // Create Python code based on current configuration and provider
        let code = '';
        
        switch(this.currentConfig.provider) {
            case 'openai':
                code = this.generateOpenAIPythonCode(customMessage);
                break;
            case 'groq':
                code = this.generateGroqPythonCode(customMessage);
                break;
            case 'google':
                code = this.generateGooglePythonCode(customMessage);
                break;
            case 'anthropic':
                code = this.generateAnthropicPythonCode(customMessage);
                break;
            default:
                code = this.generateOpenAIPythonCode(customMessage);
        }
         
         return code;
     }
     
     generateOpenAIPythonCode(customMessage = null) {
        // Use custom message if provided, otherwise get the latest user message
        const latestMessage = customMessage || this.getLatestUserMessage();
         
         return `# OpenAI Python SDK Example
import openai

# Set your API key
openai.api_key = "YOUR_OPENAI_API_KEY"

# Create a chat completion
response = openai.chat.completions.create(
    model="${this.currentConfig.model}",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": ${JSON.stringify(latestMessage)}}
    ],
    temperature=${this.currentConfig.temperature},
    max_tokens=${this.currentConfig.maxTokens},
    top_p=${this.currentConfig.topP}${this.currentConfig.presencePenalty !== 0 ? `,
    presence_penalty=${this.currentConfig.presencePenalty}` : ''}${this.currentConfig.frequencyPenalty !== 0 ? `,
    frequency_penalty=${this.currentConfig.frequencyPenalty}` : ''}${this.currentConfig.seed !== null ? `,
    seed=${this.currentConfig.seed}` : ''}${this.currentConfig.stopSequence ? `,
    stop=["${this.currentConfig.stopSequence}"]` : ''}
)

# Print the response
print(response.choices[0].message.content)`;
     }
     
     generateGroqPythonCode(customMessage = null) {
        // Use custom message if provided, otherwise get the latest user message
        const latestMessage = customMessage || this.getLatestUserMessage();
         
         return `# Groq Python SDK Example
import groq

# Set your API key
client = groq.Client(api_key="YOUR_GROQ_API_KEY")

# Create a chat completion
response = client.chat.completions.create(
    model="${this.currentConfig.model}",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": ${JSON.stringify(latestMessage)}}
    ],
    temperature=${this.currentConfig.temperature},
    max_tokens=${this.currentConfig.maxTokens},
    top_p=${this.currentConfig.topP}${this.currentConfig.presencePenalty !== 0 ? `,
    presence_penalty=${this.currentConfig.presencePenalty}` : ''}${this.currentConfig.frequencyPenalty !== 0 ? `,
    frequency_penalty=${this.currentConfig.frequencyPenalty}` : ''}${this.currentConfig.seed !== null ? `,
    seed=${this.currentConfig.seed}` : ''}${this.currentConfig.stopSequence ? `,
    stop=["${this.currentConfig.stopSequence}"]` : ''}
)

# Print the response
print(response.choices[0].message.content)`;
     }
     
     generateGooglePythonCode(customMessage = null) {
        // Use custom message if provided, otherwise get the latest user message
        const latestMessage = customMessage || this.getLatestUserMessage();
         
         return `# Google Generative AI Python SDK Example
import google.generativeai as genai

# Set your API key
genai.configure(api_key="YOUR_GOOGLE_API_KEY")

# Initialize the model
model = genai.GenerativeModel("${this.currentConfig.model}")

# Create generation config
generation_config = genai.GenerationConfig(
    temperature=${this.currentConfig.temperature},
    max_output_tokens=${this.currentConfig.maxTokens},
    top_p=${this.currentConfig.topP}${this.currentConfig.presencePenalty !== 0 ? `,
    presence_penalty=${this.currentConfig.presencePenalty}` : ''}${this.currentConfig.frequencyPenalty !== 0 ? `,
    frequency_penalty=${this.currentConfig.frequencyPenalty}` : ''}${this.currentConfig.seed !== null ? `,
    seed=${this.currentConfig.seed}` : ''}${this.currentConfig.stopSequence ? `,
    stop_sequences=["${this.currentConfig.stopSequence}"]` : ''}
)

# Generate content
response = model.generate_content(
    ${JSON.stringify(latestMessage)},
    generation_config=generation_config
)

# Print the response
print(response.text)`;
     }
     
     generateAnthropicPythonCode(customMessage = null) {
        // Use custom message if provided, otherwise get the latest user message
        const latestMessage = customMessage || this.getLatestUserMessage();
         
         return `# Anthropic Python SDK Example
import anthropic

# Set your API key
client = anthropic.Anthropic(api_key="YOUR_ANTHROPIC_API_KEY")

# Create a message
response = client.messages.create(
    model="${this.currentConfig.model}",
    messages=[
        {"role": "user", "content": ${JSON.stringify(latestMessage)}}
    ],
    temperature=${this.currentConfig.temperature},
    max_tokens=${this.currentConfig.maxTokens},
    top_p=${this.currentConfig.topP}${this.currentConfig.presencePenalty !== 0 ? `,
    presence_penalty=${this.currentConfig.presencePenalty}` : ''}${this.currentConfig.frequencyPenalty !== 0 ? `,
    frequency_penalty=${this.currentConfig.frequencyPenalty}` : ''}${this.currentConfig.seed !== null ? `,
    seed=${this.currentConfig.seed}` : ''}${this.currentConfig.stopSequence ? `,
    stop_sequences=["${this.currentConfig.stopSequence}"]` : ''}
)

# Print the response
print(response.content[0].text)`;
     }
    
    copyCodeToClipboard() {
        if (!this.codeDisplay) return;
        
        const code = this.codeDisplay.textContent;
        navigator.clipboard.writeText(code)
            .then(() => {
                // Show copied notification
                const originalText = this.copyCodeBtn.textContent;
                this.copyCodeBtn.textContent = 'Copied!';
                setTimeout(() => {
                    this.copyCodeBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy code:', err);
            });
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

// Global function to handle file input click
window.openFileInput = function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        console.log('openFileInput called');
        fileInput.click();
    }
    return false;
};

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