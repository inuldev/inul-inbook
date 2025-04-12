# Panduan Pengembangan Aplikasi Social Media

Dokumen ini berisi panduan untuk pengembangan aplikasi social media, melengkapi informasi struktur yang ada di [STRUCTURE.md](STRUCTURE.md).

## Arsitektur Aplikasi

Aplikasi ini menggunakan arsitektur client-server dengan:

1. **Frontend**: Next.js 14 dengan App Router
2. **Backend**: Express.js dengan MongoDB
3. **Autentikasi**: JWT dan Google OAuth
4. **Penyimpanan Media**: Cloudinary

## Teknologi yang Digunakan

### Frontend

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Komponen UI**: Shadcn/UI (berbasis Radix UI)
- **State Management**: Zustand
- **Form Handling**: React Hook Form dengan Yup
- **Tema**: next-themes (dukungan tema gelap/terang)
- **Notifikasi**: react-hot-toast

### Backend

- **Framework**: Express.js
- **Database**: MongoDB dengan Mongoose ODM
- **Autentikasi**: JWT, Passport.js, Google OAuth
- **Penyimpanan Media**: Cloudinary
- **Keamanan**: Helmet, CORS, bcryptjs
- **Logging**: Morgan

## Struktur Kode

### Frontend

Frontend menggunakan Next.js 14 dengan App Router, yang memungkinkan routing berbasis file dan server components.

#### Komponen Utama

1. **Layout**: `src/app/layout.js` - Layout utama yang membungkus seluruh aplikasi
2. **Halaman Utama**: `src/app/page.js` - Halaman beranda aplikasi
3. **Komponen Auth**: `src/app/components/AuthProvider.jsx` - Provider autentikasi
4. **Sidebar**: `src/app/components/LeftSideBar.jsx` dan `src/app/components/RightSideBar.jsx` - Sidebar kiri dan kanan
5. **Komponen Dasar**: `src/components/shared/BaseCard.jsx` - Komponen dasar untuk card

#### State Management

Aplikasi menggunakan Zustand untuk state management dengan beberapa store:

1. **userStore**: Menyimpan informasi pengguna yang sedang login
2. **postStore**: Mengelola state untuk post
3. **storyStore**: Mengelola state untuk story
4. **friendNotificationStore**: Mengelola notifikasi pertemanan
5. **sidebarStore**: Mengelola state sidebar

#### Routing

Routing menggunakan Next.js App Router dengan struktur folder:

1. `/user-login` - Halaman login
2. `/user-register` - Halaman registrasi
3. `/user-profile` - Halaman profil pengguna
4. `/posts` - Halaman post
5. `/friends-list` - Halaman daftar teman
6. `/video-feed` - Halaman feed video
7. `/story` - Halaman story

### Backend

Backend menggunakan Express.js dengan struktur MVC (Model-View-Controller).

#### Model

Model menggunakan Mongoose untuk mendefinisikan skema dan interaksi dengan MongoDB:

1. **User.js**: Model pengguna dengan informasi profil
2. **Post.js**: Model post dengan dukungan untuk teks, gambar, dan video
3. **Comment.js**: Model komentar untuk post
4. **Story.js**: Model story dengan durasi 24 jam
5. **FriendRequest.js**: Model permintaan pertemanan
6. **Bio.js**: Model bio pengguna

#### Controller

Controller menangani logika bisnis aplikasi:

1. **authController.js**: Menangani autentikasi (login, register, logout)
2. **userController.js**: Menangani operasi pengguna (profil, update)
3. **postController.js**: Menangani operasi post (create, read, update, delete)
4. **storyController.js**: Menangani operasi story
5. **friendController.js**: Menangani operasi pertemanan

#### Routes

Routes mendefinisikan endpoint API:

1. **authRoutes.js**: `/api/auth` - Endpoint autentikasi
2. **userRoutes.js**: `/api/users` - Endpoint pengguna
3. **postRoutes.js**: `/api/posts` - Endpoint post
4. **storyRoutes.js**: `/api/stories` - Endpoint story
5. **friendRoutes.js**: `/api/friends` - Endpoint pertemanan

## Alur Pengembangan

### Menambahkan Fitur Baru

1. **Backend**:

   - Buat model jika diperlukan
   - Buat controller dengan metode CRUD
   - Buat routes untuk mengekspos API
   - Uji API dengan Postman atau alat serupa

2. **Frontend**:
   - Buat service untuk berkomunikasi dengan API
   - Buat store jika diperlukan untuk state management
   - Buat komponen UI
   - Integrasikan dengan halaman yang sesuai

### Konvensi Penamaan

1. **Files**:

   - Komponen React: PascalCase (contoh: `UserProfile.jsx`)
   - Utilitas: camelCase (contoh: `authUtils.js`)
   - Halaman: kebab-case (contoh: `user-profile`)

2. **Variabel dan Fungsi**:

   - Gunakan camelCase (contoh: `getUserData`)
   - Gunakan nama yang deskriptif

3. **Komponen**:
   - Gunakan PascalCase (contoh: `<UserProfile />`)

## Fitur Utama

### Autentikasi

Aplikasi mendukung dua metode autentikasi:

1. **Email/Password**: Menggunakan JWT
2. **Google OAuth**: Menggunakan Passport.js

### Post

Fitur post mendukung:

1. **Teks**: Post teks biasa
2. **Gambar**: Upload gambar (JPG, PNG, GIF, WebP) hingga 10MB
3. **Video**: Upload video hingga 100MB
4. **Like**: Fitur like post
5. **Komentar**: Fitur komentar pada post
6. **Balasan Komentar**: Fitur membalas komentar (reply comment)
7. **Privasi**: Pengaturan privasi post (publik, teman, privat)
8. **Pengelolaan Media**: Media di Cloudinary akan otomatis dihapus saat post dihapus atau diperbarui

### Story

Fitur story mendukung:

1. **Gambar/Video**: Upload gambar (JPG, PNG, GIF, WebP) atau video hingga 5MB
2. **Durasi**: Kedaluwarsa setelah 24 jam
3. **Viewer**: Pelacakan jumlah tampilan
4. **Pengelolaan Media**: Media di Cloudinary akan otomatis dihapus saat story dihapus atau kedaluwarsa

### Pertemanan

Fitur pertemanan mendukung:

1. **Permintaan Pertemanan**: Kirim/terima permintaan pertemanan
2. **Daftar Teman**: Lihat daftar teman
3. **Saran Teman**: Saran teman berdasarkan koneksi

### Profil Pengguna

Fitur profil pengguna mendukung:

1. **Info Dasar**: Nama, email, foto profil (JPG, PNG, GIF, WebP)
2. **Bio**: Informasi tambahan tentang pengguna
3. **Post**: Daftar post pengguna
4. **Teman**: Daftar teman pengguna
5. **Pengelolaan Media**: Foto profil di Cloudinary akan otomatis dihapus saat diperbarui

## Lingkungan Pengembangan

### Pengaturan Lingkungan

Aplikasi mendukung dua lingkungan:

1. **Development**: Untuk pengembangan lokal
2. **Production**: Untuk deployment

Untuk beralih antara lingkungan, gunakan script:

```bash
# Beralih ke development
npm run switch:dev

# Beralih ke production
npm run switch:prod
```

### Variabel Lingkungan

#### Backend (.env)

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

#### Frontend (.env)

```
NEXT_PUBLIC_BACKEND_URL=your_backend_url
NEXT_PUBLIC_FRONTEND_URL=your_frontend_url
NODE_ENV=development_or_production
NEXT_PUBLIC_APP_ENV=development_or_production
```

## Deployment

Aplikasi ini dirancang untuk di-deploy ke Vercel dengan plan Hobby (gratis).

### Frontend

1. Set root directory ke `frontend`
2. Set environment variables dari `.env.production`
3. Pastikan `NEXT_PUBLIC_BACKEND_URL` mengarah ke URL backend

### Backend

1. Set root directory ke `backend`
2. Set environment variables dari `.env.production`
3. Pastikan `FRONTEND_URL` mengarah ke URL frontend

## Praktik Terbaik

### Keamanan

1. Gunakan HTTPS untuk semua komunikasi
2. Validasi input di sisi server dan client
3. Gunakan sanitasi untuk mencegah XSS
4. Jangan menyimpan rahasia di kode sumber

### Performa

1. Gunakan lazy loading untuk gambar dan komponen
2. Optimalkan query database
3. Gunakan caching untuk data yang sering diakses
4. Minimalkan ukuran bundle JavaScript

### Pengujian

1. Tulis unit test untuk fungsi penting
2. Lakukan pengujian integrasi untuk API
3. Lakukan pengujian end-to-end untuk alur pengguna penting

## Troubleshooting

### Masalah Umum

1. **Koneksi MongoDB gagal**:

   - Periksa URI MongoDB
   - Pastikan IP address diizinkan di MongoDB Atlas
   - Verifikasi konektivitas jaringan

2. **Upload Cloudinary tidak berfungsi**:

   - Verifikasi kredensial Cloudinary di file .env
   - Periksa apakah Anda memiliki penyimpanan yang cukup di akun Cloudinary
   - Pastikan ukuran file dalam batas yang ditentukan

3. **Google OAuth tidak berfungsi**:

   - Verifikasi kredensial Google OAuth
   - Pastikan URL callback cocok dengan yang dikonfigurasi di Google Developer Console
   - Periksa apakah URI redirect diizinkan di Google Developer Console

4. **Masalah autentikasi JWT**:
   - Pastikan JWT_SECRET diatur di file .env
   - Periksa apakah token dikirim dengan benar dalam permintaan
   - Verifikasi bahwa cookie diaktifkan di browser

## Kesimpulan

Dokumen ini memberikan panduan komprehensif untuk pengembangan aplikasi social media. Gunakan bersama dengan [STRUCTURE.md](STRUCTURE.md) untuk memahami struktur aplikasi secara menyeluruh.

Untuk pertanyaan atau masalah, silakan buka issue di repositori GitHub.
