const Post = require("../model/Post");
const Comment = require("../model/Comment");
const User = require("../model/User");

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
      postData.mediaType = req.file.mimetype.startsWith("image") ? "image" : "video";
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
      $or: [
        { user: { $in: user.following } },
        { user: req.user.id },
      ],
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
      $or: [
        { user: { $in: user.following } },
        { user: req.user.id },
      ],
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
        populate: {
          path: "user",
          select: "username profilePicture",
        },
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
    const { content, privacy } = req.body;

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

    // Update post
    if (content) post.content = content;
    if (privacy) post.privacy = privacy;

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
    post.likes = post.likes.filter(
      (id) => id.toString() !== req.user.id
    );
    post.likeCount -= 1;

    // Save post
    await post.save();

    res.status(200).json({
      success: true,
      message: "Post unliked successfully",
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
    const comments = await Comment.find({ post: req.params.id, parentComment: null })
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
    const total = await Comment.countDocuments({ post: req.params.id, parentComment: null });

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
        post.commentCount = Math.max(0, post.commentCount - 1 - comment.replies.length);
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
    comment.likes = comment.likes.filter(
      (id) => id.toString() !== req.user.id
    );
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

module.exports = {
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
};
