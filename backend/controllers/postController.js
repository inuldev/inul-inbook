const Post = require("../model/Post");
const Comment = require("../model/Comment");
const User = require("../model/User");
const { cloudinary } = require("../middleware/upload");

// Helper function to extract public ID from Cloudinary URL
const extractPublicIdFromUrl = (url) => {
  try {
    if (!url) return null;

    // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/social-media-app/posts/post_1234567890.jpg
    // or https://res.cloudinary.com/cloud-name/video/upload/v1234567890/social-media-app/posts/post_1234567890.mp4

    // Extract the path after /upload/
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    const pathAfterUpload = url.substring(uploadIndex + 8);

    // Remove version number if present (v1234567890/)
    const versionRemoved = pathAfterUpload.replace(/^v\d+\//, "");

    // Remove file extension
    const publicId = versionRemoved.replace(/\.[^/.]+$/, "");

    return publicId;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { content, privacy } = req.body;

    // Check if content is provided
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    // Create post object
    const postData = {
      user: req.user.id,
      content,
      privacy: privacy || "public",
    };

    // Add media if uploaded
    if (req.file) {
      postData.mediaUrl = req.file.path;
      postData.mediaType = req.file.mimetype.startsWith("image")
        ? "image"
        : "video";
    }

    // Create post
    const post = await Post.create(postData);

    // Populate user data
    const populatedPost = await Post.findById(post._id).populate({
      path: "user",
      select: "username profilePicture",
    });

    res.status(201).json({
      success: true,
      data: populatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get posts
    const posts = await Post.find({ privacy: "public" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "user",
        select: "username profilePicture",
      });

    // Get total count
    const total = await Post.countDocuments({ privacy: "public" });

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get feed posts (posts from followed users and own posts)
// @route   GET /api/posts/feed
// @access  Private
const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get current user
    const user = await User.findById(req.user.id);

    // Get posts from followed users and own posts
    const posts = await Post.find({
      $or: [{ user: { $in: user.following } }, { user: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "user",
        select: "username profilePicture",
      });

    // Get total count
    const total = await Post.countDocuments({
      $or: [{ user: { $in: user.following } }, { user: req.user.id }],
    });

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get a post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate({
        path: "user",
        select: "username profilePicture",
      })
      .populate({
        path: "comments",
        populate: [
          {
            path: "user",
            select: "username profilePicture",
          },
          {
            path: "replies",
            populate: {
              path: "user",
              select: "username profilePicture",
            },
          },
        ],
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if post is private and user is not the owner
    if (
      post.privacy === "private" &&
      (!req.user || post.user._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this post",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const { content, privacy, mediaUrl, mediaType } = req.body;

    // Find post
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the owner
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this post",
      });
    }

    // Handle media changes
    if (mediaUrl && mediaUrl !== post.mediaUrl) {
      // If there was previous media, delete it from Cloudinary
      if (post.mediaUrl) {
        try {
          const oldPublicId = extractPublicIdFromUrl(post.mediaUrl);
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId);
            console.log(`Deleted old media from Cloudinary: ${oldPublicId}`);
          }
        } catch (cloudinaryError) {
          console.error(
            "Error deleting old media from Cloudinary:",
            cloudinaryError
          );
          // Continue with update even if Cloudinary deletion fails
        }
      }

      // Update with new media
      post.mediaUrl = mediaUrl;
      post.mediaType = mediaType || "image";
    }

    // Update other fields
    if (content !== undefined) post.content = content;
    if (privacy !== undefined) post.privacy = privacy;

    // Save post
    await post.save();

    // Populate user data
    post = await Post.findById(post._id).populate({
      path: "user",
      select: "username profilePicture",
    });

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    // Find post
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the owner
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    // Delete media from Cloudinary if it exists
    if (post.mediaUrl) {
      try {
        const publicId = extractPublicIdFromUrl(post.mediaUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Deleted media from Cloudinary: ${publicId}`);
        }
      } catch (cloudinaryError) {
        console.error("Error deleting media from Cloudinary:", cloudinaryError);
        // Continue with post deletion even if Cloudinary deletion fails
      }
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: req.params.id });

    // Delete post
    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    // Find post
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if post is already liked
    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "Post already liked",
      });
    }

    // Add like
    post.likes.push(req.user.id);
    post.likeCount += 1;

    // Save post
    await post.save();

    res.status(200).json({
      success: true,
      message: "Post liked successfully",
      userId: req.user.id,
      data: {
        likeCount: post.likeCount,
        likes: post.likes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Unlike a post
// @route   PUT /api/posts/:id/unlike
// @access  Private
const unlikePost = async (req, res) => {
  try {
    // Find post
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if post is not liked
    if (!post.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "Post not liked yet",
      });
    }

    // Remove like
    post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    post.likeCount -= 1;

    // Save post
    await post.save();

    res.status(200).json({
      success: true,
      message: "Post unliked successfully",
      userId: req.user.id,
      data: {
        likeCount: post.likeCount,
        likes: post.likes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;

    // Check if text is provided
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    // Find post
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Create comment
    const comment = await Comment.create({
      user: req.user.id,
      post: req.params.id,
      text,
    });

    // Add comment to post
    post.comments.push(comment._id);
    post.commentCount += 1;

    // Save post
    await post.save();

    // Populate user data
    const populatedComment = await Comment.findById(comment._id).populate({
      path: "user",
      select: "username profilePicture",
    });

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get post comments
// @route   GET /api/posts/:id/comments
// @access  Public
const getPostComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find post
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if post is private and user is not the owner
    if (
      post.privacy === "private" &&
      (!req.user || post.user.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this post",
      });
    }

    // Get comments
    const comments = await Comment.find({
      post: req.params.id,
      parentComment: null,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "user",
        select: "username profilePicture",
      })
      .populate({
        path: "replies",
        populate: {
          path: "user",
          select: "username profilePicture",
        },
      });

    // Get total count
    const total = await Comment.countDocuments({
      post: req.params.id,
      parentComment: null,
    });

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Reply to a comment
// @route   POST /api/posts/comments/:id/reply
// @access  Private
const replyToComment = async (req, res) => {
  try {
    const { text } = req.body;

    // Check if text is provided
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Reply text is required",
      });
    }

    // Find parent comment
    const parentComment = await Comment.findById(req.params.id);

    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Create reply
    const reply = await Comment.create({
      user: req.user.id,
      post: parentComment.post,
      text,
      parentComment: parentComment._id,
    });

    // Add reply to parent comment
    parentComment.replies.push(reply._id);
    await parentComment.save();

    // Populate user data
    const populatedReply = await Comment.findById(reply._id).populate({
      path: "user",
      select: "username profilePicture",
    });

    res.status(201).json({
      success: true,
      data: populatedReply,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/posts/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    // Find comment
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user is the owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    // If it's a parent comment, delete all replies
    if (!comment.parentComment) {
      await Comment.deleteMany({ parentComment: req.params.id });

      // Update post comment count
      const post = await Post.findById(comment.post);
      if (post) {
        post.comments = post.comments.filter(
          (id) => id.toString() !== req.params.id
        );
        post.commentCount = Math.max(
          0,
          post.commentCount - 1 - comment.replies.length
        );
        await post.save();
      }
    } else {
      // If it's a reply, update parent comment
      const parentComment = await Comment.findById(comment.parentComment);
      if (parentComment) {
        parentComment.replies = parentComment.replies.filter(
          (id) => id.toString() !== req.params.id
        );
        await parentComment.save();
      }
    }

    // Delete comment
    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Like a comment
// @route   PUT /api/posts/comments/:id/like
// @access  Private
const likeComment = async (req, res) => {
  try {
    // Find comment
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if comment is already liked
    if (comment.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "Comment already liked",
      });
    }

    // Add like
    comment.likes.push(req.user.id);
    comment.likeCount += 1;

    // Save comment
    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment liked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Share a post
// @route   POST /api/posts/:id/share
// @access  Private
const sharePost = async (req, res) => {
  try {
    const { platform } = req.body;

    // Validate platform
    const validPlatforms = ["facebook", "twitter", "linkedin", "copy", "other"];
    const sharePlatform = validPlatforms.includes(platform)
      ? platform
      : "other";

    // Find post
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Increment share count
    post.shareCount = (post.shareCount || 0) + 1;

    // Add share record
    post.shares.push({
      user: req.user.id,
      platform: sharePlatform,
      createdAt: new Date(),
    });

    // Save post
    await post.save();

    res.status(200).json({
      success: true,
      message: "Post shared successfully",
      data: {
        shareCount: post.shareCount,
        platform: sharePlatform,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Unlike a comment
// @route   PUT /api/posts/comments/:id/unlike
// @access  Private
const unlikeComment = async (req, res) => {
  try {
    // Find comment
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if comment is not liked
    if (!comment.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "Comment not liked yet",
      });
    }

    // Remove like
    comment.likes = comment.likes.filter((id) => id.toString() !== req.user.id);
    comment.likeCount -= 1;

    // Save comment
    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment unliked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get user posts
// @route   GET /api/posts/user/:id
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get posts
    const posts = await Post.find({
      user: req.params.id,
      privacy: "public",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "user",
        select: "username profilePicture",
      });

    // Get total count
    const total = await Post.countDocuments({
      user: req.params.id,
      privacy: "public",
    });

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Create a post with direct upload URL
// @route   POST /api/posts/direct
// @access  Private
const createPostWithDirectUpload = async (req, res) => {
  try {
    const { content, privacy, mediaUrl, mediaType } = req.body;

    // Check if content is provided
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    // Create post object
    const postData = {
      user: req.user.id,
      content,
      privacy: privacy || "public",
    };

    // Add media if provided
    if (mediaUrl) {
      postData.mediaUrl = mediaUrl;
      postData.mediaType = mediaType || "image";
    }

    // Create post
    const post = await Post.create(postData);

    // Populate user data
    const populatedPost = await Post.findById(post._id).populate({
      path: "user",
      select: "username profilePicture",
    });

    res.status(201).json({
      success: true,
      data: populatedPost,
    });
  } catch (error) {
    console.error("Error creating post with direct upload:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update a post with direct upload URL
// @route   PUT /api/posts/:id/direct
// @access  Private
const updatePostWithDirectUpload = async (req, res) => {
  try {
    const { content, privacy, mediaUrl, mediaType } = req.body;

    // Find post
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the owner
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this post",
      });
    }

    // Handle media changes
    if (mediaUrl && mediaUrl !== post.mediaUrl) {
      // If there was previous media, delete it from Cloudinary
      if (post.mediaUrl) {
        try {
          const oldPublicId = extractPublicIdFromUrl(post.mediaUrl);
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId);
            console.log(`Deleted old media from Cloudinary: ${oldPublicId}`);
          }
        } catch (cloudinaryError) {
          console.error(
            "Error deleting old media from Cloudinary:",
            cloudinaryError
          );
          // Continue with update even if Cloudinary deletion fails
        }
      }

      // Update with new media
      post.mediaUrl = mediaUrl;
      post.mediaType = mediaType || "image";
    }

    // Update other fields
    if (content !== undefined) post.content = content;
    if (privacy !== undefined) post.privacy = privacy;

    // Save post
    await post.save();

    // Populate user data
    post = await Post.findById(post._id).populate({
      path: "user",
      select: "username profilePicture",
    });

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error updating post with direct upload:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
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
};
