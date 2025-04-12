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
    path: "/", // Ensure consistent path for all cookies
    domain: undefined, // Let the browser set the domain automatically
  };

  // Handle SameSite and Secure attributes based on environment
  if (config.isProduction) {
    // In production, use SameSite=None with Secure=true
    options.sameSite = "none";
    options.secure = true;
  } else {
    // In development, use SameSite=Lax and Secure based on protocol
    options.sameSite = "lax";
    options.secure = config.frontendUrl.startsWith("https");
  }

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

    // Create user - the password will be hashed by the pre-save middleware
    const user = await User.create({
      username,
      email,
      password, // The User model's pre-save middleware will hash this
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

    // Add debugging
    console.log(`Login attempt for email: ${email}`);
    console.log(`User found: ${user ? "Yes" : "No"}`);

    if (!user) {
      console.log("Login failed: User not found");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    console.log(`Password match: ${isMatch ? "Yes" : "No"}`);

    if (!isMatch) {
      console.log("Login failed: Password does not match");
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
    // Prepare cookie options
    const cookieOptions = {
      httpOnly: true,
      path: "/", // Add path to ensure cookie is cleared properly
    };

    // Handle SameSite and Secure attributes based on environment
    if (config.isProduction) {
      // In production, use SameSite=None with Secure=true
      cookieOptions.sameSite = "none";
      cookieOptions.secure = true;
    } else {
      // In development, use SameSite=Lax and Secure based on protocol
      cookieOptions.sameSite = "lax";
      cookieOptions.secure = config.frontendUrl.startsWith("https");
    }

    // Method 1: Set to 'none' with short expiry
    res.cookie("token", "none", {
      ...cookieOptions,
      expires: new Date(Date.now() + 1000), // 1 second
    });

    // Method 2: Set empty value with expired date
    res.cookie("token", "", {
      ...cookieOptions,
      expires: new Date(0),
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

// Google OAuth callback handler with enhanced cross-domain support
const handleGoogleCallback = (req, res) => {
  try {
    console.log("Google OAuth callback handler executing");
    console.log("User authenticated:", !!req.user);
    console.log("Request session:", req.session ? "exists" : "missing");

    if (!req.user) {
      console.error("No user found in request after Google authentication");
      return res.redirect(
        `${
          config.frontendUrl
        }/user-login?error=Google authentication failed&reason=no_user&time=${Date.now()}`
      );
    }

    // Generate JWT token
    const token = generateToken(req.user._id);
    console.log("Generated JWT token:", token.substring(0, 10) + "...");

    // Prepare user data
    const userData = {
      _id: req.user._id,
      username: req.user.username || "",
      email: req.user.email || "",
      profilePicture: req.user.profilePicture || "",
    };
    console.log("User data prepared:", {
      ...userData,
      _id: userData._id.toString(),
    });

    // Build the redirect URL with all necessary parameters
    console.log("Building redirect URL with frontendUrl:", config.frontendUrl);
    const redirectUrl = new URL(`${config.frontendUrl}/google-callback`);
    const params = new URLSearchParams({
      provider: "google",
      success: "true",
      token: token,
      userId: userData._id.toString(),
      username: userData.username,
      email: userData.email,
      profilePicture: userData.profilePicture,
      tokenSet: "true",
      timestamp: Date.now().toString(),
    });
    redirectUrl.search = params.toString();

    // Log the full redirect URL and parameters for debugging
    console.log("Redirect URL prepared:", redirectUrl.toString());
    console.log("Redirect URL parameters:", {
      provider: "google",
      success: "true",
      token: token ? token.substring(0, 10) + "..." : "missing",
      tokenLength: token ? token.length : 0,
      userId: userData._id.toString(),
      username: userData.username,
      email: userData.email,
      profilePicture: userData.profilePicture ? "present" : "missing",
    });

    // Pendekatan baru: Fokus pada pengiriman token melalui URL parameter
    // dan tidak mengandalkan cookie untuk cross-domain authentication

    console.log("Using URL parameter approach for cross-domain authentication");

    // Tetap coba set cookie sebagai fallback, tetapi dengan pendekatan yang berbeda
    try {
      // Base cookie options
      const cookieOptions = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        path: "/",
      };

      const isProduction = config.isProduction;
      const isSecureConnection =
        req.secure || req.headers["x-forwarded-proto"] === "https";

      // Untuk development, gunakan pengaturan yang lebih permisif
      if (!isProduction) {
        // Untuk development, gunakan SameSite=Lax dan tidak httpOnly untuk memudahkan debugging
        res.cookie("dev_token", token, {
          ...cookieOptions,
          httpOnly: false,
          sameSite: "lax",
          secure: false,
        });

        res.cookie("dev_auth_status", "logged_in", {
          ...cookieOptions,
          httpOnly: false,
          sameSite: "lax",
          secure: false,
        });

        console.log("Set development cookies with permissive settings");
      } else {
        // Untuk production, tetap coba set cookie dengan pengaturan yang aman
        cookieOptions.sameSite = "none";
        cookieOptions.secure = true;
        cookieOptions.httpOnly = true;

        res.cookie("token", token, cookieOptions);
        res.cookie("auth_status", "logged_in", {
          ...cookieOptions,
          httpOnly: false,
        });

        console.log("Set production cookies with secure settings");
      }
    } catch (cookieError) {
      console.error("Error setting cookies:", cookieError);
    }

    // Log environment info
    console.log("Environment info:", {
      isProduction: config.isProduction,
      frontendUrl: config.frontendUrl,
      headers: {
        origin: req.headers.origin,
        referrer: req.headers.referrer,
        host: req.headers.host,
        "x-forwarded-proto": req.headers["x-forwarded-proto"],
      },
    });

    console.log("Redirecting to frontend with token in URL parameters");

    // Redirect to the frontend with all parameters
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Google callback error:", error);
    return res.redirect(
      `${config.frontendUrl}/user-login?error=${encodeURIComponent(
        "Server error during authentication"
      )}&stack=${encodeURIComponent(error.stack || "")}&time=${Date.now()}`
    );
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  handleGoogleCallback,
};
