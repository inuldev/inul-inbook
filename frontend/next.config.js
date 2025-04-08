/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        port: "",
      },
    ],
    // Optimize images for Vercel deployment
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || "development",
  },
  // Experimental features
  experimental: {
    // Disable the missingSuspenseWithCSRBailout warning in production
    missingSuspenseWithCSRBailout: false,
    // Development-only features
    ...(process.env.NODE_ENV === "development" && {
      optimizeCss: true,
    }),
  },
  // Production-specific settings
  ...(process.env.NODE_ENV === "production" && {
    compiler: {
      removeConsole: {
        exclude: ["error", "warn"],
      },
    },
    poweredByHeader: false,
  }),
  // Vercel-specific optimizations
  output: "standalone", // Optimize for Vercel deployment
  compress: true, // Enable compression
  // Configure redirects and rewrites for SPA behavior
  async redirects() {
    return [
      // Handle 404 for forgot-password with RSC query param
      {
        source: "/forgot-password",
        has: [
          {
            type: "query",
            key: "_rsc",
          },
        ],
        permanent: false,
        destination: "/user-login",
      },
      // Handle Google OAuth callback
      {
        source: "/",
        has: [
          {
            type: "query",
            key: "loginSuccess",
            value: "true",
          },
        ],
        permanent: false,
        destination: "/google-callback",
      },
    ];
  },
  async rewrites() {
    return [
      // Proxy API requests to the backend in development
      ...(process.env.NODE_ENV === "development"
        ? [
            {
              source: "/api/:path*",
              destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`,
            },
          ]
        : []),
    ];
  },
};

module.exports = nextConfig;
