const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    gender: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    profilePicture: { type: String, default: null },
    coverPhoto: { type: String, default: null },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    bio: { type: mongoose.Schema.Types.ObjectId, ref: "Bio" },
  },
  { timestamps: true }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  // If user was created with Google OAuth, they won't have a password
  if (!this.password) {
    console.log("User has no password (likely OAuth user)");
    return false;
  }

  // Add debugging for password comparison
  console.log("Comparing passwords:");
  console.log("- Entered password length:", enteredPassword.length);
  console.log(
    "- Stored hashed password:",
    this.password.substring(0, 10) + "..."
  );

  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  console.log("- Password match result:", isMatch);

  return isMatch;
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

// Middleware to hash password before saving if modified
userSchema.pre("save", async function (next) {
  console.log("Pre-save middleware triggered");
  console.log("- Is password modified:", this.isModified("password"));
  console.log("- Has password:", !!this.password);

  if (!this.isModified("password") || !this.password) {
    console.log("- Skipping password hashing (not modified or no password)");
    next();
    return;
  }

  try {
    console.log("- Hashing password in pre-save middleware");
    console.log("- Original password length:", this.password.length);

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    console.log("- Password hashed successfully");
    console.log("- Hashed password:", this.password.substring(0, 10) + "...");

    next();
  } catch (error) {
    console.error("- Error hashing password:", error);
    next(error);
  }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
