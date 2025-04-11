const express = require("express");
const {
  createStory,
  createStoryWithDirectUpload,
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
router.post("/direct", protect, createStoryWithDirectUpload);
router.post("/upload-signature", protect, (req, res) => {
  try {
    const { publicId, resourceType } = req.body;
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    // Use the provided resourceType or default to "auto"
    const validResourceType = ["image", "video", "auto"].includes(resourceType)
      ? resourceType
      : "auto";

    // Generate signature with the appropriate resource type
    const signatureData = generateSignature(
      publicId,
      "stories",
      validResourceType
    );

    // Log the signature data in development
    if (process.env.NODE_ENV === "development") {
      console.log("Story upload signature data:", {
        publicId,
        resourceType: validResourceType,
        timestamp: signatureData.timestamp,
      });
    }

    res.status(200).json({
      success: true,
      data: signatureData,
    });
  } catch (error) {
    console.error("Error generating upload signature:", error);
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
