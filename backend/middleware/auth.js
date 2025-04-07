const jwt = require("jsonwebtoken");
const User = require("../model/User");
const config = require("../config/config");

const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Check if token exists in headers
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
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
