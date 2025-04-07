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
  // Enable experimental features in development only
  ...(process.env.NODE_ENV === "development" && {
    experimental: {
      optimizeCss: true,
    },
  }),
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
  // Configure redirects for SPA behavior
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
