const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/User");
const Bio = require("../model/Bio");
const config = require("./config");

// Only configure Google OAuth if credentials are provided
if (
  config.google.clientId &&
  config.google.clientSecret &&
  config.google.callbackUrl
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
        // Additional options based on environment
        proxy: config.isProduction, // Handle proxy in production
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            return done(null, user);
          }

          // If user doesn't exist, create a new user
          user = await User.create({
            username: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value,
          });

          // Create bio for user
          const bio = await Bio.create({
            user: user._id,
          });

          // Update user with bio reference
          user.bio = bio._id;
          await user.save();

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  if (config.isDevelopment) {
    console.log("🔑 Google OAuth strategy configured");
  }
} else if (config.isDevelopment) {
  console.warn("⚠️ Google OAuth not configured. Social login will not work.");
}

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
