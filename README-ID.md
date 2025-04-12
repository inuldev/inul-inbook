# ✨ Aplikasi Media Sosial ✨

Proyek ini adalah aplikasi media sosial lengkap mirip dengan Facebook yang memungkinkan pengguna untuk berbagi pemikiran, pengalaman, dan media dengan orang lain. Aplikasi ini dibangun dengan teknologi modern, termasuk Next.js 14, Tailwind CSS, Shadcn/UI, dan Zustand untuk manajemen state di frontend, serta Node.js/Express.js dengan MongoDB di backend.

## 🚀 Memulai

Untuk memulai dengan proyek ini, ikuti langkah-langkah berikut:

### Prasyarat

- Node.js (v18 atau lebih tinggi)
- MongoDB (lokal atau Atlas)
- Akun Cloudinary untuk penyimpanan media
- Akun Google Developer (untuk OAuth)

### Instalasi

1. Clone repositori

```bash
git clone https://github.com/inuldev/inul-inbook.git
cd social-media-app
```

2. Siapkan variabel lingkungan

Buat file `.env` di direktori backend dan frontend menggunakan file `.env.example` yang disediakan sebagai template.

#### Setup Backend

```bash
cd backend
npm install

# Buat file .env dengan konfigurasi Anda
cp .env.example .env
# Edit file .env dengan kredensial Anda

# Mulai server pengembangan
npm run dev
```

#### Setup Frontend

```bash
cd frontend
npm install

# Buat file .env dengan konfigurasi Anda
cp .env.example .env
# Edit file .env dengan kredensial Anda

# Mulai server pengembangan
npm run dev
```

### Mengakses Aplikasi

Setelah kedua server berjalan:

- API Backend: http://localhost:8000
- Frontend: http://localhost:3000

### Menjalankan di Lingkungan Berbeda

Aplikasi mendukung mode pengembangan dan produksi. Berikut cara beralih di antara keduanya:

#### Menggunakan Script Pengalihan Lingkungan

```bash
# Beralih ke mode pengembangan
npm run switch:dev

# Beralih ke mode produksi
npm run switch:prod
```

#### Konfigurasi Lingkungan Manual

1. Salin file .env yang sesuai:

   ```bash
   # Untuk pengembangan
   cp .env.development.example .env

   # Untuk produksi
   cp .env.production.example .env
   ```

2. Mulai aplikasi dengan perintah yang sesuai:

   ```bash
   # Mode pengembangan
   npm run dev

   # Mode produksi
   npm run dev:prod
   ```

## 🔑 Pengaturan Lingkungan

Pastikan Anda telah mengatur variabel lingkungan berikut:

### Backend (.env)

```
PORT=8000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_random_secret
SESSION_SECRET=your_random_secret
LOG_LEVEL=error
JWT_EXPIRES_IN=30d
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=your_frontend_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_google_callback_url
NODE_ENV=development_or_production
```

### Frontend (.env)

```
NEXT_PUBLIC_BACKEND_URL=your_backend_url
NEXT_PUBLIC_FRONTEND_URL=your_frontend_url
NODE_ENV=development_or_production
NEXT_PUBLIC_APP_ENV=development_or_production
```

### Pengaturan Cloudinary

Aplikasi ini menggunakan Cloudinary untuk penyimpanan media. Anda perlu:

1. Membuat akun Cloudinary di [cloudinary.com](https://cloudinary.com/)
2. Mendapatkan Cloud Name, API Key, dan API Secret dari dashboard
3. Menambahkan kredensial ini ke file .env backend Anda

Aplikasi dikonfigurasi untuk menangani:

- Stories: Gambar/video hingga 4MB
- Gambar post: Hingga 10MB
- Video post: Hingga 100MB

## 🚀 Deploy ke Vercel (Plan Hobby)

Aplikasi ini dirancang untuk di-deploy ke plan hobby Vercel tanpa memerlukan kartu kredit. Ikuti langkah-langkah berikut untuk men-deploy aplikasi Anda:

### Deployment Frontend

1. **Buat Akun Vercel**:

   - Daftar di [vercel.com](https://vercel.com) menggunakan GitHub, GitLab, atau email

2. **Import Repositori Anda**:

   - Dari dashboard Vercel, klik "Add New" > "Project"
   - Pilih repositori Anda dan klik "Import"

3. **Konfigurasi Proyek**:

   - **Framework Preset**: Pilih "Next.js"
   - **Root Directory**: Atur ke `frontend`
   - **Build Command**: Biarkan default (`npm run build`)
   - **Output Directory**: Biarkan default (`.next`)

4. **Variabel Lingkungan**:

   - Tambahkan semua variabel dari file `.env.production` Anda
   - Pastikan untuk mengatur `NEXT_PUBLIC_BACKEND_URL` ke URL backend Anda

5. **Deploy**:
   - Klik "Deploy" dan tunggu build selesai

### Deployment Backend

1. **Buat Proyek Baru**:

   - Dari dashboard Vercel, klik "Add New" > "Project"
   - Pilih repositori yang sama dan klik "Import"

2. **Konfigurasi Proyek**:

   - **Framework Preset**: Pilih "Other"
   - **Root Directory**: Atur ke `backend`
   - **Build Command**: `npm install`
   - **Output Directory**: Biarkan kosong
   - **Install Command**: `npm install`

3. **Variabel Lingkungan**:

   - Tambahkan semua variabel dari file `.env.production` Anda
   - Pastikan untuk mengatur `FRONTEND_URL` ke URL frontend Anda
   - Atur `NODE_ENV` ke `production`

4. **Deploy**:
   - Klik "Deploy" dan tunggu build selesai

### Menghubungkan Frontend dan Backend

Setelah kedua deployment selesai:

1. **Perbarui Variabel Lingkungan**:

   - Di pengaturan proyek frontend, atur `NEXT_PUBLIC_BACKEND_URL` ke URL deployment backend Anda
   - Di pengaturan proyek backend, atur `FRONTEND_URL` ke URL deployment frontend Anda

2. **Re-deploy Kedua Proyek**:
   - Picu deployment baru untuk kedua proyek untuk menerapkan variabel lingkungan yang diperbarui

### Batasan Plan Hobby Vercel dan Solusinya

Aplikasi ini mencakup beberapa optimasi untuk plan hobby Vercel:

1. **Batas Payload 4MB**:

   - Upload langsung ke Cloudinary melewati batas 4MB Vercel
   - File besar tidak pernah melewati server Vercel

2. **Timeout Fungsi Serverless (10s)**:

   - Koneksi database dioptimalkan untuk lingkungan serverless
   - Operasi yang berjalan lama dihindari di route API

3. **Waktu Eksekusi Terbatas**:

   - Tugas latar belakang diminimalkan
   - Query database dioptimalkan

4. **Cold Starts**:
   - Connection pooling diimplementasikan untuk mengurangi overhead koneksi database
   - Middleware ringan untuk meningkatkan waktu startup

### Memantau dan Mengatasi Masalah Deployment Vercel

1. **Log Vercel**:

   - Akses log dari dashboard proyek Anda > Deployments > Pilih deployment > Logs
   - Filter log berdasarkan fungsi atau kode status

2. **Masalah Umum**:

   - **Error CORS**: Periksa bahwa konfigurasi CORS Anda menyertakan URL frontend yang benar
   - **Masalah Koneksi Database**: Verifikasi string koneksi MongoDB dan pengaturan akses jaringan
   - **Variabel Lingkungan**: Pastikan semua variabel yang diperlukan diatur dengan benar
   - **Timeout Fungsi**: Cari operasi yang berjalan lama yang melebihi batas 10 detik

3. **Pemantauan Performa**:
   - Gunakan tab "Analytics" di dashboard Vercel Anda
   - Pantau waktu eksekusi fungsi dan penggunaan memori
   - Identifikasi route API yang lambat dan optimalkan

### Fitur Khusus Lingkungan

Aplikasi memiliki perilaku berbeda berdasarkan lingkungan:

#### Mode Pengembangan

- Pesan error detail dan stack trace
- Logging request/response
- Validasi ukuran file yang lebih longgar
- Middleware khusus pengembangan
- Auto-reloading dengan Nodemon

#### Mode Produksi

- Middleware fokus keamanan (Helmet, compression)
- Informasi error terbatas yang diekspos ke klien
- Validasi ukuran file yang ketat
- Console log dihapus dari kode frontend
- Optimasi performa

## ✨ Fitur Proyek

### Fitur Frontend

- **Next.js 14**: Framework React modern dengan server-side rendering dan routing
- **Tailwind CSS**: Framework CSS utility-first untuk desain responsif
- **Shadcn/UI**: Komponen UI berkualitas tinggi yang dibangun di atas Radix UI
- **Zustand**: Manajemen state ringan dengan penyimpanan persisten
- **Desain Responsif**: Antarmuka mobile-friendly yang berfungsi di semua perangkat
- **Komponen BaseCard**: Komponen card standar untuk UI yang konsisten di seluruh aplikasi

### Fitur Backend

- **Node.js/Express.js**: Implementasi server yang cepat dan skalabel
- **MongoDB dengan Mongoose**: Database dokumen fleksibel dengan ODM yang kuat
- **Autentikasi JWT**: Autentikasi aman dengan sesi berbasis token
- **Google OAuth**: Integrasi login sosial
- **Integrasi Cloudinary**: Penyimpanan media berbasis cloud dengan dukungan upload langsung

### Fitur Utama

1. **Manajemen Pengguna**:

   - Registrasi dan login dengan email/password
   - Integrasi Google OAuth
   - Kustomisasi profil dengan bio, foto profil, dan foto sampul
   - Sistem follow/unfollow

2. **Post dan Konten**:

   - Buat post teks dengan pengaturan privasi
   - Upload gambar (JPG, PNG, GIF, WebP hingga 10MB) dan video (hingga 100MB)
   - Fungsionalitas like, komentar, dan balasan komentar
   - Pengelolaan media otomatis di Cloudinary (penghapusan saat post dihapus/diperbarui)
   - Feed dengan post dari pengguna yang diikuti

3. **Stories**:

   - Buat konten sementara yang kedaluwarsa setelah 24 jam
   - Dukungan untuk gambar (JPG, PNG, GIF, WebP) dan video (hingga 5MB)
   - Pengelolaan media otomatis di Cloudinary (penghapusan saat story dihapus/kedaluwarsa)
   - Pelacakan jumlah tampilan

4. **Antarmuka Pengguna**:

   - Dukungan tema gelap/terang
   - Desain responsif untuk mobile dan desktop
   - Update real-time untuk like dan komentar
   - Infinite scrolling untuk feed konten

5. **Profil dan Penemuan**:
   - Profil pengguna detail dengan informasi bio
   - Fungsionalitas pencarian pengguna
   - Manajemen teman/pengikut

## 🔧 Troubleshooting

### Masalah Umum

1. **Koneksi ke MongoDB gagal**

   - Periksa apakah URI MongoDB Anda benar
   - Pastikan alamat IP Anda diizinkan di MongoDB Atlas
   - Verifikasi konektivitas jaringan

2. **Upload Cloudinary tidak berfungsi**

   - Verifikasi kredensial Cloudinary Anda di file .env
   - Periksa apakah Anda memiliki penyimpanan yang cukup di akun Cloudinary Anda
   - Pastikan ukuran file berada dalam batas yang ditentukan

3. **Google OAuth tidak berfungsi**

   - Verifikasi kredensial Google OAuth Anda
   - Pastikan URL callback cocok persis dengan yang dikonfigurasi di Google Developer Console
   - Periksa apakah URI redirect diizinkan di Google Developer Console

4. **Masalah autentikasi JWT**

   - Pastikan JWT_SECRET diatur di file .env Anda
   - Periksa apakah token dikirim dengan benar dalam permintaan
   - Verifikasi bahwa cookie diaktifkan di browser Anda

5. **Masalah fungsionalitas like/unlike**
   - Periksa konsol browser untuk error
   - Verifikasi bahwa pengguna sudah login
   - Pastikan ID post benar
   - Periksa apakah post ada di database

## 📚 Struktur Proyek

Proyek ini mengikuti struktur modular untuk memastikan kemudahan pemeliharaan dan skalabilitas. Untuk tampilan detail struktur proyek, lihat [STRUCTURE.md](STRUCTURE.md).

Untuk panduan pengembangan lebih lanjut, lihat [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md).

### Struktur Backend

```
backend/
├── config/         # File konfigurasi (DB, Cloudinary)
├── controllers/    # Controller route
├── middleware/     # Middleware kustom
├── model/          # Model Mongoose
├── routes/         # Route API
└── index.js        # Entry point
```

### Struktur Frontend

```
frontend/
├── public/         # File statis
├── src/
│   ├── app/        # Direktori app Next.js (halaman dan route)
│   ├── components/ # Komponen UI
│   │   ├── shared/ # Komponen bersama (BaseCard, MediaCard, dll.)
│   │   └── ui/     # Komponen Shadcn/UI
│   ├── lib/        # Fungsi utilitas dan helper
│   └── store/      # Store Zustand
└── next.config.js  # Konfigurasi Next.js
```

## 👍 Kontribusi

Kontribusi sangat diterima! Silakan kirimkan Pull Request.

1. Fork repositori
2. Buat branch fitur Anda (`git checkout -b feature/fitur-keren`)
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur keren'`)
4. Push ke branch (`git push origin feature/fitur-keren`)
5. Buka Pull Request

## 💾 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT - lihat file LICENSE untuk detail.

## 👋 Kesimpulan

Aplikasi media sosial ini menyediakan fondasi yang solid untuk membangun platform mirip Facebook. Aplikasi ini mencakup semua fitur penting seperti autentikasi, post, story, dan interaksi pengguna. Aplikasi telah direfaktor untuk menggunakan struktur yang lebih modular dan mudah dipelihara, dengan komponen standar dan implementasi yang konsisten di seluruh codebase.

Untuk pertanyaan atau masalah, silakan buka issue di repositori GitHub.
