// Auto Filler AI - Content Script
class AutoFillerContent {
    constructor() {
        this.formFields = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;

        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep the message channel open for async response
        });

        // Add visual indicators when extension is active
        this.addExtensionIndicators();

        this.isInitialized = true;
        console.log('🤖 Auto Filler AI Content Script loaded');
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'analyzeForm':
                    const fields = this.detectFormFields();
                    sendResponse({ success: true, fields: fields });
                    break;

                case 'fillForm':
                    const fillResult = this.fillFormWithData(request.data);
                    sendResponse({ success: true, filledCount: fillResult });
                    break;

                case 'clearForm':
                    this.clearAllForms();
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Content script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    detectFormFields() {
        const formFields = [];
        const processedElements = new Set();

        // Enhanced selectors for better form field detection
        const selectors = [
            'input[type="text"]',
            'input[type="email"]', 
            'input[type="tel"]',
            'input[type="url"]',
            'input[type="number"]',
            'input[type="password"]',
            'input[type="search"]',
            'input[type="date"]',
            'input[type="datetime-local"]',
            'input[type="time"]',
            'input[type="month"]',
            'input[type="week"]',
            'input[type="color"]',
            'input:not([type])', // inputs without type attribute default to text
            'textarea',
            'select'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Skip if already processed, disabled, readonly, or hidden
                if (processedElements.has(element) || 
                    element.disabled || 
                    element.readOnly || 
                    this.isElementHidden(element)) {
                    return;
                }

                const fieldInfo = this.extractFieldInfo(element);
                if (fieldInfo) {
                    formFields.push(fieldInfo);
                    processedElements.add(element);

                    // Add visual highlight
                    this.highlightField(element);
                }
            });
        });

        console.log(`🔍 Detected ${formFields.length} form fields:`, formFields);
        return formFields;
    }

    extractFieldInfo(element) {
        const fieldInfo = {
            selector: this.getUniqueSelector(element),
            id: element.id || '',
            name: element.name || '',
            type: element.type || element.tagName.toLowerCase(),
            placeholder: element.placeholder || '',
            label: this.getFieldLabel(element),
            tagName: element.tagName.toLowerCase(),
            required: element.required || false,
            maxLength: element.maxLength > 0 ? element.maxLength : null,
            pattern: element.pattern || '',
            autocomplete: element.autocomplete || '',
            className: element.className || '',
            value: element.value || ''
        };

        // Add additional context
        fieldInfo.context = this.getFieldContext(element);
        fieldInfo.fieldType = this.inferFieldType(fieldInfo);

        return fieldInfo;
    }

    getFieldLabel(element) {
        // Method 1: Associated label elements
        if (element.labels && element.labels.length > 0) {
            return element.labels[0].textContent.trim();
        }

        // Method 2: Label with for attribute
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) {
                return label.textContent.trim();
            }
        }

        // Method 3: Parent label
        const parentLabel = element.closest('label');
        if (parentLabel) {
            const labelText = parentLabel.textContent.replace(element.value || '', '').trim();
            return labelText;
        }

        // Method 4: Previous sibling label
        let prev = element.previousElementSibling;
        while (prev) {
            if (prev.tagName && prev.tagName.toLowerCase() === 'label') {
                return prev.textContent.trim();
            }
            if (prev.tagName && ['SPAN', 'DIV', 'P'].includes(prev.tagName.toUpperCase())) {
                const text = prev.textContent.trim();
                if (text.length > 0 && text.length < 100) {
                    return text;
                }
            }
            prev = prev.previousElementSibling;
        }

        // Method 5: Aria-label or title
        if (element.getAttribute('aria-label')) {
            return element.getAttribute('aria-label');
        }

        if (element.title) {
            return element.title;
        }

        return '';
    }

    getFieldContext(element) {
        // Get surrounding text context
        const parent = element.parentElement;
        if (parent) {
            const siblingTexts = Array.from(parent.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .filter(text => text.length > 0);

            return siblingTexts.join(' ');
        }
        return '';
    }

    inferFieldType(fieldInfo) {
        const { name, id, placeholder, label, type, className } = fieldInfo;
        const allText = `${name} ${id} ${placeholder} ${label} ${className}`.toLowerCase();

        // Email detection
        if (type === 'email' || 
            /email|e-mail|mail/.test(allText)) {
            return 'email';
        }

        // Password detection
        if (type === 'password') {
            return 'password';
        }

        // Phone detection
        if (type === 'tel' || 
            /phone|tel|mobile|hp|whatsapp|wa/.test(allText)) {
            return 'phone';
        }

        // Name detection
        if (/name|nama|full.?name|first.?name|last.?name|surname/.test(allText)) {
            return 'name';
        }

        // Address detection
        if (/address|alamat|street|jalan|kota|city|province|provinsi|postal|zip/.test(allText)) {
            return 'address';
        }

        // Date detection
        if (/date|tanggal|birth|lahir|dob/.test(allText) || 
            ['date', 'datetime-local', 'month', 'week'].includes(type)) {
            return 'date';
        }

        // Number detection
        if (type === 'number' || /number|angka|umur|age|quantity|jumlah/.test(allText)) {
            return 'number';
        }

        // URL detection
        if (type === 'url' || /url|website|link|site/.test(allText)) {
            return 'url';
        }

        // Company detection
        if (/company|perusahaan|organization|organisasi/.test(allText)) {
            return 'company';
        }

        return 'text';
    }

    getUniqueSelector(element) {
        // Generate unique selector for the element
        if (element.id) {
            return `#${element.id}`;
        }

        if (element.name) {
            return `${element.tagName.toLowerCase()}[name="${element.name}"]`;
        }

        // Generate CSS selector based on structure
        let selector = element.tagName.toLowerCase();

        if (element.className) {
            const classes = element.className.split(' ')
                .filter(cls => cls.trim().length > 0)
                .slice(0, 2); // Use only first 2 classes
            if (classes.length > 0) {
                selector += '.' + classes.join('.');
            }
        }

        return selector;
    }

    isElementHidden(element) {
        const style = window.getComputedStyle(element);
        return style.display === 'none' || 
               style.visibility === 'hidden' || 
               element.offsetParent === null ||
               style.opacity === '0';
    }

    highlightField(element) {
        // Add temporary highlight to detected fields
        const originalOutline = element.style.outline;
        element.style.outline = '2px dashed #4f46e5';
        element.style.outlineOffset = '2px';

        setTimeout(() => {
            element.style.outline = originalOutline;
        }, 2000);
    }

    fillFormWithData(data) {
        let filledCount = 0;
        const fields = this.detectFormFields();

        fields.forEach(fieldInfo => {
            const element = document.querySelector(fieldInfo.selector);
            if (!element || element.disabled || element.readOnly) {
                return;
            }

            let value = this.findMatchingValue(fieldInfo, data);

            if (value !== null) {
                this.setFieldValue(element, value);
                filledCount++;

                // Visual feedback
                this.showFieldFillAnimation(element);
            }
        });

        console.log(`✅ Filled ${filledCount} fields with AI data`);
        return filledCount;
    }

    findMatchingValue(fieldInfo, data) {
        const { name, id, placeholder, label, fieldType } = fieldInfo;

        // Direct matches
        const identifiers = [name, id, placeholder, label].filter(Boolean);

        for (const identifier of identifiers) {
            if (data[identifier]) {
                return data[identifier];
            }
        }

        // Type-based matching
        const dataKeys = Object.keys(data);

        // Field type matching
        const typeMatch = dataKeys.find(key => key.toLowerCase().includes(fieldType));
        if (typeMatch) {
            return data[typeMatch];
        }

        // Fuzzy matching
        for (const identifier of identifiers) {
            const fuzzyMatch = dataKeys.find(key => 
                key.toLowerCase().includes(identifier.toLowerCase()) ||
                identifier.toLowerCase().includes(key.toLowerCase())
            );

            if (fuzzyMatch) {
                return data[fuzzyMatch];
            }
        }

        return null;
    }

    setFieldValue(element, value) {
        const tagName = element.tagName.toLowerCase();

        if (tagName === 'select') {
            this.setSelectValue(element, value);
        } else if (element.type === 'checkbox') {
            element.checked = Boolean(value);
        } else if (element.type === 'radio') {
            if (element.value === value) {
                element.checked = true;
            }
        } else {
            element.value = value;
        }

        // Trigger events for form validation and frameworks
        this.triggerFieldEvents(element);
    }

    setSelectValue(selectElement, value) {
        const options = Array.from(selectElement.options);

        // Try exact match first
        let matchingOption = options.find(option => 
            option.value === value || option.textContent.trim() === value
        );

        // Try partial match
        if (!matchingOption) {
            matchingOption = options.find(option => 
                option.value.toLowerCase().includes(value.toLowerCase()) ||
                option.textContent.toLowerCase().includes(value.toLowerCase())
            );
        }

        if (matchingOption) {
            selectElement.value = matchingOption.value;
        }
    }

    triggerFieldEvents(element) {
        // Comprehensive event triggering for different frameworks
        const events = [
            new Event('input', { bubbles: true, cancelable: true }),
            new Event('change', { bubbles: true, cancelable: true }),
            new Event('blur', { bubbles: true, cancelable: true }),
            new Event('keyup', { bubbles: true, cancelable: true }),
            new Event('keydown', { bubbles: true, cancelable: true })
        ];

        events.forEach(event => {
            element.dispatchEvent(event);
        });

        // For React and other virtual DOM frameworks
        if (element._valueTracker) {
            element._valueTracker.setValue('');
        }
    }

    showFieldFillAnimation(element) {
        const originalBackground = element.style.backgroundColor;
        element.style.backgroundColor = '#10b981';
        element.style.transition = 'background-color 0.3s ease';

        setTimeout(() => {
            element.style.backgroundColor = originalBackground;
        }, 500);
    }

    clearAllForms() {
        const fields = this.detectFormFields();
        let clearedCount = 0;

        fields.forEach(fieldInfo => {
            const element = document.querySelector(fieldInfo.selector);
            if (!element || element.disabled || element.readOnly) {
                return;
            }

            const tagName = element.tagName.toLowerCase();

            if (tagName === 'select') {
                element.selectedIndex = 0;
            } else if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else {
                element.value = '';
            }

            this.triggerFieldEvents(element);
            clearedCount++;
        });

        console.log(`🗑️ Cleared ${clearedCount} form fields`);
        return clearedCount;
    }

    addExtensionIndicators() {
        // Add subtle indicator that extension is active
        if (document.getElementById('auto-filler-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'auto-filler-indicator';
        indicator.innerHTML = '🤖 Auto Filler AI';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

        document.body.appendChild(indicator);

        // Show indicator briefly when page loads
        setTimeout(() => {
            indicator.style.opacity = '1';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 3000);
        }, 1000);
    }
}

// Initialize content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AutoFillerContent();
    });
} else {
    new AutoFillerContent();
}