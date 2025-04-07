const express = require("express");
const {
  createPost,
  getPosts,
  getFeedPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  commentOnPost,
  getPostComments,
  replyToComment,
  deleteComment,
  likeComment,
  unlikeComment,
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
router.post("/upload-signature", protect, (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    const signatureData = generateSignature(publicId, "posts");

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
router.get("/feed/timeline", protect, getFeedPosts);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);
router.put("/:id/like", protect, likePost);
router.put("/:id/unlike", protect, unlikePost);
router.post("/:id/comment", protect, commentOnPost);
router.post("/comments/:id/reply", protect, replyToComment);
router.delete("/comments/:id", protect, deleteComment);
router.put("/comments/:id/like", protect, likeComment);
router.put("/comments/:id/unlike", protect, unlikeComment);

module.exports = router;
