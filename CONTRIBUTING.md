# Panduan Kontribusi

Terima kasih telah mempertimbangkan untuk berkontribusi pada proyek Aplikasi Media Sosial ini! Panduan ini akan membantu Anda memahami proses kontribusi dan standar kode yang kami harapkan.

## Alur Kerja Kontribusi

1. **Fork Repositori**
   - Fork repositori ini ke akun GitHub Anda

2. **Clone Repositori**
   ```bash
   git clone https://github.com/username-anda/social-media-app.git
   cd social-media-app
   ```

3. **Buat Branch Baru**
   ```bash
   git checkout -b feature/nama-fitur
   ```
   atau
   ```bash
   git checkout -b fix/nama-perbaikan
   ```

4. **Lakukan Perubahan**
   - Buat perubahan yang diperlukan
   - Pastikan kode Anda mengikuti standar kode proyek

5. **Commit Perubahan**
   ```bash
   git commit -m "Deskripsi singkat tentang perubahan"
   ```

6. **Push ke GitHub**
   ```bash
   git push origin feature/nama-fitur
   ```

7. **Buat Pull Request**
   - Buka repositori GitHub Anda
   - Klik "New Pull Request"
   - Pilih branch Anda dan target branch di repositori utama
   - Berikan deskripsi yang jelas tentang perubahan Anda
   - Submit pull request

## Standar Kode

### JavaScript/React

- Gunakan ES6+ syntax
- Gunakan destructuring untuk props
- Gunakan functional components dengan hooks
- Hindari penggunaan class components kecuali diperlukan
- Gunakan PropTypes atau TypeScript untuk type checking

### CSS/Styling

- Gunakan Tailwind CSS untuk styling
- Hindari inline styles kecuali diperlukan
- Gunakan variabel CSS untuk warna dan ukuran yang konsisten

### Penamaan

- **Files**:
  - Komponen React: PascalCase (contoh: `UserProfile.jsx`)
  - Utilitas: camelCase (contoh: `authUtils.js`)
  - Halaman: kebab-case (contoh: `user-profile`)

- **Variabel dan Fungsi**:
  - Gunakan camelCase (contoh: `getUserData`)
  - Gunakan nama yang deskriptif

- **Komponen**:
  - Gunakan PascalCase (contoh: `<UserProfile />`)

### Struktur Kode

- Kelompokkan import berdasarkan jenis (React, komponen, utilitas, styles)
- Deklarasikan state dan hooks di bagian atas komponen
- Deklarasikan fungsi helper sebelum return statement
- Gunakan destructuring untuk props dan state

### Commit

- Gunakan pesan commit yang jelas dan deskriptif
- Mulai dengan kata kerja (contoh: "Tambahkan fitur login", "Perbaiki bug di form")
- Jika terkait dengan issue, sertakan nomor issue (contoh: "Fix #123: Perbaiki validasi form")

## Pengujian

- Tulis unit test untuk fungsi penting
- Pastikan semua test lulus sebelum membuat pull request
- Tambahkan test untuk fitur baru atau perbaikan bug

## Dokumentasi

- Perbarui dokumentasi jika Anda mengubah fungsionalitas
- Tambahkan komentar untuk kode yang kompleks
- Perbarui README.md jika diperlukan

## Proses Review

- Pull request akan di-review oleh maintainer
- Maintainer mungkin meminta perubahan atau klarifikasi
- Setelah disetujui, pull request akan di-merge

## Pelaporan Bug

Jika Anda menemukan bug, silakan buat issue dengan informasi berikut:

- Deskripsi singkat tentang bug
- Langkah-langkah untuk mereproduksi bug
- Perilaku yang diharapkan
- Screenshot (jika ada)
- Informasi lingkungan (browser, OS, dll.)

## Permintaan Fitur

Jika Anda memiliki ide untuk fitur baru, silakan buat issue dengan informasi berikut:

- Deskripsi fitur
- Alasan mengapa fitur ini diperlukan
- Contoh implementasi (jika ada)

## Komunikasi

- Gunakan issue GitHub untuk diskusi
- Bersikap sopan dan hormat kepada kontributor lain
- Jika Anda memiliki pertanyaan, jangan ragu untuk bertanya

## Lisensi

Dengan berkontribusi pada proyek ini, Anda setuju bahwa kontribusi Anda akan dilisensikan di bawah lisensi MIT yang sama dengan proyek ini.

Terima kasih atas kontribusi Anda!
