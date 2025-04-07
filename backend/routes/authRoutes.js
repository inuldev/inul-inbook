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

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/user-login?error=Google authentication failed`,
  }),
  handleGoogleCallback
);

module.exports = router;
