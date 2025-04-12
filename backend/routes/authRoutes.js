const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  logout,
  getMe,
  handleGoogleCallback,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Register and login routes
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", protect, getMe);

// Google OAuth routes with improved options
router.get("/google", (req, res, next) => {
  // Log the request for debugging
  console.log("Google OAuth initiation request received");
  console.log("Request headers:", {
    origin: req.headers.origin,
    referrer: req.headers.referrer,
    host: req.headers.host,
  });
  console.log("Request cookies:", req.cookies);

  // Add state parameter for security
  const state = Buffer.from(
    JSON.stringify({
      timestamp: Date.now(),
      origin: req.headers.origin || req.headers.referrer,
      path: req.originalUrl,
    })
  ).toString("base64");

  // Continue with passport authentication
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // Always show account selection
    state: state, // Add state parameter
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    // Log the callback request for debugging
    console.log("Google OAuth callback request received");
    console.log("Request query:", req.query);
    console.log("Request headers:", {
      origin: req.headers.origin,
      referrer: req.headers.referrer,
      host: req.headers.host,
    });
    console.log("Request cookies:", req.cookies);

    // Continue with passport authentication
    passport.authenticate("google", {
      failureRedirect: `${
        process.env.FRONTEND_URL
      }/user-login?error=Google authentication failed&timestamp=${Date.now()}`,
      session: true, // Use session for authentication
    })(req, res, next);
  },
  handleGoogleCallback
);

module.exports = router;
