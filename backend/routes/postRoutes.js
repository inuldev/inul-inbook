const express = require("express");
const {
  createPost,
  createPostWithDirectUpload,
  getPosts,
  getFeedPosts,
  getPost,
  updatePost,
  updatePostWithDirectUpload,
  deletePost,
  likePost,
  unlikePost,
  commentOnPost,
  getPostComments,
  replyToComment,
  deleteComment,
  likeComment,
  unlikeComment,
  sharePost,
  getUserPosts,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");
const { postUpload, generateSignature } = require("../middleware/upload");

const router = express.Router();

// Public routes
router.get("/", getPosts);
router.get("/user/:id", getUserPosts);
router.get("/:id", getPost);
router.get("/:id/comments", getPostComments);

// Protected routes
router.post("/", protect, postUpload.single("media"), createPost);
router.post("/direct", protect, createPostWithDirectUpload);
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
      "posts",
      validResourceType
    );

    // Log the signature data in development
    if (process.env.NODE_ENV === "development") {
      console.log("Post upload signature data:", {
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
router.get("/feed/timeline", protect, getFeedPosts);
router.put("/:id", protect, updatePost);
router.put("/:id/direct", protect, updatePostWithDirectUpload);
router.delete("/:id", protect, deletePost);
router.put("/:id/like", protect, likePost);
router.put("/:id/unlike", protect, unlikePost);
router.put("/:id/share", protect, sharePost);
router.post("/:id/comment", protect, commentOnPost);
router.post("/comments/:id/reply", protect, replyToComment);
router.delete("/comments/:id", protect, deleteComment);
router.put("/comments/:id/like", protect, likeComment);
router.put("/comments/:id/unlike", protect, unlikeComment);

module.exports = router;
