// Auto Filler AI - Popup Script
class AutoFillerPopup {
    constructor() {
        this.apiKey = '';
        this.fieldCount = 0;
        this.isFormAnalyzed = false;
        this.usedData = new Set(); // Track previously used data for variation

        this.init();
    }

    async init() {
        await this.loadApiKey();
        this.bindEvents();
        this.updateUI();
        this.log('Ekstensi siap digunakan', 'info');
    }

    async loadApiKey() {
        try {
            const result = await chrome.storage.local.get(['geminiApiKey', 'usedFormData']);
            if (result.geminiApiKey) {
                this.apiKey = result.geminiApiKey;
                document.getElementById('apiKey').value = this.apiKey;
                this.updateApiStatus('API Key tersimpan', 'success');
            }
            
            // Load previously used data for variation
            if (result.usedFormData) {
                this.usedData = new Set(result.usedFormData);
                console.log('Loaded used data:', Array.from(this.usedData));
            }
        } catch (error) {
            console.error('Error loading API key:', error);
        }
    }

    bindEvents() {
        // Save API Key
        document.getElementById('saveApiKey').addEventListener('click', () => {
            this.saveApiKey();
        });

        // Analyze Form
        document.getElementById('analyzeForm').addEventListener('click', () => {
            this.analyzeForm();
        });

        // Fill Form
        document.getElementById('fillForm').addEventListener('click', () => {
            this.fillForm();
        });

        // Clear Form
        document.getElementById('clearForm').addEventListener('click', () => {
            this.clearForm();
        });

        // Debug Form
        document.getElementById('debugForm').addEventListener('click', () => {
            this.debugForm();
        });

        // Reset Used Data
        document.getElementById('resetUsedData').addEventListener('click', () => {
            this.resetUsedData();
        });

        // Enter key on API key input
        document.getElementById('apiKey').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });
    }

    async saveApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            this.updateApiStatus('API Key tidak boleh kosong', 'error');
            return;
        }

        try {
            await chrome.storage.local.set({ geminiApiKey: apiKey });
            this.apiKey = apiKey;
            this.updateApiStatus('API Key berhasil disimpan', 'success');
            this.log('API Key berhasil disimpan', 'success');
            this.updateUI();
        } catch (error) {
            this.updateApiStatus('Gagal menyimpan API Key', 'error');
            this.log('Error: Gagal menyimpan API Key', 'error');
        }
    }

    async analyzeForm() {
        if (!this.apiKey) {
            this.updateApiStatus('Harap masukkan API Key terlebih dahulu', 'error');
            return;
        }

        this.log('Menganalisis form...', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    // Helper function untuk mencari label (definisi ulang di dalam injected function)
                    function getFieldLabel(element) {
                        // Try to find label
                        if (element.labels && element.labels.length > 0) {
                            return element.labels[0].textContent.trim();
                        }

                        // Try to find label by for attribute
                        const label = document.querySelector(`label[for="${element.id}"]`);
                        if (label) {
                            return label.textContent.trim();
                        }

                        // Try to find closest label
                        const closestLabel = element.closest('label');
                        if (closestLabel) {
                            return closestLabel.textContent.replace(element.value || '', '').trim();
                        }

                        // Try previous sibling
                        let prev = element.previousElementSibling;
                        if (prev && prev.tagName.toLowerCase() === 'label') {
                            return prev.textContent.trim();
                        }

                        return '';
                    }

                    // Main detection logic
                    const formFields = [];
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
                        'input:not([type])',
                        'textarea',
                        'select'
                    ];

                    console.log('Starting form field detection...');

                    selectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        console.log(`Found ${elements.length} elements for selector: ${selector}`);
                        
                        elements.forEach((element, index) => {
                            // Lebih permisif dalam deteksi visibility
                            const isInModal = element.closest('.modal, [role="dialog"], .popup, .overlay, .lightbox') !== null;
                            const computedStyle = window.getComputedStyle(element);
                            const isVisible = element.offsetParent !== null || 
                                            isInModal || 
                                            (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden');
                            
                            console.log(`Element ${index} (${selector}):`, {
                                id: element.id,
                                name: element.name,
                                type: element.type,
                                disabled: element.disabled,
                                readOnly: element.readOnly,
                                offsetParent: !!element.offsetParent,
                                display: computedStyle.display,
                                visibility: computedStyle.visibility,
                                isVisible: isVisible
                            });

                            // Lebih permisif: hanya check disabled, tidak peduli visibility
                            if (!element.disabled && !element.readOnly) {
                                const fieldInfo = {
                                    id: element.id || '',
                                    name: element.name || '',
                                    type: element.type || element.tagName.toLowerCase(),
                                    placeholder: element.placeholder || '',
                                    label: getFieldLabel(element),
                                    tagName: element.tagName.toLowerCase(),
                                    required: element.required || false,
                                    isInModal: isInModal,
                                    isVisible: isVisible
                                };
                                formFields.push(fieldInfo);
                                console.log('Added field:', fieldInfo);
                            }
                        });
                    });

                    console.log(`Total detected form fields: ${formFields.length}`);
                    return formFields;
                }
            });

            if (results && results[0] && results[0].result) {
                const fields = results[0].result;
                this.fieldCount = fields.length;
                this.isFormAnalyzed = true;

                // Debug logging
                console.log('Detected fields:', fields);
                this.log(`Debug: Hasil analisis - ${fields.length} field ditemukan`, 'info');

                // Safely update field count
                const fieldCountElement = document.getElementById('fieldCount');
                if (fieldCountElement) {
                    fieldCountElement.textContent = this.fieldCount;
                }
                
                // Update form count display
                const formCountElement = document.getElementById('formCount');
                if (formCountElement) {
                    formCountElement.textContent = document.querySelectorAll('form').length || 1;
                }
                
                // Improved form status and button handling
                if (this.fieldCount > 0) {
                    const modalCount = fields.filter(f => f.isInModal).length;
                    const statusText = modalCount > 0 ? 
                        `Form terdeteksi (${modalCount} field dalam modal)` : 
                        'Form terdeteksi';
                    
                    // Safely update form status if element exists
                    const formStatusElement = document.getElementById('formStatus');
                    if (formStatusElement) {
                        formStatusElement.textContent = statusText;
                    }
                    this.log(`Ditemukan ${this.fieldCount} field form${modalCount > 0 ? ` (${modalCount} dalam modal)` : ''}`, 'success');
                    
                    // Enable fill button if we have API key and fields
                    if (this.apiKey) {
                        document.getElementById('fillForm').disabled = false;
                        this.log('Tombol "Isi Form dengan AI" siap digunakan', 'info');
                    } else {
                        document.getElementById('fillForm').disabled = true;
                        this.log('Perlu API Key untuk mengaktifkan tombol isi form', 'error');
                    }
                } else {
                    // Safely update form status if element exists
                    const formStatusElement = document.getElementById('formStatus');
                    if (formStatusElement) {
                        formStatusElement.textContent = 'Tidak ada form';
                    }
                    this.log('Tidak ditemukan field form yang dapat diisi', 'error');
                    document.getElementById('fillForm').disabled = true;
                }
            } else {
                this.log('Gagal mendapatkan hasil analisis form', 'error');
                document.getElementById('fillForm').disabled = true;
            }
        } catch (error) {
            this.log('Error menganalisis form: ' + error.message, 'error');
            console.error('Analyze form error:', error);
        }
    }

    async fillForm() {
        if (!this.apiKey || !this.isFormAnalyzed) {
            this.log('Harap analisis form terlebih dahulu', 'error');
            return;
        }

        this.log('Mengisi form dengan AI...', 'info');
        const fillButton = document.getElementById('fillForm');
        fillButton.disabled = true;
        
        // Update button text safely - check if btn-text span exists
        const btnTextElement = fillButton.querySelector('.btn-text');
        if (btnTextElement) {
            btnTextElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        } else {
            fillButton.textContent = '🔄 Memproses...';
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Get form fields with inline function (same as in analyzeForm)
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    // Helper function untuk mencari label
                    function getFieldLabel(element) {
                        if (element.labels && element.labels.length > 0) {
                            return element.labels[0].textContent.trim();
                        }
                        const label = document.querySelector(`label[for="${element.id}"]`);
                        if (label) {
                            return label.textContent.trim();
                        }
                        const closestLabel = element.closest('label');
                        if (closestLabel) {
                            return closestLabel.textContent.replace(element.value || '', '').trim();
                        }
                        let prev = element.previousElementSibling;
                        if (prev && prev.tagName.toLowerCase() === 'label') {
                            return prev.textContent.trim();
                        }
                        return '';
                    }

                    // Form field detection
                    const formFields = [];
                    const selectors = [
                        'input[type="text"]', 'input[type="email"]', 'input[type="tel"]',
                        'input[type="url"]', 'input[type="number"]', 'input[type="password"]',
                        'input[type="search"]', 'input[type="date"]', 'input[type="datetime-local"]',
                        'input[type="time"]', 'input[type="month"]', 'input[type="week"]',
                        'input:not([type])', 'textarea', 'select'
                    ];

                    selectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(element => {
                            if (!element.disabled && !element.readOnly) {
                                const isInModal = element.closest('.modal, [role="dialog"], .popup, .overlay, .lightbox') !== null;
                                formFields.push({
                                    id: element.id || '',
                                    name: element.name || '',
                                    type: element.type || element.tagName.toLowerCase(),
                                    placeholder: element.placeholder || '',
                                    label: getFieldLabel(element),
                                    tagName: element.tagName.toLowerCase(),
                                    required: element.required || false,
                                    isInModal: isInModal
                                });
                            }
                        });
                    });

                    return formFields;
                }
            });

            if (results && results[0] && results[0].result) {
                const fields = results[0].result;

                // Generate data with Gemini AI
                const generatedData = await this.generateFormData(fields);

                if (generatedData) {
                    // Fill the form with inline function
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        function: (data) => {
                            // Helper function untuk mencari label
                            function getFieldLabel(element) {
                                if (element.labels && element.labels.length > 0) {
                                    return element.labels[0].textContent.trim();
                                }
                                const label = document.querySelector(`label[for="${element.id}"]`);
                                if (label) {
                                    return label.textContent.trim();
                                }
                                const closestLabel = element.closest('label');
                                if (closestLabel) {
                                    return closestLabel.textContent.replace(element.value || '', '').trim();
                                }
                                let prev = element.previousElementSibling;
                                if (prev && prev.tagName.toLowerCase() === 'label') {
                                    return prev.textContent.trim();
                                }
                                return '';
                            }

                            // Fill form logic
                            const selectors = [
                                'input[type="text"]', 'input[type="email"]', 'input[type="tel"]',
                                'input[type="url"]', 'input[type="number"]', 'input[type="password"]',
                                'input[type="search"]', 'input[type="date"]', 'input[type="datetime-local"]',
                                'input[type="time"]', 'input[type="month"]', 'input[type="week"]',
                                'input:not([type])', 'textarea', 'select'
                            ];

                            let filledCount = 0;

                            selectors.forEach(selector => {
                                const elements = document.querySelectorAll(selector);
                                elements.forEach(element => {
                                    // Update visibility check to handle modals
                                    const isInModal = element.closest('.modal, [role="dialog"], .popup, .overlay, .lightbox') !== null;
                                    const isVisible = element.offsetParent !== null || isInModal || 
                                                    window.getComputedStyle(element).display !== 'none';
                                    
                                    if (!element.disabled && !element.readOnly && isVisible) {
                                        // Try to find matching data
                                        let value = null;

                                        // Try different identifiers
                                        const identifiers = [
                                            element.name,
                                            element.id,
                                            element.placeholder?.toLowerCase(),
                                            getFieldLabel(element)?.toLowerCase()
                                        ].filter(Boolean);

                                        for (const identifier of identifiers) {
                                            if (data[identifier]) {
                                                value = data[identifier];
                                                break;
                                            }

                                            // Try partial matches
                                            const keys = Object.keys(data);
                                            const partialMatch = keys.find(key => 
                                                key.toLowerCase().includes(identifier.toLowerCase()) ||
                                                identifier.toLowerCase().includes(key.toLowerCase())
                                            );

                                            if (partialMatch) {
                                                value = data[partialMatch];
                                                break;
                                            }
                                        }

                                        if (value) {
                                            if (element.tagName.toLowerCase() === 'select') {
                                                // Enhanced select element handling
                                                const options = Array.from(element.options);
                                                
                                                // Skip empty or placeholder options
                                                const validOptions = options.filter(option => 
                                                    option.value && 
                                                    option.value !== '' && 
                                                    option.value !== 'null' &&
                                                    option.value !== 'undefined' &&
                                                    !option.textContent.toLowerCase().includes('pilih') &&
                                                    !option.textContent.toLowerCase().includes('select')
                                                );

                                                if (validOptions.length > 0) {
                                                    // Try to match with AI value first
                                                    let matchingOption = validOptions.find(option => 
                                                        option.value.toLowerCase().includes(value.toLowerCase()) ||
                                                        option.textContent.toLowerCase().includes(value.toLowerCase())
                                                    );

                                                    // If no match, pick a random valid option
                                                    if (!matchingOption) {
                                                        const randomIndex = Math.floor(Math.random() * validOptions.length);
                                                        matchingOption = validOptions[randomIndex];
                                                    }

                                                    if (matchingOption) {
                                                        element.value = matchingOption.value;
                                                        console.log(`Selected option: ${matchingOption.textContent} (${matchingOption.value})`);
                                                    }
                                                }
                                            } else {
                                                element.value = value;
                                            }

                                            // Trigger events
                                            element.dispatchEvent(new Event('input', { bubbles: true }));
                                            element.dispatchEvent(new Event('change', { bubbles: true }));
                                            filledCount++;
                                        } else if (element.tagName.toLowerCase() === 'select') {
                                            // Handle select without AI value - just pick a random option
                                            const options = Array.from(element.options);
                                            const validOptions = options.filter(option => 
                                                option.value && 
                                                option.value !== '' && 
                                                option.value !== 'null' &&
                                                option.value !== 'undefined' &&
                                                !option.textContent.toLowerCase().includes('pilih') &&
                                                !option.textContent.toLowerCase().includes('select')
                                            );

                                            if (validOptions.length > 0) {
                                                const randomIndex = Math.floor(Math.random() * validOptions.length);
                                                const selectedOption = validOptions[randomIndex];
                                                element.value = selectedOption.value;
                                                element.dispatchEvent(new Event('change', { bubbles: true }));
                                                filledCount++;
                                                console.log(`Random selected: ${selectedOption.textContent} (${selectedOption.value})`);
                                            }
                                        }
                                    }
                                });
                            });

                            return filledCount;
                        },
                        args: [generatedData]
                    });

                    this.log('Form berhasil diisi dengan AI', 'success');
                } else {
                    this.log('Gagal generate data dari AI', 'error');
                }
            }
        } catch (error) {
            this.log('Error mengisi form: ' + error.message, 'error');
            console.error('Fill form error:', error);
        } finally {
            const fillButton = document.getElementById('fillForm');
            fillButton.disabled = false;
            
            // Restore button text safely
            const btnTextElement = fillButton.querySelector('.btn-text');
            if (btnTextElement) {
                btnTextElement.innerHTML = '<i class="fas fa-magic"></i> Isi Form dengan AI';
            } else {
                fillButton.textContent = '✨ Isi Form dengan AI';
            }
        }
    }

    async generateFormData(fields) {
        try {
            // Buat prompt untuk Gemini AI dengan data yang sudah digunakan
            const prompt = this.createPrompt(fields);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const text = data.candidates[0].content.parts[0].text;
                const generatedData = this.parseAIResponse(text);
                
                // Track generated data untuk variasi berikutnya
                if (generatedData) {
                    Object.values(generatedData).forEach(value => {
                        if (typeof value === 'string' && value.length > 2) {
                            this.usedData.add(value.toLowerCase());
                        }
                    });
                    
                    // Keep only last 50 used data entries to avoid memory issues
                    if (this.usedData.size > 50) {
                        const arrayData = Array.from(this.usedData);
                        this.usedData = new Set(arrayData.slice(-50));
                    }
                    
                    // Save to storage
                    await this.saveUsedData();
                    
                    console.log('Generated data:', generatedData);
                    console.log('Used data tracking:', Array.from(this.usedData));
                }
                
                return generatedData;
            }

            return null;
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    createPrompt(fields) {
        // Generate random variations for more diverse data
        const timestamp = Date.now();
        const randomSeed = Math.floor(Math.random() * 1000);
        
        // Random name variations
        const maleNames = ['Ahmad', 'Budi', 'Candra', 'Dedi', 'Eko', 'Fajar', 'Gunawan', 'Hadi', 'Indra', 'Joko', 'Krisna', 'Lukman', 'Made', 'Nugroho', 'Oscar', 'Putra', 'Rizky', 'Sandi', 'Toni', 'Umar'];
        const femaleNames = ['Ani', 'Bella', 'Citra', 'Dewi', 'Eka', 'Fitri', 'Gita', 'Hani', 'Indah', 'Julia', 'Kartika', 'Lina', 'Maya', 'Nina', 'Okta', 'Putri', 'Ratna', 'Sari', 'Tina', 'Ulfa'];
        const lastNames = ['Pratama', 'Sari', 'Wijaya', 'Santoso', 'Kurniawan', 'Lestari', 'Permana', 'Anggraini', 'Setiawan', 'Handayani', 'Nugraha', 'Maharani', 'Saputra', 'Indrawati', 'Kusuma'];
        
        // Random cities
        const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Yogyakarta', 'Denpasar', 'Malang', 'Bogor', 'Tangerang', 'Bekasi', 'Depok', 'Batam'];
        
        // Random domains
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'student.unri.ac.id', 'company.co.id', 'email.com'];
        
        // Generate random selections
        const randomMaleName = maleNames[randomSeed % maleNames.length];
        const randomFemaleName = femaleNames[randomSeed % femaleNames.length];
        const randomLastName = lastNames[(randomSeed * 2) % lastNames.length];
        const randomCity = cities[randomSeed % cities.length];
        const randomDomain = domains[randomSeed % domains.length];

        let prompt = `Sebagai AI assistant untuk testing developer, buatkan data form yang realistis dan BERVARIASI dalam format JSON. 

PENTING: Gunakan data yang BERBEDA setiap kali! Jangan gunakan data yang sama berulang-ulang.

Seed variasi: ${randomSeed}
Timestamp: ${timestamp}`;

        // Tambahkan informasi data yang sudah digunakan jika ada
        if (this.usedData.size > 0) {
            const usedDataArray = Array.from(this.usedData).slice(-10); // Ambil 10 terakhir
            prompt += `\n\nDATA YANG SUDAH DIGUNAKAN SEBELUMNYA (JANGAN GUNAKAN LAGI):
${usedDataArray.map(data => `- ${data}`).join('\n')}

WAJIB: Hindari menggunakan data di atas! Buat variasi yang berbeda dan kreatif.`;
        }

        prompt += `\n\nBerikut adalah field-field yang perlu diisi:\n\n`;

        fields.forEach((field, index) => {
            prompt += `${index + 1}. `;
            if (field.label) prompt += `Label: "${field.label}" `;
            if (field.name) prompt += `Name: "${field.name}" `;
            if (field.id) prompt += `ID: "${field.id}" `;
            if (field.placeholder) prompt += `Placeholder: "${field.placeholder}" `;
            prompt += `Type: ${field.type}`;
            if (field.required) prompt += ` (Required)`;
            prompt += `\n`;
        });

        prompt += `\nBuatkan data yang sesuai untuk setiap field dalam format JSON seperti ini:
{
  "field_identifier_1": "nilai_yang_sesuai",
  "field_identifier_2": "nilai_yang_sesuai"
}

Gunakan name, id, atau placeholder sebagai identifier. Pastikan data realistis dan BERVARIASI untuk testing:

VARIASI DATA YANG DISARANKAN:
- Name: Pilih dari variasi seperti "${randomMaleName} ${randomLastName}", "${randomFemaleName} ${randomLastName}", atau kombinasi lain yang unik
- Email: Gunakan variasi seperti "${randomMaleName.toLowerCase()}.${randomLastName.toLowerCase()}@${randomDomain}" atau format kreatif lainnya
- Phone: Variasikan format nomor telepon Indonesia (08xx-xxxx-xxxx, +62-8xx-xxxx-xxxx)
- City: Pilih dari kota seperti "${randomCity}" atau kota Indonesia lainnya secara acak
- Address: Gunakan alamat lengkap yang bervariasi dengan nama jalan, nomor, dan kota yang berbeda
- Date: Gunakan tanggal yang bervariasi sesuai konteks
- Password: Buat password kuat yang berbeda-beda (min 8 karakter, kombinasi huruf, angka, simbol)
- Number: Gunakan angka yang masuk akal dan bervariasi
- Company: Variasikan nama perusahaan Indonesia (PT, CV, UD, dll)
- Select/Dropdown: Berikan nilai umum yang sesuai

WAJIB: Pastikan setiap kali generate menghasilkan data yang BERBEDA dan UNIK!

Hanya return JSON object saja, tanpa teks tambahan.`;

        return prompt;
    }

    parseAIResponse(text) {
        try {
            // Clean the response to extract JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return null;
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return null;
        }
    }

    async clearForm() {
        this.log('Mengosongkan form...', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    // Clear input and textarea elements
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
                        'input:not([type])',
                        'textarea'
                    ];

                    selectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(element => {
                            if (!element.disabled && !element.readOnly) {
                                element.value = '';
                                element.dispatchEvent(new Event('input', { bubbles: true }));
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        });
                    });

                    // Clear select elements
                    const selects = document.querySelectorAll('select');
                    selects.forEach(select => {
                        if (!select.disabled) {
                            select.selectedIndex = 0;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                }
            });

            this.log('Form berhasil dikosongkan', 'success');
        } catch (error) {
            this.log('Error mengosongkan form: ' + error.message, 'error');
        }
    }

    async debugForm() {
        this.log('🔍 Memulai debug form...', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    const debug = {
                        allInputs: document.querySelectorAll('input').length,
                        allTextareas: document.querySelectorAll('textarea').length,
                        allSelects: document.querySelectorAll('select').length,
                        modals: document.querySelectorAll('.modal, [role="dialog"], .popup, .overlay, .lightbox').length,
                        visibleInputs: Array.from(document.querySelectorAll('input')).filter(el => 
                            el.offsetParent !== null || window.getComputedStyle(el).display !== 'none'
                        ).length,
                        hiddenInputs: Array.from(document.querySelectorAll('input')).filter(el => 
                            el.offsetParent === null && window.getComputedStyle(el).display === 'none'
                        ).length,
                        disabledInputs: document.querySelectorAll('input:disabled').length,
                        readonlyInputs: document.querySelectorAll('input[readonly]').length,
                        url: window.location.href,
                        title: document.title,
                        // Tambahkan breakdown berdasarkan type
                        inputTypes: {},
                        sampleFields: []
                    };

                    // Count by input types
                    const allInputs = document.querySelectorAll('input');
                    allInputs.forEach(input => {
                        const type = input.type || 'text';
                        debug.inputTypes[type] = (debug.inputTypes[type] || 0) + 1;
                    });

                    // Get sample of first 5 form-fillable elements
                    const formSelectors = [
                        'input[type="text"]',
                        'input[type="email"]', 
                        'input[type="tel"]', 
                        'input:not([type])',
                        'textarea',
                        'select'
                    ];
                    
                    let sampleCount = 0;
                    for (let selector of formSelectors) {
                        if (sampleCount >= 5) break;
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => {
                            if (sampleCount >= 5) return;
                            
                            let optionsInfo = '';
                            if (el.tagName.toLowerCase() === 'select') {
                                const options = Array.from(el.options);
                                const validOptions = options.filter(opt => 
                                    opt.value && opt.value !== '' && opt.value !== 'null'
                                );
                                optionsInfo = `(${validOptions.length} valid options)`;
                            }
                            
                            debug.sampleFields.push({
                                selector: selector,
                                id: el.id,
                                name: el.name,
                                type: el.type,
                                placeholder: el.placeholder,
                                disabled: el.disabled,
                                readOnly: el.readOnly,
                                visible: el.offsetParent !== null,
                                optionsInfo: optionsInfo
                            });
                            sampleCount++;
                        });
                    }

                    return debug;
                }
            });

            if (results && results[0] && results[0].result) {
                const debug = results[0].result;
                this.log(`📊 Debug Info:`, 'info');
                this.log(`• URL: ${debug.url}`, 'info');
                this.log(`• Total inputs: ${debug.allInputs}`, 'info');
                this.log(`• Textareas: ${debug.allTextareas}`, 'info');
                this.log(`• Selects: ${debug.allSelects}`, 'info');
                this.log(`• Input Types: ${JSON.stringify(debug.inputTypes)}`, 'info');
                this.log(`• Modals detected: ${debug.modals}`, 'info');
                this.log(`• Visible inputs: ${debug.visibleInputs}`, 'info');
                this.log(`• Sample fields: ${debug.sampleFields.length}`, 'info');
                
                // Log sample fields
                debug.sampleFields.forEach((field, i) => {
                    const fieldInfo = `${field.selector} - id:"${field.id}" name:"${field.name}" type:"${field.type}" ${field.optionsInfo || ''}`;
                    this.log(`  Field ${i+1}: ${fieldInfo}`, 'info');
                });
                
                console.log('Debug results:', debug);
            }
        } catch (error) {
            this.log('Error dalam debug: ' + error.message, 'error');
            console.error('Debug error:', error);
        }
    }

    async resetUsedData() {
        this.usedData.clear();
        await this.saveUsedData();
        this.log('Data variasi telah direset. Form selanjutnya akan mulai variasi baru.', 'success');
        console.log('Used data cleared');
    }

    async saveUsedData() {
        try {
            await chrome.storage.local.set({ 
                usedFormData: Array.from(this.usedData) 
            });
        } catch (error) {
            console.error('Error saving used data:', error);
        }
    }

    updateApiStatus(message, type) {
        const statusElement = document.getElementById('apiStatus');
        statusElement.textContent = message;
        statusElement.className = `api-status ${type}`;
    }

    updateUI() {
        const hasApiKey = !!this.apiKey;
        
        // Enable analyze button if we have API key
        document.getElementById('analyzeForm').disabled = !hasApiKey;

        // Handle fill form button status more carefully
        if (!hasApiKey) {
            document.getElementById('fillForm').disabled = true;
            
            // Safely update form status if element exists
            const formStatusElement = document.getElementById('formStatus');
            if (formStatusElement) {
                formStatusElement.textContent = 'Perlu API Key';
            }
        } else if (this.isFormAnalyzed && this.fieldCount > 0) {
            // Re-enable fill form button if form was already analyzed and has fields
            document.getElementById('fillForm').disabled = false;
        }
        // Don't automatically disable fillForm if we have API key but haven't analyzed yet
        // Let the analyze process handle that
    }

    log(message, type = 'info') {
        const logContainer = document.getElementById('logContainer');
        const logItem = document.createElement('div');
        logItem.className = `log-item ${type}`;

        const timestamp = new Date().toLocaleTimeString('id-ID');
        logItem.textContent = `[${timestamp}] ${message}`;

        // Add to top
        logContainer.insertBefore(logItem, logContainer.firstChild);

        // Keep only last 10 items
        const logItems = logContainer.querySelectorAll('.log-item');
        if (logItems.length > 10) {
            logItems[logItems.length - 1].remove();
        }
    }

    // Helper function that will be injected
    getFieldLabel(element) {
        // Try to find label
        if (element.labels && element.labels.length > 0) {
            return element.labels[0].textContent.trim();
        }

        // Try to find label by for attribute
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) {
            return label.textContent.trim();
        }

        // Try to find closest label
        const closestLabel = element.closest('label');
        if (closestLabel) {
            return closestLabel.textContent.replace(element.value || '', '').trim();
        }

        // Try previous sibling
        let prev = element.previousElementSibling;
        if (prev && prev.tagName.toLowerCase() === 'label') {
            return prev.textContent.trim();
        }

        return '';
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AutoFillerPopup();
});