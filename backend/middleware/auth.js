const jwt = require("jsonwebtoken");
const User = require("../model/User");
const config = require("../config/config");

const protect = async (req, res, next) => {
  try {
    let token;

    // Log all cookies and headers for debugging
    console.log("Auth middleware called for path:", req.path);
    console.log("All cookies in auth middleware:", req.cookies);
    console.log(
      "Authorization header:",
      req.headers.authorization ? "Present" : "Not present"
    );
    console.log("Request origin:", req.headers.origin);
    console.log("Request host:", req.headers.host);
    console.log("Request referrer:", req.headers.referrer);
    console.log("Is production:", process.env.NODE_ENV === "production");
    console.log("Frontend URL:", process.env.FRONTEND_URL);

    // Check multiple sources for the token in this order:
    // 1. Cookies (primary method)
    // 2. Authorization header (fallback for API calls)
    // 3. Query parameter (ultimate fallback for cross-domain issues)

    // 1. Check if token exists in cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log("Token found in cookies:", token.substring(0, 10) + "...");
    }
    // 2. Check if token exists in headers
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
    // 3. Check if token exists in query parameters (for cross-domain fallback)
    else if (req.query && req.query.token) {
      token = req.query.token;
      console.log(
        "Token found in query parameter:",
        token.substring(0, 10) + "..."
      );

      // If token is in query, set it as a cookie for future requests
      // This helps with subsequent requests after the initial authentication
      try {
        const isProduction = process.env.NODE_ENV === "production";
        const isSecure =
          req.secure || req.headers["x-forwarded-proto"] === "https";

        res.cookie("token", token, {
          httpOnly: true,
          secure: isProduction || isSecure,
          sameSite: "none", // For cross-domain cookies
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: "/",
        });

        console.log("Set token cookie from query parameter");
      } catch (cookieError) {
        console.error(
          "Error setting cookie from query parameter:",
          cookieError
        );
      }
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
