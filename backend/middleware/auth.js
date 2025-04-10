const jwt = require("jsonwebtoken");
const User = require("../model/User");
const config = require("../config/config");

const protect = async (req, res, next) => {
  try {
    let token;

    // Log all cookies for debugging
    console.log("All cookies in auth middleware:", req.cookies);
    console.log("Authorization header:", req.headers.authorization);
    console.log("Request origin:", req.headers.origin);
    console.log("Request host:", req.headers.host);
    console.log("Request referer:", req.headers.referer);
    console.log("Is production:", process.env.NODE_ENV === "production");
    console.log("Frontend URL:", process.env.FRONTEND_URL);

    // Check if token exists in cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log("Token found in cookies:", token.substring(0, 10) + "...");
    }
    // Check if token exists in headers
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log(
        "Token found in authorization header:",
        token.substring(0, 10) + "..."
      );
    }

    if (!token) {
      console.log("No token found in request");
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log("Token decoded:", decoded);

    // Get user from the token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("No user found with token ID:", decoded.id);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
      error: error.message,
    });
  }
};

module.exports = { protect };
