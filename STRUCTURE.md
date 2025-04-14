# Struktur Aplikasi Social Media

Dokumen ini menjelaskan struktur aplikasi social media yang telah dibangun. Struktur ini dirancang untuk memudahkan pengembangan, pemeliharaan, dan skalabilitas aplikasi.

## Frontend (Next.js 14)

```
frontend/
├── public/                  # File statis
├── src/
│   ├── app/                 # Routing dan halaman aplikasi
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # API autentikasi
│   │   │   │   └── google/  # API Google OAuth
│   │   │   └── [...path]/   # API proxy
│   │   ├── auth-callback/   # Callback autentikasi
│   │   ├── components/      # Komponen khusus untuk app router
│   │   │   ├── AuthGuard.jsx       # Guard untuk halaman terproteksi
│   │   │   ├── AuthProvider.jsx    # Provider autentikasi
│   │   │   ├── CloudinaryUploader.jsx # Uploader Cloudinary
│   │   │   ├── ConditionalHeader.jsx  # Header kondisional
│   │   │   ├── Header.jsx            # Komponen header
│   │   │   ├── LeftSideBar.jsx       # Sidebar kiri
│   │   │   ├── PathnameProvider.jsx  # Provider pathname
│   │   │   ├── RightSideBar.jsx      # Sidebar kanan
│   │   │   └── SearchParamsProvider.jsx # Provider search params
│   │   ├── forgot-password/ # Halaman lupa password
│   │   ├── friends-list/    # Halaman daftar teman
│   │   │   ├── FriendRequest.jsx    # Komponen permintaan pertemanan
│   │   │   ├── FriendsSuggestion.jsx # Komponen saran teman
│   │   │   ├── layout.js            # Layout halaman
│   │   │   └── page.js              # Halaman utama
│   │   ├── google-callback/ # Callback Google OAuth
│   │   ├── Homepage/        # Halaman beranda
│   │   ├── posts/           # Halaman post
│   │   │   ├── [id]/        # Halaman detail post
│   │   │   ├── EditPostForm.jsx     # Form edit post
│   │   │   ├── NewPostForm.jsx      # Form post baru
│   │   │   ├── PostCard.jsx         # Komponen card post
│   │   │   └── PostComments.jsx     # Komponen komentar post
│   │   ├── story/           # Halaman story
│   │   │   ├── StoryCard.jsx        # Komponen card story
│   │   │   ├── StoryForm.jsx        # Form story
│   │   │   └── StorySection.jsx     # Bagian story
│   │   ├── user-login/      # Halaman login
│   │   ├── user-profile/    # Halaman profil pengguna
│   │   │   ├── [id]/        # Profil pengguna berdasarkan ID
│   │   │   ├── profileContent/      # Konten profil
│   │   │   │   ├── EditBio.jsx      # Edit bio
│   │   │   │   ├── MutualFriends.jsx # Teman bersama
│   │   │   │   └── PostsContent.jsx # Konten post
│   │   │   ├── layout.js            # Layout profil
│   │   │   ├── page.js              # Halaman profil
│   │   │   ├── ProfileDetails.jsx   # Detail profil
│   │   │   ├── ProfileHeader.jsx    # Header profil
│   │   │   └── ProfileTabs.jsx      # Tab profil
│   │   ├── user-register/   # Halaman registrasi
│   │   ├── video-feed/      # Halaman feed video
│   │   │   ├── layout.js            # Layout feed video
│   │   │   ├── page.js              # Halaman feed video
│   │   │   ├── VideoCard.jsx        # Komponen card video
│   │   │   └── VideoComments.jsx    # Komponen komentar video
│   │   ├── favicon.ico      # Favicon
│   │   ├── globals.css      # CSS global
│   │   ├── layout.js        # Layout utama
│   │   └── page.js          # Halaman utama
│   ├── components/          # Komponen UI
│   │   ├── shared/          # Komponen yang digunakan di berbagai tempat
│   │   │   ├── BaseCard.jsx         # Komponen dasar untuk card
│   │   │   ├── MediaCard.jsx        # Komponen untuk menampilkan media
│   │   │   └── MediaComments.jsx    # Komponen untuk komentar media
│   │   ├── ui/              # Komponen UI dasar (shadcn/ui)
│   │   │   ├── alert.jsx            # Komponen alert
│   │   │   ├── avatar.jsx           # Komponen avatar
│   │   │   ├── button.jsx           # Komponen button
│   │   │   ├── card.jsx             # Komponen card
│   │   │   ├── dialog.jsx           # Komponen dialog
│   │   │   ├── dropdown-menu.jsx    # Komponen dropdown menu
│   │   │   ├── input.jsx            # Komponen input
│   │   │   ├── label.jsx            # Komponen label
│   │   │   ├── loader.jsx            # Komponen loader
│   │   │   ├── loading-overlay.jsx  # Komponen loading overlay
│   │   │   ├── progress.jsx         # Komponen progress
│   │   │   ├── radio-group.jsx      # Komponen radio group
│   │   │   ├── scroll-area.jsx      # Komponen scroll area
│   │   │   ├── select.jsx           # Komponen select
│   │   │   ├── separator.jsx        # Komponen separator
│   │   │   ├── skeleton.jsx         # Komponen skeleton
│   │   │   ├── skeleton-components.jsx # Komponen skeleton tambahan
│   │   │   ├── spinner.jsx          # Komponen spinner
│   │   │   ├── tabs.jsx             # Komponen tabs
│   │   │   ├── textarea.jsx         # Komponen textarea
│   │   │   ├── theme-toggle.jsx     # Komponen toggle tema
│   │   │   ├── toast.jsx            # Komponen toast
│   │   │   └── toaster.jsx          # Komponen toaster
│   │   └── DebugButton.jsx   # Komponen debug
│   ├── hooks/               # Custom hooks
│   │   ├── use-toast.js            # Hook untuk toast
│   │   └── useGoogleAuth.js        # Hook untuk Google Auth
│   ├── lib/                 # Utilitas dan helper
│   │   ├── api.js                  # Utilitas API
│   │   ├── authDebug.js            # Debug autentikasi
│   │   ├── authUtils.js            # Utilitas autentikasi
│   │   ├── commentInteractionHelpers.js # Helper untuk interaksi komentar
│   │   ├── config.js               # Konfigurasi aplikasi
│   │   ├── cookieUtils.js          # Utilitas cookie
│   │   ├── debugUtils.js           # Utilitas debug
│   │   ├── postInteractionHelpers.js # Helper untuk interaksi post
│   │   ├── toastUtils.js           # Utilitas untuk toast notification
│   │   └── utils.js                # Utilitas umum
│   ├── service/              # Service untuk API
│   │   ├── friends.service.js      # Service untuk pertemanan
│   │   └── user.service.js         # Service untuk pengguna
│   ├── store/               # State management (Zustand)
│   │   ├── friendNotificationStore.js # Store untuk notifikasi pertemanan
│   │   ├── postStore.js            # Store untuk post
│   │   ├── sidebarStore.js         # Store untuk sidebar
│   │   ├── storyStore.js           # Store untuk story
│   │   ├── usePostStore.js         # Hook store untuk post
│   │   ├── userFriendsStore.js     # Store untuk teman pengguna
│   │   └── userStore.js            # Store untuk pengguna
│   └── middleware.js        # Middleware Next.js
├── .env                     # Environment variables
├── .env.production          # Environment variables produksi
├── .env.production.example  # Contoh environment variables produksi
├── .eslintrc.json           # Konfigurasi ESLint
├── .gitignore               # File yang diabaikan Git
├── components.json          # Konfigurasi komponen
├── jsconfig.json            # Konfigurasi JavaScript
├── next.config.js           # Konfigurasi Next.js
├── package.json             # Dependensi dan script
├── postcss.config.mjs       # Konfigurasi PostCSS
├── tailwind.config.js       # Konfigurasi Tailwind CSS
└── vercel.json              # Konfigurasi Vercel
```

## Backend (Express.js)

```
backend/
├── config/                  # Konfigurasi
│   ├── config.js            # Konfigurasi umum
│   ├── db.js                # Konfigurasi database
│   └── passport.js          # Konfigurasi Passport.js
├── controllers/             # Controller
│   ├── authController.js    # Controller autentikasi
│   ├── friendController.js  # Controller pertemanan
│   ├── postController.js    # Controller post
│   ├── storyController.js   # Controller story
│   └── userController.js    # Controller pengguna
├── cron/                    # Cron jobs
│   ├── index.js             # Inisialisasi cron jobs
│   └── storyCleanup.js      # Pembersihan story yang kedaluwarsa
├── middleware/              # Middleware
│   ├── auth.js              # Middleware autentikasi
│   └── upload.js            # Middleware upload
├── model/                   # Model database
│   ├── Bio.js               # Model bio
│   ├── Comment.js           # Model komentar
│   ├── FriendRequest.js     # Model permintaan pertemanan
│   ├── Post.js              # Model post
│   ├── Story.js             # Model story
│   └── User.js              # Model pengguna
├── routes/                  # Routes
│   ├── authRoutes.js        # Routes autentikasi
│   ├── friendRoutes.js      # Routes pertemanan
│   ├── postRoutes.js        # Routes post
│   ├── storyRoutes.js       # Routes story
│   └── userRoutes.js        # Routes pengguna
├── scripts/                 # Script utilitas
│   └── switch-env.js        # Script untuk switch environment
├── utils/                   # Utilitas
│   └── cloudinaryUtils.js   # Utilitas untuk Cloudinary
├── .env                     # Environment variables
├── .env.production          # Environment variables produksi
├── .env.production.example  # Contoh environment variables produksi
├── .gitignore               # File yang diabaikan Git
├── index.js                 # Entry point aplikasi
├── package.json             # Dependensi dan script
├── test-password.js         # Script test password
└── vercel.json              # Konfigurasi Vercel
```

## Fitur Utama dan Implementasinya

### 1. Autentikasi dan Otorisasi

- **JWT Authentication**: Implementasi di `authController.js` dan `auth.js`
- **Google OAuth**: Integrasi di `passport.js` dan `authRoutes.js`
- **Middleware Proteksi**: Implementasi di `auth.js` untuk melindungi rute

### 2. Manajemen Post

- **CRUD Post**: Implementasi di `postController.js`
- **Interaksi Post**: Like, comment, share di `postController.js`
- **Media Post**: Upload dan manajemen media di `upload.js` dan `postController.js`
- **Privasi Post**: Implementasi tipe privasi (public, friends, private) di `postController.js` dan `auth.js`

### 3. Manajemen Story

- **CRUD Story**: Implementasi di `storyController.js`
- **Pembersihan Otomatis**: Cron job di `storyCleanup.js`
- **View Tracking**: Implementasi di `storyController.js`

### 4. Manajemen Media

- **Cloudinary Integration**: Konfigurasi di `upload.js`
- **Direct Upload**: Implementasi di `postController.js` dan `storyController.js`
- **Media Cleanup**: Implementasi di `postController.js`, `storyController.js`, dan `userController.js`

### 5. Manajemen Pengguna

- **Profil Pengguna**: Implementasi di `userController.js`
- **Follow/Unfollow**: Implementasi di `userController.js`
- **Pencarian Pengguna**: Implementasi di `userController.js`

### 6. Pertemanan

- **Permintaan Pertemanan**: Implementasi di `friendController.js`
- **Teman Bersama**: Implementasi di `friendController.js`
- **Saran Teman**: Implementasi di `friendController.js`

### 7. Privasi Post

Aplikasi mendukung tiga tingkat privasi post:

1. **Public**: Post dapat dilihat oleh semua pengguna, bahkan yang tidak login.
2. **Friends**: Post hanya dapat dilihat oleh pengguna yang memiliki hubungan following/follower dengan pembuat post.
3. **Private**: Post hanya dapat dilihat oleh pembuat post.

#### Implementasi Backend

Privasi post diimplementasikan di backend melalui beberapa komponen:

1. **Middleware Autentikasi (`auth.js`)**:

   - Middleware ini memungkinkan rute untuk menangani pengguna yang tidak login dengan lebih baik.
   - Ketika token tidak ditemukan, middleware melanjutkan eksekusi dengan `next()` tanpa mengembalikan error 401.
   - Ini memungkinkan rute untuk memeriksa apakah pengguna sudah login dan menyesuaikan respons berdasarkan status login.

2. **Rute Post (`postRoutes.js`)**:

   - Rute publik menggunakan middleware `protect` untuk autentikasi opsional.
   - Ini memungkinkan rute untuk memeriksa apakah pengguna sudah login tanpa memblokir akses untuk pengguna yang tidak login.

3. **Controller Post (`postController.js`)**:
   - Fungsi `getPosts` memeriksa status login pengguna dan menyesuaikan query untuk mengambil post yang sesuai.
   - Pengguna yang tidak login hanya melihat post dengan tipe "public".
   - Pengguna yang sudah login melihat post mereka sendiri (terlepas dari tipe privasi), post "public" dari semua pengguna, dan post "friends" dari pengguna yang memiliki hubungan following/follower dengan mereka.
   - Fungsi `getPost` memeriksa privasi post dan mengembalikan error 403 jika pengguna tidak memiliki akses.
   - Fungsi `getUserPosts` memeriksa hubungan antara pengguna yang melihat dan pemilik post untuk menentukan post mana yang dapat dilihat.

#### Implementasi Frontend

Privasi post diimplementasikan di frontend melalui beberapa komponen:

1. **Store Post (`postStore.js`)**:

   - Store ini mengelola state post dan mengambil post dari backend.
   - Fungsi `fetchPosts` selalu menyertakan kredensial untuk memastikan status login dikirim ke backend.
   - Store ini juga menangani caching post untuk meningkatkan performa.

2. **Komponen Post Form (`NewPostForm.jsx` dan `EditPostForm.jsx`)**:

   - Komponen ini memungkinkan pengguna untuk memilih tipe privasi saat membuat atau mengedit post.
   - Dropdown privasi menampilkan ikon dan deskripsi yang jelas untuk setiap tipe privasi.

3. **Komponen Card (`BaseCard.jsx`)**:

   - Komponen ini menampilkan indikator privasi di header post.
   - Indikator privasi menampilkan ikon yang sesuai dengan tipe privasi post.

4. **Komponen Privasi (`PrivacyIndicator.jsx`)**:
   - Komponen ini menampilkan ikon dan tooltip yang menjelaskan tipe privasi post.
   - Tooltip memberikan deskripsi lengkap tentang siapa yang dapat melihat post.
