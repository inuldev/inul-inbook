# Sistem Autentikasi

## Pendekatan Autentikasi

Sistem autentikasi aplikasi ini menggunakan pendekatan berikut:

1. **Penyimpanan Token**:
   - **Cookies**: Metode utama untuk menyimpan token autentikasi
     - `token` (produksi) atau `dev_token` (development): Menyimpan JWT token
     - `auth_status` (produksi) atau `dev_auth_status` (development): Menandakan status login
   - **LocalStorage**: Metode backup untuk menyimpan token
     - `auth_token`: Menyimpan token autentikasi
     - `auth_token_backup`: Backup token autentikasi
     - `auth_user`: Menyimpan data pengguna

2. **Metode Autentikasi**:
   - **Email/Password**: Login tradisional dengan email dan password
   - **Google OAuth**: Login dengan akun Google

## Alur Autentikasi

### Login dengan Email/Password

1. Pengguna memasukkan email dan password di halaman login
2. Frontend mengirim request ke backend untuk autentikasi
3. Backend memvalidasi kredensial dan mengembalikan token JWT
4. Frontend menyimpan token di cookies dan localStorage
5. Frontend mengambil data pengguna menggunakan token
6. Pengguna diarahkan ke halaman utama

### Login dengan Google OAuth

1. Pengguna mengklik tombol "Login with Google"
2. Frontend mengarahkan pengguna ke endpoint Google OAuth
3. Pengguna memberikan izin ke aplikasi Google
4. Google mengarahkan pengguna kembali ke callback URL aplikasi
5. Backend memproses callback dan mengembalikan token JWT
6. Frontend menyimpan token di cookies dan localStorage
7. Frontend mengambil data pengguna menggunakan token
8. Pengguna diarahkan ke halaman utama

### Logout

1. Pengguna mengklik tombol logout
2. Frontend mengirim request ke backend untuk logout
3. Frontend menghapus token dari cookies dan localStorage
4. Pengguna diarahkan ke halaman login

## Komponen Utama

1. **AuthProvider.jsx**: Provider autentikasi utama yang memeriksa status autentikasi
2. **userStore.js**: Store Zustand untuk menyimpan state pengguna dan fungsi autentikasi
3. **authUtils.js**: Utilitas untuk manajemen token dan autentikasi
4. **cookieUtils.js**: Utilitas untuk manajemen cookie
5. **middleware.js**: Middleware Next.js untuk proteksi rute

## Penanganan Cross-Domain

Untuk menangani masalah cross-domain, sistem menggunakan pendekatan berikut:

1. **Produksi**:
   - Menggunakan `SameSite=None` dan `Secure=true` untuk cookie
   - Menggunakan `token` dan `auth_status` sebagai nama cookie

2. **Development**:
   - Menggunakan `SameSite=Lax` untuk cookie
   - Menggunakan `dev_token` dan `dev_auth_status` sebagai nama cookie

## Pencegahan Loop Redirect

Untuk mencegah loop redirect, sistem menggunakan parameter `noredirect` saat melakukan redirect setelah login atau logout.

## Debugging

Sistem menyediakan beberapa alat debugging:

1. **authDebug.js**: Utilitas untuk menampilkan informasi debug autentikasi
2. **Logging**: Logging komprehensif untuk memudahkan debugging

## Pedoman Pengembangan

1. **Konsistensi**: Gunakan pendekatan yang konsisten untuk penyimpanan token
2. **Penanganan Error**: Selalu tangani error dengan baik dan berikan pesan yang jelas
3. **Pengujian**: Uji autentikasi di berbagai browser dan perangkat
4. **Dokumentasi**: Perbarui dokumentasi setiap kali ada perubahan
