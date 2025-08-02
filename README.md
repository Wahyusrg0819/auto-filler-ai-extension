# 🤖 Auto Filler AI - Chrome Extension

Ekstensi Chrome yang menggunakan Gemini AI untuk mengisi form secara otomatis. Sempurna untuk developer yang sering melakukan testing form.

## ✨ Fitur

- 🎯 **Deteksi Form Otomatis**: Mendeteksi semua field form di halaman web
- 🖱️ **Element Selector**: Pilih elemen spesifik untuk analisis dan pengisian form yang terfokus
- 🧠 **AI-Powered**: Menggunakan Gemini AI untuk generate data yang realistis
- 🔄 **Data Bervariasi**: Setiap pengisian menghasilkan data yang berbeda dan unik
- 🇮🇩 **Data Indonesia**: Generate data yang sesuai dengan format Indonesia
- ⚡ **Cepat & Mudah**: Isi form hanya dengan 2 klik
- 🔧 **Developer-Friendly**: Khusus dibuat untuk kebutuhan testing developer
- 📊 **Smart Tracking**: Mengingat data yang sudah digunakan untuk variasi maksimal
- 🎨 **UI Modern**: Interface yang clean dan mudah digunakan
- 👁️ **Visual Feedback**: Highlight elemen yang dipilih dengan feedback visual yang jelas
- 🗑️ **Clear Highlight**: Tombol untuk menghapus highlight tanpa menghilangkan seleksi elemen

## 📋 Field yang Didukung

- **Input Fields**: text, email, tel, url, number, password, search
- **Date Fields**: date, datetime-local, time, month, week
- **Text Areas**: textarea untuk input multi-line
- **Dropdown/Select**: Otomatis memilih opsi yang sesuai atau acak dari pilihan yang tersedia
- **Dan masih banyak lagi**

### 🎯 Khusus untuk Dropdown/Select

- AI akan mencoba mencocokkan nilai yang sesuai (contoh: "Indonesia" untuk field negara)
- Jika tidak ada yang cocok, extension akan memilih opsi acak dari pilihan yang valid
- Otomatis mengabaikan opsi placeholder seperti "Pilih..." atau "Select..."

## 🚀 Cara Instalasi

### 1. Download Extension

Clone atau download repository ini:

```bash
git clone https://github.com/your-username/auto-filler-extension.git
```

### 2. Buka Chrome Extensions

1. Buka Chrome dan ketik `chrome://extensions/` di address bar
2. Aktifkan **Developer mode** di pojok kanan atas
3. Klik **Load unpacked**
4. Pilih folder `auto-filler-extension`

### 3. Setup API Key Gemini

1. Buka [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Login dengan akun Google
3. Buat API Key baru
4. Copy API Key tersebut

### 4. Konfigurasi Extension

1. Klik icon extension di Chrome toolbar
2. Paste API Key Gemini di field yang tersedia
3. Klik tombol Save (💾)

## 📖 Cara Penggunaan

### 1. Element Selector (Fitur Baru) 🎯

**Fitur ini memungkinkan Anda untuk memilih elemen spesifik di halaman dan hanya menganalisis/mengisi form dalam elemen tersebut.**

1. Buka halaman web yang memiliki form
2. Klik icon **Auto Filler AI** di Chrome toolbar
3. Klik tombol **🎯 Pilih Elemen**
4. Kursor akan berubah menjadi crosshair
5. Hover di atas elemen yang ingin dipilih (akan muncul highlight orange)
6. Klik elemen untuk memilihnya (akan muncul highlight hijau dengan label "Selected Scope")
7. Tombol **�️ Hapus Highlight** akan selalu tersedia untuk menghilangkan visual highlight
8. Analisis dan pengisian form akan terbatas pada elemen yang dipilih

**Keuntungan Element Selector:**

- Fokus pada bagian form tertentu saja
- Mengabaikan form fields di luar area yang dipilih  
- Lebih presisi untuk halaman dengan multiple forms
- Visual feedback yang jelas tentang area yang aktif

### 2. Analisis Form

1. (Opsional) Pilih elemen spesifik menggunakan Element Selector
2. Klik tombol **�📊 Analisis Form**
3. Extension akan mendeteksi field dalam scope yang dipilih atau seluruh halaman
4. **Troubleshooting**: Jika tombol "Isi Form dengan AI" tidak aktif, gunakan tombol **🔍 Debug Form** untuk melihat detail deteksi

### 3. Isi Form dengan AI

1. Setelah form dianalisis, klik **✨ Isi Form dengan AI**
2. AI akan generate data yang sesuai untuk setiap field dalam scope
3. Form akan terisi secara otomatis hanya pada area yang dipilih

### 4. Kosongkan Form

- Klik **🗑️ Kosongkan Form** untuk menghapus semua isi form dalam scope yang dipilih

### 5. Clear Highlight

- Klik tombol **👁️** (selalu tersedia) untuk menghilangkan highlight visual tanpa menghapus seleksi elemen
- Berguna untuk melihat form tanpa gangguan visual highlight

### 6. Debug Form (Fitur Troubleshooting)

- Klik **🔍 Debug Form** untuk melihat informasi detail tentang form dalam scope
- Berguna untuk troubleshooting jika form tidak terdeteksi dengan benar

### 7. Reset Variasi Data

- Klik **🔄 Reset Variasi** untuk menghapus tracking data yang sudah digunakan
- Berguna jika ingin memulai variasi data dari awal lagi

## 🎯 Contoh Data yang Dihasilkan

```json
{
  "name": "Ahmad Wahyu Siregar",
  "email": "ahmad.wahyu@example.com", 
  "phone": "081234567890",
  "address": "Jl. Sudirman No. 123, Jakarta Pusat",
  "company": "PT Teknologi Indonesia",
  "birthdate": "1995-03-15",
  "website": "https://example.com"
}
```

## 🛠️ Teknologi yang Digunakan

- **HTML5 & CSS3**: Interface extension
- **Vanilla JavaScript**: Logic dan API integration
- **Chrome Extension API**: Akses browser functionality
- **Gemini AI API**: Generate data dengan AI
- **Chrome Manifest V3**: Standard terbaru Chrome extension
- **Element Selection API**: Interactive element picker dengan visual feedback
- **DOM Manipulation**: Scoped form detection dan filling
- **CSS Animations**: Visual feedback untuk element selection dan form filling

## 🔧 Fitur Teknis Terbaru

### Element Selector Engine

- **Interactive Selection**: Point-and-click element selection
- **Visual Feedback**: Real-time highlight dengan animasi
- **Scoped Analysis**: Form detection terbatas pada elemen yang dipilih
- **Smart Validation**: Hanya elemen yang mengandung form fields yang bisa dipilih

### Enhanced Form Detection  

- **DOM Validation**: Robust error handling untuk berbagai jenis website
- **Dynamic Scoping**: Automatic atau manual scope selection
- **Field Type Inference**: AI-powered field type detection
- **Cross-Framework Support**: Kompatibel dengan React, Vue, Angular, dan vanilla JS

### Improved UI/UX

- **Always-Visible Controls**: Tombol control yang persistent dan mudah diakses
- **Smart Button States**: Dynamic button enabling/disabling berdasarkan context
- **Visual Indicators**: Clear feedback untuk setiap action
- **Responsive Design**: Interface yang adaptif untuk berbagai ukuran popup

## 📁 Struktur File

```plaintext
auto-filler-extension/
├── manifest.json                    # Extension configuration
├── src/                            # Source code directory
│   ├── popup/                      # Popup interface files
│   │   ├── popup.html              # Extension popup interface  
│   │   ├── popup.css               # Popup styling
│   │   └── popup.js                # Popup logic & element selector
│   ├── content/                    # Content scripts
│   │   └── content.js              # Form detection & element selection
│   └── background/                 # Background scripts
│       └── background.js           # Background service worker
├── assets/                         # Asset files
│   ├── icons/                      # Extension icons
│   │   ├── icon16.png              # Extension icon 16x16
│   │   ├── icon48.png              # Extension icon 48x48
│   │   └── icon128.png             # Extension icon 128x128
│   └── images/                     # Additional images
├── docs/                           # Documentation
│   ├── INSTALL_GUIDE.md            # Installation guide
│   └── ICON_INSTRUCTIONS.md        # Icon instructions
└── README.md                       # Main documentation
```

## 🔧 Pengembangan

### Prerequisites

- Google Chrome browser
- Gemini API Key
- Text editor (VS Code recommended)

### Setup Development

1. Clone repository
2. Buka Chrome Extensions (`chrome://extensions/`)
3. Enable Developer mode
4. Load unpacked extension
5. Edit file sesuai kebutuhan
6. Reload extension untuk test perubahan

## 🚨 Permissions yang Dibutuhkan

Extension ini membutuhkan permissions berikut:

- **storage**: Menyimpan API key dan settings
- **activeTab**: Akses tab yang sedang aktif
- **scripting**: Inject script untuk deteksi form
- **host_permissions**: Akses Gemini API

## ⚠️ Catatan Keamanan

- API Key disimpan secara lokal di browser
- Tidak ada data yang dikirim ke server selain ke Gemini API
- Gunakan hanya untuk testing, jangan untuk data sensitive
- API Key bersifat pribadi, jangan bagikan ke orang lain

## 🤝 Kontribusi

Kontribusi sangat welcome! Silakan:

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add some amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

### 🌿 Branch Information

- **main**: Stable production branch
- **feature/element-selector**: Latest development dengan Element Selector features
- Buat feature branch baru dari `main` untuk kontribusi

### 🛠️ Development Workflow

1. Clone repository: `git clone https://github.com/Wahyusrg0819/auto-filler-ai-extension.git`
2. Install dependencies (jika ada)
3. Load extension di Chrome untuk testing
4. Buat perubahan dan test thoroughly
5. Commit dengan conventional commit messages
6. Push dan buat PR ke main branch

## 📄 Lisensi

MIT License - silakan gunakan untuk keperluan pribadi maupun komersial.

## � Changelog

### v2.0.0 - Element Selector Update (Latest)

- ✨ **NEW**: Element Selector - Pilih elemen spesifik untuk analisis terfokus
- ✨ **NEW**: Visual feedback dengan highlight interaktif
- ✨ **NEW**: Scoped form analysis - hanya dalam elemen yang dipilih
- ✨ **NEW**: Clear highlight button yang selalu tersedia
- 🔧 **IMPROVED**: Enhanced error handling untuk berbagai jenis website
- 🔧 **IMPROVED**: DOM validation untuk kompatibilitas yang lebih baik
- 🔧 **IMPROVED**: UI/UX dengan persistent controls
- 🔧 **IMPROVED**: Reorganisasi struktur folder untuk maintainability

### v1.0.0 - Initial Release

- 🎯 Deteksi form otomatis
- 🧠 AI-powered data generation dengan Gemini
- 🇮🇩 Data format Indonesia
- 📊 Smart tracking dan variasi data
- 🎨 Modern UI design

## �👨‍💻 Developer

Dibuat oleh **Wahyu Muliadi Siregar**

- Mahasiswa Teknik Informatika
- Universitas Islam Riau
- Semester 7

---

**Disclaimer**: Extension ini dibuat untuk keperluan educational dan testing. Pastikan untuk tidak menggunakan data pribadi yang sesungguhnya saat testing.
