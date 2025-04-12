# Dokumentasi API

Dokumen ini berisi dokumentasi lengkap untuk API backend aplikasi media sosial.

## Informasi Umum

- **Base URL**: `https://api.example.com` (Produksi) atau `http://localhost:8000` (Pengembangan)
- **Format**: Semua request dan response menggunakan format JSON
- **Autentikasi**: Sebagian besar endpoint memerlukan token JWT yang dikirim melalui header `Authorization`
- **Rate Limiting**: 100 request per menit per IP

## Autentikasi

### Register

Mendaftarkan pengguna baru.

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

- **Response Success** (200):

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **Response Error** (400):

```json
{
  "success": false,
  "message": "Email already exists"
}
```

### Login

Mengautentikasi pengguna dan mengembalikan token JWT.

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

- **Response Success** (200):

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **Response Error** (401):

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Google OAuth

Mengautentikasi pengguna menggunakan Google OAuth.

- **URL**: `/api/auth/google`
- **Method**: `GET`
- **Auth Required**: No
- **Response**: Redirect ke Google OAuth

### Google OAuth Callback

Callback untuk Google OAuth.

- **URL**: `/api/auth/google/callback`
- **Method**: `GET`
- **Auth Required**: No
- **Response**: Redirect ke frontend dengan token

### Logout

Menghapus token JWT.

- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Pengguna

### Get Current User

Mendapatkan informasi pengguna yang sedang login.

- **URL**: `/api/users/me`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePicture": "https://example.com/profile.jpg",
    "bio": "Software Developer",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get User by ID

Mendapatkan informasi pengguna berdasarkan ID.

- **URL**: `/api/users/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "profilePicture": "https://example.com/profile.jpg",
    "bio": "Software Developer"
  }
}
```

### Update User

Memperbarui informasi pengguna.

- **URL**: `/api/users/me`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Body**:

```json
{
  "name": "John Updated",
  "bio": "Full Stack Developer"
}
```

- **Response Success** (200):

```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Updated",
    "email": "john@example.com",
    "bio": "Full Stack Developer"
  }
}
```

### Update Profile Picture

Memperbarui foto profil pengguna.

- **URL**: `/api/users/me/profile-picture`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Body**:

  - `profilePicture`: File gambar (jpg, png, gif, webp)

- **Response Success** (200):

```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "profilePicture": "https://example.com/new-profile.jpg"
}
```

## Post

### Create Post

Membuat post baru.

- **URL**: `/api/posts`
- **Method**: `POST`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Body**:

  - `content`: String (opsional jika ada media)
  - `media`: File (opsional, jpg, png, gif, webp, mp4)
  - `privacy`: String (public, friends, private)

- **Response Success** (201):

```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "id": "60d21b4667d0d8992e610c85",
    "content": "Hello world!",
    "media": "https://example.com/media.jpg",
    "privacy": "public",
    "author": {
      "id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "profilePicture": "https://example.com/profile.jpg"
    },
    "likes": 0,
    "comments": 0,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get Posts

Mendapatkan daftar post.

- **URL**: `/api/posts`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:

  - `page`: Number (default: 1)
  - `limit`: Number (default: 10)
  - `userId`: String (opsional, filter by user)

- **Response Success** (200):

```json
{
  "success": true,
  "posts": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "content": "Hello world!",
      "media": "https://example.com/media.jpg",
      "privacy": "public",
      "author": {
        "id": "60d21b4667d0d8992e610c85",
        "name": "John Doe",
        "profilePicture": "https://example.com/profile.jpg"
      },
      "likes": 5,
      "comments": 2,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalPosts": 45
  }
}
```

### Get Post by ID

Mendapatkan post berdasarkan ID.

- **URL**: `/api/posts/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "post": {
    "id": "60d21b4667d0d8992e610c85",
    "content": "Hello world!",
    "media": "https://example.com/media.jpg",
    "privacy": "public",
    "author": {
      "id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "profilePicture": "https://example.com/profile.jpg"
    },
    "likes": 5,
    "comments": 2,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update Post

Memperbarui post. Jika media baru diunggah, media lama di Cloudinary akan dihapus.

- **URL**: `/api/posts/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data` (jika mengunggah media baru) atau `application/json` (jika hanya memperbarui teks)
- **Body**:

```json
{
  "content": "Updated content",
  "privacy": "friends"
}
```

Atau dengan media baru:

- `content`: String
- `privacy`: String
- `media`: File (jpg, png, gif, webp, mp4)

- **Response Success** (200):

```json
{
  "success": true,
  "message": "Post updated successfully",
  "post": {
    "id": "60d21b4667d0d8992e610c85",
    "content": "Updated content",
    "media": "https://example.com/media.jpg",
    "privacy": "friends"
  },
  "oldMediaDeleted": true
}
```

### Delete Post

Menghapus post dan media terkait di Cloudinary.

- **URL**: `/api/posts/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Post deleted successfully",
  "mediaDeleted": true
}
```

### Like Post

Menyukai post.

- **URL**: `/api/posts/:id/like`
- **Method**: `POST`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Post liked successfully",
  "likes": 6
}
```

### Unlike Post

Membatalkan like pada post.

- **URL**: `/api/posts/:id/unlike`
- **Method**: `POST`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Post unliked successfully",
  "likes": 5
}
```

### Get Post Comments

Mendapatkan komentar pada post.

- **URL**: `/api/posts/:id/comments`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:

  - `page`: Number (default: 1)
  - `limit`: Number (default: 10)

- **Response Success** (200):

```json
{
  "success": true,
  "comments": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "content": "Great post!",
      "author": {
        "id": "60d21b4667d0d8992e610c85",
        "name": "Jane Doe",
        "profilePicture": "https://example.com/jane.jpg"
      },
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalComments": 2
  }
}
```

### Add Comment

Menambahkan komentar pada post.

- **URL**: `/api/posts/:id/comments`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:

```json
{
  "content": "This is a comment"
}
```

- **Response Success** (201):

```json
{
  "success": true,
  "message": "Comment added successfully",
  "comment": {
    "id": "60d21b4667d0d8992e610c85",
    "content": "This is a comment",
    "author": {
      "id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "profilePicture": "https://example.com/profile.jpg"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "replies": []
  }
}
```

### Reply to Comment

Menambahkan balasan pada komentar.

- **URL**: `/api/posts/:postId/comments/:commentId/replies`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:

```json
{
  "content": "This is a reply to the comment"
}
```

- **Response Success** (201):

```json
{
  "success": true,
  "message": "Reply added successfully",
  "reply": {
    "id": "60d21b4667d0d8992e610c86",
    "content": "This is a reply to the comment",
    "author": {
      "id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "profilePicture": "https://example.com/profile.jpg"
    },
    "parentComment": "60d21b4667d0d8992e610c85",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get Comment Replies

Mendapatkan balasan untuk sebuah komentar.

- **URL**: `/api/posts/:postId/comments/:commentId/replies`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:

  - `page`: Number (default: 1)
  - `limit`: Number (default: 10)

- **Response Success** (200):

```json
{
  "success": true,
  "replies": [
    {
      "id": "60d21b4667d0d8992e610c86",
      "content": "This is a reply to the comment",
      "author": {
        "id": "60d21b4667d0d8992e610c85",
        "name": "John Doe",
        "profilePicture": "https://example.com/profile.jpg"
      },
      "parentComment": "60d21b4667d0d8992e610c85",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalReplies": 1
  }
}
```

### Delete Comment Reply

Menghapus balasan komentar.

- **URL**: `/api/posts/:postId/comments/:commentId/replies/:replyId`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Reply deleted successfully"
}
```

## Story

### Create Story

Membuat story baru.

- **URL**: `/api/stories`
- **Method**: `POST`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Body**:

  - `media`: File (jpg, png, gif, webp, mp4)

- **Response Success** (201):

```json
{
  "success": true,
  "message": "Story created successfully",
  "story": {
    "id": "60d21b4667d0d8992e610c85",
    "media": "https://example.com/story.jpg",
    "author": {
      "id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "profilePicture": "https://example.com/profile.jpg"
    },
    "views": 0,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "expiresAt": "2023-01-02T00:00:00.000Z"
  }
}
```

### Get Stories

Mendapatkan daftar story.

- **URL**: `/api/stories`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "stories": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "media": "https://example.com/story.jpg",
      "author": {
        "id": "60d21b4667d0d8992e610c85",
        "name": "John Doe",
        "profilePicture": "https://example.com/profile.jpg"
      },
      "views": 5,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "expiresAt": "2023-01-02T00:00:00.000Z"
    }
  ]
}
```

### View Story

Menandai story sebagai dilihat.

- **URL**: `/api/stories/:id/view`
- **Method**: `POST`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Story viewed",
  "views": 6
}
```

### Delete Story

Menghapus story dan media terkait di Cloudinary.

- **URL**: `/api/stories/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Story deleted successfully",
  "mediaDeleted": true
}
```

## Pertemanan

### Send Friend Request

Mengirim permintaan pertemanan.

- **URL**: `/api/friends/request/:userId`
- **Method**: `POST`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Friend request sent successfully"
}
```

### Accept Friend Request

Menerima permintaan pertemanan.

- **URL**: `/api/friends/accept/:requestId`
- **Method**: `POST`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Friend request accepted"
}
```

### Reject Friend Request

Menolak permintaan pertemanan.

- **URL**: `/api/friends/reject/:requestId`
- **Method**: `POST`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Friend request rejected"
}
```

### Get Friend Requests

Mendapatkan daftar permintaan pertemanan.

- **URL**: `/api/friends/requests`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:

  - `type`: String (received, sent)

- **Response Success** (200):

```json
{
  "success": true,
  "requests": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "sender": {
        "id": "60d21b4667d0d8992e610c85",
        "name": "Jane Doe",
        "profilePicture": "https://example.com/jane.jpg"
      },
      "receiver": {
        "id": "60d21b4667d0d8992e610c85",
        "name": "John Doe",
        "profilePicture": "https://example.com/john.jpg"
      },
      "status": "pending",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Friends

Mendapatkan daftar teman.

- **URL**: `/api/friends`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "friends": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "name": "Jane Doe",
      "profilePicture": "https://example.com/jane.jpg",
      "bio": "Software Engineer"
    }
  ]
}
```

### Remove Friend

Menghapus teman.

- **URL**: `/api/friends/:userId`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Response Success** (200):

```json
{
  "success": true,
  "message": "Friend removed successfully"
}
```

## Kode Status

- `200 OK`: Request berhasil
- `201 Created`: Resource berhasil dibuat
- `400 Bad Request`: Request tidak valid
- `401 Unauthorized`: Autentikasi diperlukan
- `403 Forbidden`: Tidak memiliki izin
- `404 Not Found`: Resource tidak ditemukan
- `429 Too Many Requests`: Rate limit terlampaui
- `500 Internal Server Error`: Error server

## Penanganan Error

Semua response error mengikuti format yang konsisten:

```json
{
  "success": false,
  "message": "Deskripsi error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Batasan

- Ukuran maksimum upload gambar (JPG, PNG, GIF, WebP): 10MB
- Ukuran maksimum upload video: 100MB
- Ukuran maksimum upload story (gambar/video): 5MB
- Rate limit: 100 request per menit per IP
- Semua media yang diunggah akan disimpan di Cloudinary
- Media di Cloudinary akan otomatis dihapus saat post/story dihapus atau diperbarui

## Versi API

Versi saat ini: v1

Untuk mengakses versi tertentu, gunakan header:

```
Accept: application/json; version=1
```

## Dukungan dan Kontak

Untuk pertanyaan atau masalah terkait API, silakan hubungi:

- Email: api-support@example.com
- GitHub Issues: [Link ke Issues](https://github.com/example/social-media-app/issues)
