# Struktur Aplikasi Social Media

## Frontend (Next.js 14)

```
frontend/
├── public/                  # File statis
├── src/
│   ├── app/                 # Routing dan halaman aplikasi
│   │   ├── (auth)/          # Halaman autentikasi
│   │   │   ├── user-login/  # Halaman login
│   │   │   └── user-register/ # Halaman registrasi
│   │   ├── (dashboard)/     # Halaman dashboard
│   │   │   ├── friends-list/ # Halaman daftar teman
│   │   │   ├── posts/       # Halaman post
│   │   │   ├── user-profile/ # Halaman profil pengguna
│   │   │   └── video-feed/  # Halaman feed video
│   │   ├── api/             # API routes
│   │   ├── layout.js        # Layout utama
│   │   └── page.js          # Halaman utama
│   ├── components/          # Komponen UI
│   │   ├── auth/            # Komponen autentikasi
│   │   ├── dashboard/       # Komponen dashboard
│   │   ├── shared/          # Komponen yang digunakan di berbagai tempat
│   │   │   ├── BaseCard.jsx # Komponen dasar untuk card
│   │   │   ├── MediaCard.jsx # Komponen untuk menampilkan media
│   │   │   ├── MediaComments.jsx # Komponen untuk komentar media
│   │   │   ├── Navbar.jsx   # Komponen navbar
│   │   │   └── Sidebar.jsx  # Komponen sidebar
│   │   └── ui/              # Komponen UI dasar (shadcn/ui)
│   ├── lib/                 # Utilitas dan helper
│   │   ├── commentInteractionHelpers.js # Helper untuk interaksi komentar
│   │   ├── config.js        # Konfigurasi aplikasi
│   │   ├── postInteractionHelpers.js # Helper untuk interaksi post
│   │   └── toastUtils.js    # Utilitas untuk toast notification
│   ├── store/               # State management (Zustand)
│   │   ├── postStore.js     # Store untuk post
│   │   ├── themeStore.js    # Store untuk tema
│   │   └── userStore.js     # Store untuk pengguna
│   └── styles/              # Stylesheet
│       └── globals.css      # CSS global
├── .env                     # Environment variables
├── .env.local               # Environment variables lokal
├── next.config.js           # Konfigurasi Next.js
├── package.json             # Dependensi dan script
├── postcss.config.js        # Konfigurasi PostCSS
└── tailwind.config.js       # Konfigurasi Tailwind CSS
```

## Backend (Express.js)

```
backend/
├── config/                  # Konfigurasi
│   └── db.js                # Konfigurasi database
├── controllers/             # Controller
│   ├── authController.js    # Controller autentikasi
│   ├── friendController.js  # Controller pertemanan
│   ├── postController.js    # Controller post
│   └── userController.js    # Controller pengguna
├── middleware/              # Middleware
│   ├── authMiddleware.js    # Middleware autentikasi
│   └── errorMiddleware.js   # Middleware error
├── models/                  # Model database
│   ├── Comment.js           # Model komentar
│   ├── Friend.js            # Model pertemanan
│   ├── Post.js              # Model post
│   └── User.js              # Model pengguna
├── routes/                  # Routes
│   ├── authRoutes.js        # Routes autentikasi
│   ├── friendRoutes.js      # Routes pertemanan
│   ├── postRoutes.js        # Routes post
│   └── userRoutes.js        # Routes pengguna
├── utils/                   # Utilitas
│   ├── cloudinary.js        # Utilitas Cloudinary
│   └── validators.js        # Validasi input
├── .env                     # Environment variables
├── app.js                   # Aplikasi Express
├── package.json             # Dependensi dan script
└── server.js                # Entry point
```
