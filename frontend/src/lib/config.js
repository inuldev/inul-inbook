const config = {
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  apiTimeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    upload: 60000,
  },
  isDevelopment: process.env.NODE_ENV === "development",
};

export default config;
