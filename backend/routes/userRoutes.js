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

// Public routes
router.get("/search", searchUsers);
router.get("/followers/:id", getUserFollowers);
router.get("/following/:id", getUserFollowing);
router.get("/mutual-friends/:id", protect, getMutualFriends);
router.get("/:id", getUserProfile);

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
