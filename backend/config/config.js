const dotenv = require("dotenv");
const path = require("path");

// Load environment variables based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Fallback to .env if the specific environment file doesn't exist
if (!process.env.PORT) {
  dotenv.config();
}

const config = {
  // Server configuration
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB configuration
  mongoUri: process.env.MONGO_URI,

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",

  // CORS configuration
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Google OAuth configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  // Environment checks
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  // Session configuration with improved cross-domain support
  session: {
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer sessions
      secure:
        process.env.NODE_ENV === "production" ||
        process.env.FRONTEND_URL?.startsWith("https"),
      sameSite: "none", // Always use 'none' for cross-domain cookies
      httpOnly: true, // Prevent JavaScript access to the cookie
      path: "/", // Make cookie available on all paths
    },
  },

  // Logging configuration
  logLevel:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "error" : "debug"),
};

// Validate required configuration
const requiredConfigs = ["mongoUri", "jwtSecret"];

requiredConfigs.forEach((configPath) => {
  const value = configPath
    .split(".")
    .reduce((obj, key) => obj && obj[key], config);
  if (!value) {
    throw new Error(`Required configuration "${configPath}" is missing`);
  }
});

module.exports = config;
