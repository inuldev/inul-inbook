const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const Bio = require("../model/Bio");
const config = require("../config/config");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

// Set cookie with token
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Set more permissive cookie options to ensure it works across environments
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? "none" : "lax", // Needed for cross-site cookies in production
    path: "/", // Ensure consistent path for all cookies
    domain: undefined, // Let the browser set the domain automatically
  };

  console.log("Setting auth cookie with options:", options);
  console.log("Token being set:", token.substring(0, 10) + "...");

  // Set the cookie and return the response
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { username, email, password, gender, dateOfBirth } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      gender,
      dateOfBirth,
    });

    // Create bio for user
    const bio = await Bio.create({
      user: user._id,
    });

    // Update user with bio reference
    user.bio = bio._id;
    await user.save();

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and verify password
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Use the sendTokenResponse helper function for consistent token handling
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
const logout = (req, res) => {
  try {
    // Clear the token cookie - use multiple approaches to ensure it's cleared
    // Method 1: Set to 'none' with short expiry
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 1000), // 1 second
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? "none" : "lax",
      path: "/", // Add path to ensure cookie is cleared properly
    });

    // Method 2: Set empty value with expired date
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? "none" : "lax",
      path: "/",
    });

    console.log("Logout successful, cookie cleared");

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging out",
      error: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Google OAuth callback handler
const handleGoogleCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${config.frontendUrl}/user-login?error=Google authentication failed`
      );
    }

    // Generate JWT token
    const token = generateToken(req.user._id);

    // Use the same cookie options as in sendTokenResponse
    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      httpOnly: true,
      secure: config.isProduction || config.frontendUrl.startsWith("https"),
      sameSite: config.isProduction ? "none" : "lax",
      path: "/",
      // Don't set domain to allow the browser to use the current domain
    };

    console.log("Setting Google OAuth cookie with options:", cookieOptions);
    console.log("Token being set:", token.substring(0, 10) + "...");

    // Set the cookie
    res.cookie("token", token, cookieOptions);

    // Also set a non-httpOnly cookie for client-side detection
    res.cookie("auth_status", "logged_in", {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: false,
      secure: config.isProduction || config.frontendUrl.startsWith("https"),
      sameSite: config.isProduction ? "none" : "lax",
      path: "/",
    });

    // Pass the token in the URL for the frontend to use
    // This is a workaround for cross-domain cookie issues
    res.redirect(
      `${
        config.frontendUrl
      }?loginSuccess=true&tokenSet=true&token=${encodeURIComponent(token)}`
    );
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${config.frontendUrl}/user-login?error=Server error`);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  handleGoogleCallback,
};
