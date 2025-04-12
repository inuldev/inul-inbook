<h1 align="center">✨ Social Media App ✨</h1>

This project is a full-featured social media application similar to Facebook that allows users to share their thoughts, experiences, and media with others. It is built with a modern tech stack, including Next.js 14, Tailwind CSS, Shadcn/UI, and Zustand for state management on the frontend, and Node.js/Express.js with MongoDB on the backend.

## 🚀 Quick Start

To get started with the project, follow these steps:

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account for media storage
- Google Developer account (for OAuth)

### Installation

1. Clone the repository

```bash
git clone https://github.com/inuldev/inul-inbook.git
cd social-media-app
```

2. Set up environment variables

Create `.env` files in both the backend and frontend directories using the provided `.env.example` files as templates.

#### Backend Setup

```bash
cd backend
npm install

# Create .env file with your configuration
cp .env.example .env
# Edit the .env file with your credentials

# Start the development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend
npm install

# Create .env file with your configuration
cp .env.example .env
# Edit the .env file with your credentials

# Start the development server
npm run dev
```

### Accessing the Application

Once both servers are running:

- Backend API: http://localhost:8000
- Frontend: http://localhost:3000

### Running in Different Environments

The application supports both development and production modes. Here's how to switch between them:

#### Using Environment Switching Script

```bash
# Switch to development mode
npm run switch:dev

# Switch to production mode
npm run switch:prod
```

#### Manual Environment Configuration

1. Copy the appropriate .env file:

   ```bash
   # For development
   cp .env.development.example .env

   # For production
   cp .env.production.example .env
   ```

2. Start the application with the appropriate command:

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run dev:prod
   ```

## 🔑 Environment Setup

Make sure you have the following environment variables set up:

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

### Cloudinary Setup

This application uses Cloudinary for media storage. You'll need to:

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add these credentials to your backend .env file

The application is configured to handle:

- Stories: Images/videos up to 4MB
- Post images: Up to 10MB
- Post videos: Up to 100MB

## 🚀 Deploying to Vercel (Hobby Plan)

This application is designed to be deployed to Vercel's hobby plan without requiring a credit card. Follow these steps to deploy your application:

### Frontend Deployment

1. **Create a Vercel Account**:

   - Sign up at [vercel.com](https://vercel.com) using GitHub, GitLab, or email

2. **Import Your Repository**:

   - From the Vercel dashboard, click "Add New" > "Project"
   - Select your repository and click "Import"

3. **Configure Project**:

   - **Framework Preset**: Select "Next.js"
   - **Root Directory**: Set to `frontend`
   - **Build Command**: Leave as default (`npm run build`)
   - **Output Directory**: Leave as default (`.next`)

4. **Environment Variables**:

   - Add all variables from your `.env.production` file
   - Make sure to set `NEXT_PUBLIC_BACKEND_URL` to your backend URL

5. **Deploy**:
   - Click "Deploy" and wait for the build to complete

### Backend Deployment

1. **Create a New Project**:

   - From the Vercel dashboard, click "Add New" > "Project"
   - Select the same repository and click "Import"

2. **Configure Project**:

   - **Framework Preset**: Select "Other"
   - **Root Directory**: Set to `backend`
   - **Build Command**: `npm install`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

3. **Environment Variables**:

   - Add all variables from your `.env.production` file
   - Make sure to set `FRONTEND_URL` to your frontend URL
   - Set `NODE_ENV` to `production`

4. **Deploy**:
   - Click "Deploy" and wait for the build to complete

### Connecting Frontend and Backend

After both deployments are complete:

1. **Update Environment Variables**:

   - In the frontend project settings, set `NEXT_PUBLIC_BACKEND_URL` to your backend deployment URL
   - In the backend project settings, set `FRONTEND_URL` to your frontend deployment URL

2. **Redeploy Both Projects**:
   - Trigger a new deployment for both projects to apply the updated environment variables

### Vercel Hobby Plan Limitations and Workarounds

The application includes several optimizations for Vercel's hobby plan:

1. **4MB Payload Limit**:

   - Direct upload to Cloudinary bypasses Vercel's 4MB limit
   - Large files never pass through Vercel's servers

2. **Serverless Function Timeout (10s)**:

   - Database connections are optimized for serverless environments
   - Long-running operations are avoided in API routes

3. **Limited Execution Time**:

   - Background tasks are minimized
   - Database queries are optimized

4. **Cold Starts**:
   - Connection pooling is implemented to reduce database connection overhead
   - Lightweight middleware to improve startup time

### Monitoring and Troubleshooting Vercel Deployments

1. **Vercel Logs**:

   - Access logs from your project dashboard > Deployments > Select deployment > Logs
   - Filter logs by function or status code

2. **Common Issues**:

   - **CORS Errors**: Check that your CORS configuration includes the correct frontend URL
   - **Database Connection Issues**: Verify MongoDB connection string and network access settings
   - **Environment Variables**: Ensure all required variables are set correctly
   - **Function Timeouts**: Look for long-running operations that exceed the 10s limit

3. **Performance Monitoring**:
   - Use the "Analytics" tab in your Vercel dashboard
   - Monitor function execution times and memory usage
   - Identify slow API routes and optimize them

### Environment-Specific Features

The application has different behaviors based on the environment:

#### Development Mode

- Detailed error messages and stack traces
- Request/response logging
- More lenient file size validation
- Development-specific middleware
- Auto-reloading with Nodemon

#### Production Mode

- Security-focused middleware (Helmet, compression)
- Limited error information exposed to clients
- Strict file size validation
- Console logs stripped from frontend code
- Performance optimizations

## ✨ Project Features

### Frontend Features

- **Next.js 14**: Modern React framework with server-side rendering and routing
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Shadcn/UI**: High-quality UI components built on Radix UI
- **Zustand**: Lightweight state management with persistent storage
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **BaseCard Component**: Standardized card component for consistent UI across the application

### Backend Features

- **Node.js/Express.js**: Fast and scalable server implementation
- **MongoDB with Mongoose**: Flexible document database with robust ODM
- **JWT Authentication**: Secure authentication with token-based sessions
- **Google OAuth**: Social login integration
- **Cloudinary Integration**: Cloud-based media storage with direct upload support

### Key Features

1. **User Management**:

   - Registration and login with email/password
   - Google OAuth integration
   - Profile customization with bio, profile picture, and cover photo
   - Follow/unfollow system

2. **Posts and Content**:

   - Create text posts with privacy settings
   - Upload images (up to 10MB) and videos (up to 100MB)
   - Like, comment, and share functionality
   - Feed with posts from followed users

3. **Stories**:

   - Create ephemeral content that expires after 24 hours
   - Support for images and videos (up to 5MB)
   - View count tracking

4. **User Interface**:

   - Dark/light theme support
   - Responsive design for mobile and desktop
   - Real-time updates for likes and comments
   - Infinite scrolling for content feeds

5. **Profile and Discovery**:
   - Detailed user profiles with bio information
   - User search functionality
   - Friend/follower management

## 🔧 Troubleshooting

### Common Issues

1. **Connection to MongoDB fails**

   - Check if your MongoDB URI is correct
   - Ensure your IP address is whitelisted in MongoDB Atlas
   - Verify network connectivity

2. **Cloudinary uploads not working**

   - Verify your Cloudinary credentials in the .env file
   - Check if you have sufficient storage in your Cloudinary account
   - Ensure file sizes are within the specified limits

3. **Google OAuth not working**

   - Verify your Google OAuth credentials
   - Ensure the callback URL matches exactly what's configured in Google Developer Console
   - Check if the redirect URI is whitelisted in Google Developer Console
   - For cross-domain issues, see [CORS_TROUBLESHOOTING.md](CORS_TROUBLESHOOTING.md) for detailed guidance
   - Use the Debug button in the bottom right corner of the application to diagnose authentication issues

4. **JWT authentication issues**

   - Make sure JWT_SECRET is set in your .env file
   - Check if the token is being properly sent in requests
   - Verify that cookies are enabled in your browser

5. **Like/Unlike functionality issues**
   - Check browser console for errors
   - Verify that the user is logged in
   - Ensure the post ID is correct
   - Check if the post exists in the database

## 📚 Project Structure

The project follows a modular structure to ensure maintainability and scalability. For a detailed view of the project structure, see [STRUCTURE.md](STRUCTURE.md).

### Backend Structure

```
backend/
├── config/         # Configuration files (DB, Cloudinary)
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
└── server.js       # Entry point
```

### Frontend Structure

```
frontend/
├── public/         # Static files
├── src/
│   ├── app/        # Next.js app directory (pages and routes)
│   ├── components/ # UI components
│   │   ├── shared/ # Shared components (BaseCard, MediaCard, etc.)
│   │   └── ui/     # Shadcn/UI components
│   ├── lib/        # Utility functions and helpers
│   └── store/      # Zustand stores
└── next.config.js  # Next.js configuration
```

## 👍 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💾 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👋 Conclusion

This social media application provides a solid foundation for building a Facebook-like platform. It includes all the essential features like authentication, posts, stories, and user interactions. The application has been refactored to use a more modular and maintainable structure, with standardized components and consistent implementations across the codebase.

For any questions or issues, please open an issue on the GitHub repository.
