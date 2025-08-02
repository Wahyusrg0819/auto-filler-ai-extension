// Auto Filler AI - Popup Script
class AutoFillerPopup {
    constructor() {
        this.apiKey = '';
        this.fieldCount = 0;
        this.isFormAnalyzed = false;
        this.usedData = new Set(); // Track previously used data for variation
        this.selectedElement = null;
        this.isSelectingElement = false;

        this.init();
    }

    async init() {
        await this.loadApiKey();
        this.bindEvents();
        this.setupMessageListener();
        this.updateUI();
        this.hideClearHighlightButton(); // Initially hide the clear highlight button
        this.log('Ekstensi siap digunakan', 'info');
    }

    setupMessageListener() {
        // Listen for messages from content script
        console.log('Setting up message listener for elementSelected');
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Popup received message:', message);
            if (message.action === 'elementSelected') {
                console.log('Processing elementSelected message:', message.element);
                this.onElementSelected(message.element);
            }
        });
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

        // Element Selector
        document.getElementById('selectElement').addEventListener('click', () => {
            this.toggleElementSelection();
        });

        // Clear Selection
        const clearSelectionBtn = document.getElementById('clearSelection');
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => {
                this.clearSelectedElement();
            });
        }

        // Clear Highlight (small button next to element selector)
        const clearHighlightBtn = document.getElementById('clearHighlight');
        if (clearHighlightBtn) {
            clearHighlightBtn.addEventListener('click', () => {
                this.clearElementHighlight();
            });
        }

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

    // ===== ELEMENT SELECTION METHODS =====

    async toggleElementSelection() {
        if (this.isSelectingElement) {
            await this.stopElementSelection();
        } else {
            await this.startElementSelection();
        }
    }

    async startElementSelection() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if content script is ready by sending a test message first
            try {
                await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
            } catch (pingError) {
                // Content script not ready, inject it
                this.log('Memuat content script...', 'info');
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['src/content/content.js']
                });
                
                // Wait a bit for initialization
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            await chrome.tabs.sendMessage(tab.id, { action: 'startElementSelection' });
            
            this.isSelectingElement = true;
            this.updateElementSelectorButton();
            this.log('Mode seleksi elemen diaktifkan - klik elemen yang ingin dipilih', 'info');
            
        } catch (error) {
            console.error('Error starting element selection:', error);
            this.log('Error: Gagal mengaktifkan mode seleksi elemen. Pastikan halaman sudah dimuat.', 'error');
        }
    }

    async stopElementSelection() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, { action: 'stopElementSelection' });
            
            this.isSelectingElement = false;
            this.updateElementSelectorButton();
            this.log('Mode seleksi elemen dinonaktifkan', 'info');
            
        } catch (error) {
            console.error('Error stopping element selection:', error);
        }
    }

    async clearSelectedElement() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, { action: 'clearSelectedElement' });
            
            this.selectedElement = null;
            this.updateSelectedElementInfo();
            this.updateUI();
            this.hideClearHighlightButton();
            this.log('Elemen terpilih dihapus', 'info');
            
        } catch (error) {
            console.error('Error clearing selected element:', error);
        }
    }

    onElementSelected(elementInfo) {
        console.log('onElementSelected called:', elementInfo);
        this.selectedElement = elementInfo;
        this.isSelectingElement = false;
        this.updateElementSelectorButton();
        this.updateSelectedElementInfo();
        // Remove showClearHighlightButton() call since button is always visible
        this.log(`Elemen terpilih: ${elementInfo.tagName} (${elementInfo.formFields.length} fields)`, 'success');
        
        // Auto-analyze form after selection
        if (elementInfo.formFields.length > 0) {
            this.analyzeForm();
        }
    }

    updateElementSelectorButton() {
        const button = document.getElementById('selectElement');
        const btnText = button.querySelector('.btn-text');
        
        if (this.isSelectingElement) {
            button.classList.add('active');
            btnText.innerHTML = '<i class="fas fa-times"></i> Batalkan';
        } else {
            button.classList.remove('active');
            btnText.innerHTML = '<i class="fas fa-crosshairs"></i> Pilih Elemen';
        }
    }

    updateSelectedElementInfo() {
        const infoContainer = document.getElementById('selectedElementInfo');
        const tagElement = document.getElementById('selectedElementTag');
        const selectorElement = document.getElementById('selectedElementSelector');
        const analyzeButton = document.getElementById('analyzeForm');
        const analyzeText = document.getElementById('analyzeFormText');
        
        if (this.selectedElement && infoContainer && tagElement && selectorElement) {
            infoContainer.style.display = 'block';
            tagElement.textContent = this.selectedElement.tagName.toUpperCase();
            selectorElement.textContent = this.selectedElement.selector;
            
            // Update analyze button text for selected element mode
            if (analyzeText) {
                analyzeText.innerHTML = '<i class="fas fa-crosshairs"></i> Analisis Elemen Terpilih';
            }
        } else if (infoContainer) {
            infoContainer.style.display = 'none';
            
            // Reset analyze button text for global mode
            if (analyzeText) {
                analyzeText.innerHTML = '<i class="fas fa-search"></i> Analisis Form Global';
            }
        }
    }

    // Note: Clear highlight button is now always visible
    // showClearHighlightButton() and hideClearHighlightButton() are no longer needed
    /*
    showClearHighlightButton() {
        const clearHighlightBtn = document.getElementById('clearHighlight');
        console.log('Showing clear highlight button:', clearHighlightBtn);
        if (clearHighlightBtn) {
            clearHighlightBtn.style.display = 'flex';
            clearHighlightBtn.classList.add('show');
            console.log('Clear highlight button shown, styles:', {
                display: clearHighlightBtn.style.display,
                computed: window.getComputedStyle ? window.getComputedStyle(clearHighlightBtn).display : 'unknown'
            });
        } else {
            console.error('Clear highlight button not found!');
        }
    }

    hideClearHighlightButton() {
        const clearHighlightBtn = document.getElementById('clearHighlight');
        if (clearHighlightBtn) {
            clearHighlightBtn.style.display = 'none';
            clearHighlightBtn.classList.remove('show');
        }
    }
    */

    async clearElementHighlight() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, { action: 'clearElementHighlight' });
            
            // Remove hideClearHighlightButton() call since button should stay visible
            this.log('Highlight elemen dihilangkan', 'info');
            
        } catch (error) {
            console.error('Error clearing element highlight:', error);
            this.log('Error: Gagal menghilangkan highlight elemen', 'error');
        }
    }

    async analyzeForm() {
        if (!this.apiKey) {
            this.updateApiStatus('Harap masukkan API Key terlebih dahulu', 'error');
            return;
        }

        // Determine analysis scope based on selected element
        const analysisScope = this.selectedElement ? 'selected' : 'global';
        const scopeDesc = this.selectedElement ? 'elemen terpilih' : 'seluruh halaman';
        
        this.log(`Menganalisis form dalam ${scopeDesc}...`, 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if content script is ready
            try {
                await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
            } catch (pingError) {
                // Content script not ready, inject it
                this.log('Memuat content script...', 'info');
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['src/content/content.js']
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Send message with scope parameter
            const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'analyzeForm',
                scope: analysisScope
            });

            if (response.success) {
                const fields = response.fields;
                this.fieldCount = fields.length;
                this.isFormAnalyzed = true;

                console.log('Analysis successful - Field count:', this.fieldCount, 'Form analyzed:', this.isFormAnalyzed);

                // Update field count display
                const fieldCountElement = document.getElementById('fieldCount');
                if (fieldCountElement) {
                    fieldCountElement.textContent = this.fieldCount;
                }

                // Update form count (estimate based on form containers)
                const formCountElement = document.getElementById('formCount');
                if (formCountElement) {
                    const uniqueForms = new Set(fields.map(f => f.formContainer || 'default'));
                    formCountElement.textContent = uniqueForms.size;
                }

                this.updateUI(); // This should enable the fill form button
                
                const scopeText = this.selectedElement ? 'dalam elemen terpilih' : 'di halaman';
                this.log(`✅ Ditemukan ${this.fieldCount} field ${scopeText}`, 'success');
            } else {
                this.log('❌ Gagal menganalisis form', 'error');
            }
        } catch (error) {
            console.error('Analyze form error:', error);
            this.log('❌ Error saat menganalisis form. Pastikan halaman sudah dimuat.', 'error');
        }
    }

    async fillForm() {
        console.log('Fill form button clicked - Form analyzed:', this.isFormAnalyzed, 'Field count:', this.fieldCount, 'API Key:', !!this.apiKey);
        
        if (!this.isFormAnalyzed) {
            this.log('❌ Silakan analisis form terlebih dahulu', 'error');
            return;
        }

        if (!this.apiKey) {
            this.updateApiStatus('Harap masukkan API Key terlebih dahulu', 'error');
            return;
        }

        this.log('🤖 Generating data dengan AI...', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if content script is ready
            try {
                await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
            } catch (pingError) {
                // Content script not ready, inject it
                this.log('Memuat content script...', 'info');
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['src/content/content.js']
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // First, get the analyzed form fields
            const analyzeResponse = await chrome.tabs.sendMessage(tab.id, { 
                action: 'analyzeForm',
                scope: this.selectedElement ? 'selected' : 'global'
            });

            if (!analyzeResponse.success || analyzeResponse.fields.length === 0) {
                this.log('❌ Tidak ada field yang dapat diisi', 'error');
                return;
            }

            // Generate AI data for the fields
            this.log('🧠 Memproses dengan Gemini AI...', 'info');
            const generatedData = await this.generateFormData(analyzeResponse.fields);
            
            if (!generatedData) {
                this.log('❌ Gagal generate data dengan AI', 'error');
                return;
            }

            // Send the generated data to content script for form filling
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'fillFormWithGeneratedData',
                generatedData: generatedData,
                selectedElement: this.selectedElement
            });

            if (response && response.success) {
                this.log('✅ Form berhasil diisi dengan AI', 'success');
            } else {
                this.log('❌ Gagal mengisi form', 'error');
            }
        } catch (error) {
            console.error('Fill form error:', error);
            this.log('❌ Error saat mengisi form. Pastikan halaman sudah dimuat.', 'error');
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
  "field_name_or_id": "nilai_yang_sesuai",
  "another_field": "nilai_lain"
}

Gunakan NAME, ID, atau PLACEHOLDER sebagai key JSON. Pastikan data realistis dan BERVARIASI untuk testing:

PANDUAN GENERATE DATA:
- Gunakan nama field asli sebagai key JSON (name="email" → key: "email")
- Jika field tidak punya name, gunakan id (id="userEmail" → key: "userEmail") 
- Jika tidak ada keduanya, gunakan placeholder atau label
- Data harus realistis dan konsisten untuk testing form
- Hindari data yang sama dengan generate sebelumnya

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
        this.log('Membersihkan form...', 'info');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if content script is ready
            try {
                await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
            } catch (pingError) {
                // Content script not ready, inject it
                this.log('Memuat content script...', 'info');
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['src/content/content.js']
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'clearForm',
                selectedElement: this.selectedElement
            });

            if (response && response.success) {
                this.log('✅ Form berhasil dibersihkan', 'success');
            } else {
                this.log('❌ Gagal membersihkan form', 'error');
            }
        } catch (error) {
            console.error('Clear form error:', error);
            this.log('❌ Error saat membersihkan form. Pastikan halaman sudah dimuat.', 'error');
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
        const fillFormButton = document.getElementById('fillForm');
        const formStatusElement = document.getElementById('formStatus');
        
        // Enable analyze button if we have API key
        document.getElementById('analyzeForm').disabled = !hasApiKey;

        // Handle fill form button status
        if (!hasApiKey) {
            fillFormButton.disabled = true;
            if (formStatusElement) {
                formStatusElement.textContent = 'Perlu API Key';
            }
        } else if (this.isFormAnalyzed && this.fieldCount > 0) {
            // Enable fill form button if form was analyzed successfully with fields found
            fillFormButton.disabled = false;
            if (formStatusElement) {
                formStatusElement.textContent = `Siap auto-fill ${this.fieldCount} field dengan AI`;
            }
            console.log('Fill form button enabled - Form analyzed:', this.isFormAnalyzed, 'Field count:', this.fieldCount);
        } else if (hasApiKey && !this.isFormAnalyzed) {
            // Has API key but not analyzed yet
            fillFormButton.disabled = true;
            if (formStatusElement) {
                formStatusElement.textContent = 'Analisis form terlebih dahulu';
            }
        } else if (hasApiKey && this.isFormAnalyzed && this.fieldCount === 0) {
            // Analyzed but no fields found
            fillFormButton.disabled = true;
            if (formStatusElement) {
                formStatusElement.textContent = 'Tidak ada field yang ditemukan';
            }
        }
        
        // Update selected element info
        this.updateSelectedElementInfo();
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