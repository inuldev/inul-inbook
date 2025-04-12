# Perubahan dan Penambahan Fitur

Dokumen ini berisi ringkasan perubahan dan penambahan fitur yang telah dilakukan untuk memenuhi permintaan pengguna.

## 1. Fitur Reply Comment (Balasan Komentar)

Fitur balasan komentar telah ditambahkan ke aplikasi dengan fungsionalitas berikut:

### API Endpoints

- **POST** `/api/posts/:postId/comments/:commentId/replies` - Menambahkan balasan pada komentar
- **GET** `/api/posts/:postId/comments/:commentId/replies` - Mendapatkan balasan untuk sebuah komentar
- **DELETE** `/api/posts/:postId/comments/:commentId/replies/:replyId` - Menghapus balasan komentar

### Struktur Data

Komentar sekarang memiliki array `replies` yang berisi balasan-balasan untuk komentar tersebut. Setiap balasan memiliki referensi ke `parentComment` yang menunjukkan komentar induk.

### UI/UX

- Balasan komentar ditampilkan dengan indentasi di bawah komentar induk
- Tombol "Balas" pada setiap komentar untuk memulai balasan
- Tampilan jumlah balasan pada komentar

## 2. Dukungan Format WebP

Format gambar WebP telah ditambahkan ke aplikasi dengan dukungan penuh di semua fitur yang melibatkan upload gambar:

### Fitur yang Mendukung WebP

- Upload gambar post (hingga 10MB)
- Upload gambar story (hingga 5MB)
- Upload foto profil
- Upload foto sampul

### Keuntungan WebP

- Ukuran file lebih kecil dengan kualitas yang sama dibandingkan format JPG/PNG
- Mendukung transparansi seperti PNG
- Mendukung animasi seperti GIF
- Performa loading yang lebih baik

## 3. Pengelolaan Media di Cloudinary

Pengelolaan media di Cloudinary telah ditingkatkan untuk memastikan sinkronisasi yang baik antara aplikasi dan penyimpanan cloud:

### Fitur Pengelolaan Media

- **Penghapusan Otomatis**: Media di Cloudinary akan otomatis dihapus saat:
  - Post dihapus
  - Post diperbarui dengan media baru
  - Story dihapus
  - Story kedaluwarsa (setelah 24 jam)
  - Foto profil diperbarui

- **Pembaruan Otomatis**: Saat media diperbarui, media lama akan dihapus dan digantikan dengan media baru

### API Endpoints yang Diperbarui

- **DELETE** `/api/posts/:id` - Sekarang menghapus media terkait di Cloudinary
- **PUT** `/api/posts/:id` - Sekarang menghapus media lama di Cloudinary jika media baru diunggah
- **DELETE** `/api/stories/:id` - Sekarang menghapus media terkait di Cloudinary
- **PUT** `/api/users/me/profile-picture` - Sekarang menghapus foto profil lama di Cloudinary

### Respons API yang Diperbarui

Respons API sekarang menyertakan informasi tentang penghapusan media:

```json
{
  "success": true,
  "message": "Post deleted successfully",
  "mediaDeleted": true
}
```

## 4. Dokumentasi yang Diperbarui

Semua dokumentasi telah diperbarui untuk mencerminkan fitur-fitur baru:

- **API_DOCUMENTATION.md** - Dokumentasi API untuk fitur reply comment dan pengelolaan media
- **DEVELOPMENT_GUIDE.md** - Panduan pengembangan yang mencakup fitur-fitur baru
- **README-ID.md** - Readme dalam bahasa Indonesia yang diperbarui
- **ROADMAP.md** - Roadmap pengembangan yang diperbarui
- **TESTING.md** - Panduan pengujian yang mencakup fitur-fitur baru

## 5. Batasan dan Konfigurasi

Batasan dan konfigurasi telah diperbarui:

- Ukuran maksimum upload gambar (JPG, PNG, GIF, WebP): 10MB
- Ukuran maksimum upload video: 100MB
- Ukuran maksimum upload story (gambar/video): 5MB

## Kesimpulan

Dengan penambahan fitur reply comment, dukungan format WebP, dan peningkatan pengelolaan media di Cloudinary, aplikasi media sosial ini sekarang memiliki fungsionalitas yang lebih lengkap dan efisien. Pengguna dapat berinteraksi lebih baik melalui balasan komentar, menikmati performa yang lebih baik dengan format WebP, dan tidak perlu khawatir tentang pengelolaan media karena semua dilakukan secara otomatis.
