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
        // Allow relative callback URLs
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google OAuth callback received");
          console.log("Profile ID:", profile.id);
          console.log("Profile display name:", profile.displayName);
          console.log("Profile email:", profile.emails?.[0]?.value);
          console.log("Request cookies:", req.cookies);
          console.log("Request headers origin:", req.headers.origin);
          console.log("Request headers referrer:", req.headers.referrer);

          // Check if user already exists by email
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            console.log("Existing user found with ID:", user._id);

            // Update Google ID if not already set
            if (!user.googleId && profile.id) {
              user.googleId = profile.id;
              await user.save();
              console.log("Updated existing user with Google ID");
            }

            return done(null, user);
          }

          console.log("Creating new user from Google profile");
          // If user doesn't exist, create a new user
          user = await User.create({
            username: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value,
            googleId: profile.id, // Store Google ID for future logins
          });

          console.log("New user created with ID:", user._id);

          // Create bio for user
          const bio = await Bio.create({
            user: user._id,
          });

          // Update user with bio reference
          user.bio = bio._id;
          await user.save();
          console.log("Bio created and linked to user");

          return done(null, user);
        } catch (error) {
          console.error("Error in Google OAuth callback:", error);
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
