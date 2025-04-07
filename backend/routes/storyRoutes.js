const express = require("express");
const {
  createStory,
  getStories,
  getFeedStories,
  getStory,
  deleteStory,
  viewStory,
  getUserStories,
} = require("../controllers/storyController");
const { protect } = require("../middleware/auth");
const { storyUpload, generateSignature } = require("../middleware/upload");

const router = express.Router();

// Public routes
router.get("/", getStories);
router.get("/user/:id", getUserStories);
router.get("/:id", getStory);

// Protected routes
router.post("/", protect, storyUpload.single("media"), createStory);
router.post("/upload-signature", protect, (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    const signatureData = generateSignature(publicId, "stories");

    res.status(200).json({
      success: true,
      data: signatureData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});
router.get("/feed/timeline", protect, getFeedStories);
router.delete("/:id", protect, deleteStory);
router.put("/:id/view", protect, viewStory);

module.exports = router;
