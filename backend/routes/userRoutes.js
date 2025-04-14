const express = require("express");
const {
  getUserProfile,
  updateProfile,
  updateBio,
  uploadProfilePicture,
  uploadCoverPhoto,
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  searchUsers,
  getMutualFriends,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { profileUpload } = require("../middleware/upload");

const router = express.Router();

// Public routes with optional authentication
// These routes work for both authenticated and non-authenticated users
// but provide different results based on authentication status
router.get("/search", protect, searchUsers);
router.get("/followers/:id", protect, getUserFollowers);
router.get("/following/:id", protect, getUserFollowing);
router.get("/mutual-friends/:id", protect, getMutualFriends);
router.get("/:id", protect, getUserProfile);

// Protected routes
router.put("/profile", protect, updateProfile);
router.put("/bio", protect, updateBio);
router.put(
  "/profile-picture",
  protect,
  profileUpload.single("profilePicture"),
  uploadProfilePicture
);
router.put(
  "/cover-photo",
  protect,
  profileUpload.single("coverPhoto"),
  uploadCoverPhoto
);
router.put("/follow/:id", protect, followUser);
router.put("/unfollow/:id", protect, unfollowUser);

module.exports = router;
