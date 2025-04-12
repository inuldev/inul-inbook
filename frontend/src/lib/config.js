const config = {
  // Use relative URL in production for same-domain API requests
  backendUrl:
    process.env.NODE_ENV === "production"
      ? "" // Empty string means use relative URLs (same domain)
      : process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  apiTimeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    upload: 60000,
  },
  mediaLimits: {
    post: {
      image: 10 * 1024 * 1024, // 10MB in bytes
      video: 100 * 1024 * 1024, // 100MB in bytes
    },
    story: {
      image: 5 * 1024 * 1024, // 5MB in bytes
      video: 5 * 1024 * 1024, // 5MB in bytes
    },
  },
  isDevelopment: process.env.NODE_ENV === "development",
};

export default config;
