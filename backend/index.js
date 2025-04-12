const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const config = require("./config/config");

// Import cron jobs
const { initCronJobs } = require("./cron");

// Import route files
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const storyRoutes = require("./routes/storyRoutes");
const friendRoutes = require("./routes/friendRoutes");

// Initialize Express app
const app = express();

// CORS configuration with improved security and debugging
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) {
      console.log("Request with no origin allowed");
      return callback(null, true);
    }

    // Check if the origin is allowed
    const allowedOrigins = [
      config.frontendUrl,
      "https://inul2-inbook.vercel.app", // Add production domain explicitly
    ];

    if (config.isDevelopment) {
      // In development, also allow localhost
      allowedOrigins.push("http://localhost:3000");
    }

    console.log(`CORS check for origin: ${origin}`);
    console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);

    if (allowedOrigins.includes(origin)) {
      console.log(`Origin ${origin} allowed by CORS`);
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      // In production, be strict about CORS
      if (config.isProduction) {
        return callback(new Error("Not allowed by CORS"));
      } else {
        // In development, allow all origins for easier testing
        console.warn("Allowing anyway because not in production");
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options("*", cors(corsOptions));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("Request cookies:", req.cookies);
  next();
});

// Middleware
app.use(cookieParser());
app.use(express.json());

// Session configuration for OAuth
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: config.session.cookie,
    // Add proxy support for secure cookies behind a proxy
    proxy: config.isProduction,
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Configure passport strategies
require("./config/passport");

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/friends", friendRoutes);

// Root route for API health check
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Connect to MongoDB
mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");

    // Initialize cron jobs
    initCronJobs();

    // Start server
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
