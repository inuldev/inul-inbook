const Story = require("../model/Story");
const User = require("../model/User");
const { cloudinary } = require("../middleware/upload");
const { extractPublicIdFromUrl } = require("../utils/cloudinaryUtils");

// @desc    Create a story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res) => {
  try {
    const { caption } = req.body;

    // Check if media is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Media is required for a story",
      });
    }

    // Create story object
    const storyData = {
      user: req.user.id,
      mediaUrl: req.file.path,
      mediaType: req.file.mimetype.startsWith("image") ? "image" : "video",
      caption: caption || "",
    };

    // Create story
    const story = await Story.create(storyData);

    // Populate user data
    const populatedStory = await Story.findById(story._id).populate({
      path: "user",
      select: "username profilePicture",
    });

    res.status(201).json({
      success: true,
      data: populatedStory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all stories
// @route   GET /api/stories
// @access  Public
const getStories = async (req, res) => {
  try {
    // Get stories that haven't expired
    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "username profilePicture",
      });

    res.status(200).json({
      success: true,
      data: stories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get stories from followed users and own stories
// @route   GET /api/stories/feed
// @access  Private
const getFeedStories = async (req, res) => {
  try {
    // Get current user
    const user = await User.findById(req.user.id);

    // Get stories from followed users and own stories that haven't expired
    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
      $or: [{ user: { $in: user.following } }, { user: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "username profilePicture",
      });

    res.status(200).json({
      success: true,
      data: stories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get a story
// @route   GET /api/stories/:id
// @access  Public
const getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate({
      path: "user",
      select: "username profilePicture",
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Check if story has expired
    if (story.expiresAt < new Date()) {
      return res.status(404).json({
        success: false,
        message: "Story has expired",
      });
    }

    res.status(200).json({
      success: true,
      data: story,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = async (req, res) => {
  try {
    // Find story
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Check if user is the owner
    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this story",
      });
    }

    // Delete media from Cloudinary if it exists
    if (story.mediaUrl) {
      try {
        const { publicId, resourceType } = extractPublicIdFromUrl(
          story.mediaUrl
        );
        if (publicId) {
          // Use the correct resource_type for deletion
          await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
          });
          console.log(
            `Deleted media from Cloudinary: ${publicId} (${resourceType})`
          );
        }
      } catch (cloudinaryError) {
        console.error("Error deleting media from Cloudinary:", cloudinaryError);
        // Continue with story deletion even if Cloudinary deletion fails
      }
    }

    // Delete story
    await story.deleteOne();

    res.status(200).json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    View a story
// @route   PUT /api/stories/:id/view
// @access  Private
const viewStory = async (req, res) => {
  try {
    // Find story
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Check if story has expired
    if (story.expiresAt < new Date()) {
      return res.status(404).json({
        success: false,
        message: "Story has expired",
      });
    }

    // Check if user has already viewed the story
    if (story.viewers.includes(req.user.id)) {
      return res.status(200).json({
        success: true,
        message: "Story already viewed",
      });
    }

    // Add viewer
    story.viewers.push(req.user.id);
    story.viewCount += 1;

    // Save story
    await story.save();

    res.status(200).json({
      success: true,
      message: "Story viewed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get user stories
// @route   GET /api/stories/user/:id
// @access  Public
const getUserStories = async (req, res) => {
  try {
    // Get stories that haven't expired
    const stories = await Story.find({
      user: req.params.id,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "username profilePicture",
      });

    res.status(200).json({
      success: true,
      data: stories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Create a story with direct upload URL
// @route   POST /api/stories/direct
// @access  Private
const createStoryWithDirectUpload = async (req, res) => {
  try {
    const { caption, mediaUrl, mediaType } = req.body;

    // Check if media URL is provided
    if (!mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "Media URL is required for a story",
      });
    }

    // Check if media type is provided
    if (!mediaType || !["image", "video"].includes(mediaType)) {
      return res.status(400).json({
        success: false,
        message: "Valid media type (image or video) is required",
      });
    }

    // Create story object
    const storyData = {
      user: req.user.id,
      mediaUrl,
      mediaType,
      caption: caption || "",
    };

    // Create story
    const story = await Story.create(storyData);

    // Populate user data
    const populatedStory = await Story.findById(story._id).populate({
      path: "user",
      select: "username profilePicture",
    });

    res.status(201).json({
      success: true,
      data: populatedStory,
    });
  } catch (error) {
    console.error("Error creating story with direct upload:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createStory,
  createStoryWithDirectUpload,
  getStories,
  getFeedStories,
  getStory,
  deleteStory,
  viewStory,
  getUserStories,
};
