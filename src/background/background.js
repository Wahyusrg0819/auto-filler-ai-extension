// Auto Filler AI - Background Service Worker
class AutoFillerBackground {
    constructor() {
        this.init();
    }

    init() {
        // Listen for extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Listen for tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });

        // Listen for messages from content scripts and popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Handle extension icon clicks
        chrome.action.onClicked.addListener((tab) => {
            this.handleIconClick(tab);
        });

        console.log('🤖 Auto Filler AI Background Service Worker initialized');
    }

    async handleInstallation(details) {
        if (details.reason === 'install') {
            console.log('🎉 Auto Filler AI Extension installed');

            // Set default settings
            await this.setDefaultSettings();

            // Open welcome page or show notification
            this.showWelcomeNotification();
        } else if (details.reason === 'update') {
            console.log('🔄 Auto Filler AI Extension updated');
            this.showUpdateNotification();
        }
    }

    async setDefaultSettings() {
        try {
            const defaultSettings = {
                autoAnalyze: false,
                showNotifications: true,
                maxFieldsToFill: 50,
                debugMode: false
            };

            await chrome.storage.local.set({ 
                autoFillerSettings: defaultSettings 
            });

            console.log('✅ Default settings saved');
        } catch (error) {
            console.error('❌ Error setting default settings:', error);
        }
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        // Only act on complete page loads
        if (changeInfo.status !== 'complete' || !tab.url) return;

        // Skip chrome:// and extension pages
        if (tab.url.startsWith('chrome://') || 
            tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('moz-extension://')) {
            return;
        }

        // Update extension badge with form count
        this.updateFormBadge(tabId);
    }

    async updateFormBadge(tabId) {
        try {
            // Inject script to count forms
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: () => {
                    const formElements = document.querySelectorAll('form');
                    const inputElements = document.querySelectorAll('input, textarea, select');
                    return {
                        forms: formElements.length,
                        inputs: inputElements.length
                    };
                }
            });

            if (results && results[0] && results[0].result) {
                const { forms, inputs } = results[0].result;

                if (inputs > 0) {
                    // Show input count as badge
                    chrome.action.setBadgeText({
                        tabId: tabId,
                        text: inputs > 99 ? '99+' : inputs.toString()
                    });

                    chrome.action.setBadgeBackgroundColor({
                        tabId: tabId,
                        color: '#4f46e5'
                    });
                } else {
                    // Clear badge if no forms
                    chrome.action.setBadgeText({
                        tabId: tabId,
                        text: ''
                    });
                }
            }
        } catch (error) {
            // Silently fail for pages where script injection is not allowed
            chrome.action.setBadgeText({
                tabId: tabId,
                text: ''
            });
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse({ success: true, settings: settings });
                    break;

                case 'saveSettings':
                    await this.saveSettings(request.settings);
                    sendResponse({ success: true });
                    break;

                case 'validateApiKey':
                    const isValid = await this.validateGeminiApiKey(request.apiKey);
                    sendResponse({ success: true, valid: isValid });
                    break;

                case 'generateFormData':
                    const data = await this.generateFormDataWithGemini(request.fields, request.apiKey);
                    sendResponse({ success: true, data: data });
                    break;

                case 'logActivity':
                    this.logActivity(request.activity, request.tabId);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    handleIconClick(tab) {
        // This is handled by the popup, but we can add additional logic here
        console.log('🖱️ Extension icon clicked on tab:', tab.url);
    }

    async getSettings() {
        try {
            const result = await chrome.storage.local.get(['autoFillerSettings']);
            return result.autoFillerSettings || {};
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }

    async saveSettings(settings) {
        try {
            await chrome.storage.local.set({ autoFillerSettings: settings });
            console.log('✅ Settings saved:', settings);
        } catch (error) {
            console.error('❌ Error saving settings:', error);
            throw error;
        }
    }

    async validateGeminiApiKey(apiKey) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            return response.ok;
        } catch (error) {
            console.error('API key validation error:', error);
            return false;
        }
    }

    async generateFormDataWithGemini(fields, apiKey) {
        try {
            const prompt = this.createGeminiPrompt(fields);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_NONE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH", 
                            threshold: "BLOCK_NONE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_NONE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_NONE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const text = data.candidates[0].content.parts[0].text;
                return this.parseGeminiResponse(text);
            }

            return null;
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    createGeminiPrompt(fields) {
        let prompt = `As an AI assistant for web developers testing forms, generate realistic test data in JSON format for the following form fields:\n\n`;

        fields.forEach((field, index) => {
            prompt += `${index + 1}. `;
            if (field.label) prompt += `Label: "${field.label}" `;
            if (field.name) prompt += `Name: "${field.name}" `;
            if (field.id) prompt += `ID: "${field.id}" `;
            if (field.placeholder) prompt += `Placeholder: "${field.placeholder}" `;
            prompt += `Type: ${field.type} FieldType: ${field.fieldType || 'text'}`;
            if (field.required) prompt += ` (Required)`;
            if (field.maxLength) prompt += ` MaxLength: ${field.maxLength}`;
            prompt += `\n`;
        });

        prompt += `\nGenerate appropriate test data for each field in JSON format:
{
  "field_identifier": "appropriate_value"
}

Use name, id, placeholder, or label as identifiers. Generate realistic Indonesian test data:
- Email: valid email format (e.g., test.user@example.com)
- Phone: Indonesian phone format (e.g., 08123456789 or +6281234567890)
- Name: common Indonesian names (e.g., Ahmad Wahyu, Siti Nurhaliza)
- Address: Indonesian address format (e.g., Jl. Sudirman No. 123, Jakarta Pusat)
- Date: appropriate date format based on field type
- Password: strong password if needed (min 8 chars with mix of letters, numbers, symbols)
- Number: reasonable numeric values
- URL: valid URL format
- Company: Indonesian company names
- Text: contextually appropriate text

Important: Return ONLY the JSON object, no additional text or formatting.`;

        return prompt;
    }

    parseGeminiResponse(text) {
        try {
            // Clean the response to extract JSON
            const cleanText = text.trim();

            // Try to find JSON object in the response
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                return JSON.parse(jsonStr);
            }

            // If no JSON found, try parsing the entire response
            return JSON.parse(cleanText);
        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            console.log('Response text:', text);
            return null;
        }
    }

    logActivity(activity, tabId) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Tab ${tabId}: ${activity}`);

        // Could store activity logs in storage for debugging
        // For now, just console log
    }

    showWelcomeNotification() {
        if (chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon48.png',
                title: 'Auto Filler AI Installed!',
                message: 'Ekstensi siap digunakan. Klik icon untuk mulai mengisi form dengan AI.'
            });
        }
    }

    showUpdateNotification() {
        if (chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon48.png',
                title: 'Auto Filler AI Updated!',
                message: 'Ekstensi telah diperbarui dengan fitur terbaru.'
            });
        }
    }

    // Handle context menu (if needed in future versions)
    setupContextMenu() {
        chrome.contextMenus.create({
            id: 'fillCurrentForm',
            title: 'Fill Form with AI',
            contexts: ['page']
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'fillCurrentForm') {
                // Trigger form filling
                chrome.tabs.sendMessage(tab.id, { action: 'fillForm' });
            }
        });
    }
}

// Initialize background service worker
new AutoFillerBackground();