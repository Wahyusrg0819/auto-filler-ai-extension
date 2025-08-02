# 📦 Panduan Instalasi Auto Filler AI Extension

## Langkah 1: Persiapan File

1. **Download semua file extension** ke folder `auto-filler-extension`
2. **Buat file icon** (lihat ICON_INSTRUCTIONS.md) atau gunakan placeholder sementara
3. **Pastikan struktur folder benar**:

   ```plaintext
   auto-filler-extension/
   ├── manifest.json
   ├── popup.html
   ├── popup.css
   ├── popup.js
   ├── content.js
   ├── background.js
   ├── icon16.png
   ├── icon48.png
   ├── icon128.png
   └── README.md
   ```

## Langkah 2: Install Extension ke Chrome

1. **Buka Google Chrome**
2. **Ketik di address bar**: `chrome://extensions/`
3. **Aktifkan Developer Mode**: Toggle di pojok kanan atas
4. **Klik "Load unpacked"**: Tombol di kiri atas
5. **Pilih folder**: Pilih folder `auto-filler-extension`
6. **Klik "Select Folder"**

## Langkah 3: Verifikasi Instalasi

✅ Extension muncul di daftar extensions  
✅ Icon extension muncul di Chrome toolbar  
✅ Tidak ada error di extension list  
✅ Badge biru muncul di icon saat ada form di halaman  

## Langkah 4: Setup API Key Gemini

1. **Buka Google AI Studio**: <https://aistudio.google.com/app/apikey>
2. **Login dengan Google account**
3. **Create API Key**: Klik "Create API Key"
4. **Copy API Key**: Simpan di tempat aman
5. **Buka extension popup**: Klik icon di Chrome toolbar
6. **Masukkan API Key**: Paste di field API Key
7. **Save**: Klik tombol save (💾)

## Langkah 5: Testing Extension

1. **Buka halaman dengan form**: Misalnya form pendaftaran
2. **Klik icon extension**: Di Chrome toolbar
3. **Analisis form**: Klik "📊 Analisis Form"
4. **Isi form**: Klik "✨ Isi Form dengan AI"
5. **Verifikasi**: Form terisi dengan data yang sesuai

## Troubleshooting

### ❌ Extension tidak muncul

- Pastikan semua file ada di folder
- Periksa console errors di chrome://extensions/
- Coba reload extension

### ❌ API Key error

- Periksa API Key benar
- Pastikan API Key aktif di Google AI Studio
- Cek koneksi internet

### ❌ Form tidak terdeteksi

- Refresh halaman web
- Pastikan halaman memiliki form input
- Coba analisis ulang

### ❌ Data tidak sesuai

- Form terlalu complex untuk AI
- Coba clear dan isi ulang
- Manual edit data yang tidak sesuai

## ✅ Extension Siap Digunakan

Selamat! Extension Auto Filler AI sudah siap membantu testing form Anda.

**Tips Penggunaan:**

- Gunakan untuk testing, bukan data real
- API Key jangan dibagikan
- Clear form sebelum submit real data
- Sesuaikan data manual jika perlu

---
