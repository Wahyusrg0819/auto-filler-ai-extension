# 🤖 Auto Filler AI - Chrome Extension

Ekstensi Chrome yang menggunakan Gemini AI untuk mengisi form secara otomatis. Sempurna untuk developer yang sering melakukan testing form.

## ✨ Fitur

- 🎯 **Deteksi Form Otomatis**: Mendeteksi semua field form di halaman web
- 🧠 **AI-Powered**: Menggunakan Gemini AI untuk generate data yang realistis
- � **Data Bervariasi**: Setiap pengisian menghasilkan data yang berbeda dan unik
- �🇮🇩 **Data Indonesia**: Generate data yang sesuai dengan format Indonesia
- ⚡ **Cepat & Mudah**: Isi form hanya dengan 2 klik
- 🔧 **Developer-Friendly**: Khusus dibuat untuk kebutuhan testing developer
- 📊 **Smart Tracking**: Mengingat data yang sudah digunakan untuk variasi maksimal
- 🎨 **UI Modern**: Interface yang clean dan mudah digunakan

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

### 1. Analisis Form

1. Buka halaman web yang memiliki form
2. Klik icon **Auto Filler AI** di Chrome toolbar
3. Klik tombol **📊 Analisis Form**
4. Extension akan mendeteksi semua field yang dapat diisi
5. **Troubleshooting**: Jika tombol "Isi Form dengan AI" tidak aktif, gunakan tombol **🔍 Debug Form** untuk melihat detail deteksi

### 2. Isi Form dengan AI

1. Setelah form dianalisis, klik **✨ Isi Form dengan AI**
2. AI akan generate data yang sesuai untuk setiap field
3. Form akan terisi secara otomatis

### 3. Kosongkan Form

- Klik **🗑️ Kosongkan Form** untuk menghapus semua isi form

### 4. Debug Form (Fitur Troubleshooting)

- Klik **🔍 Debug Form** untuk melihat informasi detail tentang form
- Berguna untuk troubleshooting jika form tidak terdeteksi dengan benar

### 5. Reset Variasi Data

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

## 📁 Struktur File

auto-filler-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface  
├── popup.css              # Popup styling
├── popup.js               # Popup logic
├── content.js             # Content script for form detection
├── background.js          # Background service worker
├── icon16.png             # Extension icon 16x16
├── icon48.png             # Extension icon 48x48
├── icon128.png            # Extension icon 128x128
└── README.md              # Documentation

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
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## 📄 Lisensi

MIT License - silakan gunakan untuk keperluan pribadi maupun komersial.

## 👨‍💻 Developer

Dibuat oleh **Wahyu Muliadi Siregar**

- Mahasiswa Teknik Informatika
- Universitas Islam Riau
- Semester 7

---

**Disclaimer**: Extension ini dibuat untuk keperluan educational dan testing. Pastikan untuk tidak menggunakan data pribadi yang sesungguhnya saat testing.
