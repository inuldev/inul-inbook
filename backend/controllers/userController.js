const User = require("../model/User");
const Bio = require("../model/Bio");
const mongoose = require("mongoose");

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("bio");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { username, gender, dateOfBirth } = req.body;

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user fields
    if (username) user.username = username;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    // Save user
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update user bio
// @route   PUT /api/users/bio
// @access  Private
const updateBio = async (req, res) => {
  try {
    const { about, work, education, location, relationship, website, phone } =
      req.body;

    // Find bio
    let bio = await Bio.findOne({ user: req.user.id });

    if (!bio) {
      // Create bio if it doesn't exist
      bio = await Bio.create({
        user: req.user.id,
      });

      // Update user with bio reference
      const user = await User.findById(req.user.id);
      user.bio = bio._id;
      await user.save();
    }

    // Update bio fields
    if (about !== undefined) bio.about = about;
    if (work !== undefined) bio.work = work;
    if (education !== undefined) bio.education = education;
    if (location !== undefined) bio.location = location;
    if (relationship !== undefined) bio.relationship = relationship;
    if (website !== undefined) bio.website = website;
    if (phone !== undefined) bio.phone = phone;

    // Save bio
    await bio.save();

    res.status(200).json({
      success: true,
      data: bio,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Upload profile picture
// @route   PUT /api/users/profile-picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update profile picture
    user.profilePicture = req.file.path;

    // Save user
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Upload cover photo
// @route   PUT /api/users/cover-photo
// @access  Private
const uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update cover photo
    user.coverPhoto = req.file.path;

    // Save user
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Follow user
// @route   PUT /api/users/follow/:id
// @access  Private
const followUser = async (req, res) => {
  try {
    // Check if user is trying to follow themselves
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    // Find user to follow
    const userToFollow = await User.findById(req.params.id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find current user
    const currentUser = await User.findById(req.user.id);

    // Check if already following
    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "You are already following this user",
      });
    }

    // Add to following
    currentUser.following.push(req.params.id);
    currentUser.followingCount += 1;

    // Add to followers
    userToFollow.followers.push(req.user.id);
    userToFollow.followerCount += 1;

    // Save both users
    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      message: "User followed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Unfollow user
// @route   PUT /api/users/unfollow/:id
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    // Check if user is trying to unfollow themselves
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot unfollow yourself",
      });
    }

    // Find user to unfollow
    const userToUnfollow = await User.findById(req.params.id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find current user
    const currentUser = await User.findById(req.user.id);

    // Check if not following
    if (!currentUser.following.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "You are not following this user",
      });
    }

    // For bidirectional friendship, we need to remove both directions

    // 1. Remove the target user from current user's following list
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== req.params.id
    );
    currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);

    // 2. Remove the target user from current user's followers list
    currentUser.followers = currentUser.followers.filter(
      (id) => id.toString() !== req.params.id
    );
    currentUser.followerCount = Math.max(0, currentUser.followerCount - 1);

    // 3. Remove the current user from target user's following list
    userToUnfollow.following = userToUnfollow.following.filter(
      (id) => id.toString() !== req.user.id
    );
    userToUnfollow.followingCount = Math.max(
      0,
      userToUnfollow.followingCount - 1
    );

    // 4. Remove the current user from target user's followers list
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== req.user.id
    );
    userToUnfollow.followerCount = Math.max(
      0,
      userToUnfollow.followerCount - 1
    );

    console.log(
      `Removed bidirectional friendship between ${currentUser.username} and ${userToUnfollow.username}`
    );

    // Save both users
    await currentUser.save();
    await userToUnfollow.save();

    // Find and update any existing friend requests between these users
    // This will ensure that if they try to follow each other again, they won't get duplicate key errors
    try {
      const FriendRequest = require("../model/FriendRequest");

      // Find any friend requests between these users (in either direction)
      const existingRequests = await FriendRequest.find({
        $or: [
          { sender: currentUser._id, recipient: userToUnfollow._id },
          { sender: userToUnfollow._id, recipient: currentUser._id },
        ],
      });

      // If there are any requests, mark them as 'declined' instead of deleting
      // This preserves the record but allows new requests to be sent
      for (const request of existingRequests) {
        request.status = "declined";
        await request.save();
      }

      console.log(
        `Updated ${existingRequests.length} friend requests after unfollow`
      );
    } catch (friendRequestError) {
      console.error(
        "Error updating friend requests after unfollow:",
        friendRequestError
      );
      // Continue even if this fails, as the main unfollow operation succeeded
    }

    res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get user followers
// @route   GET /api/users/followers/:id
// @access  Public
const getUserFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "username profilePicture")
      .select("followers");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user.followers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get user following
// @route   GET /api/users/following/:id
// @access  Public
const getUserFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate(
        "following",
        "username email profilePicture followerCount followingCount"
      )
      .select("following");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      `Returning ${user.following.length} following users for user ${req.params.id}`
    );

    res.status(200).json({
      success: true,
      data: user.following,
    });
  } catch (error) {
    console.error("Error getting user following:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Please provide a search query",
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("username email profilePicture");

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get mutual friends between current user and another user
// @route   GET /api/users/mutual-friends/:id
// @access  Private
const getMutualFriends = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If the user is viewing their own profile, return their following list
    if (currentUser._id.toString() === targetUser._id.toString()) {
      const following = await User.find({
        _id: { $in: currentUser.following },
      }).select("username email profilePicture followerCount");

      return res.status(200).json({
        success: true,
        data: following,
      });
    }

    // Find true mutual friends (bidirectional relationship)
    // These are users who are both in the current user's following list AND followers list
    // This ensures we only show users with a complete bidirectional friendship

    // Get users that the current user follows
    const currentUserFollowing = currentUser.following.map((id) =>
      id.toString()
    );

    // Get users that follow the current user
    const currentUserFollowers = currentUser.followers.map((id) =>
      id.toString()
    );

    // For true mutual friendship, find users that are both in following AND followers
    // This means there's a bidirectional relationship
    const mutualFriendIds = currentUserFollowing.filter((id) =>
      currentUserFollowers.includes(id)
    );

    console.log(
      `Found ${mutualFriendIds.length} mutual friends for user ${currentUser.username}`
    );

    // Get the user details for these mutual friends
    const mutualFriends = await User.find({
      _id: { $in: mutualFriendIds },
    }).select("username email profilePicture followerCount followingCount");

    res.status(200).json({
      success: true,
      data: mutualFriends,
    });
  } catch (error) {
    console.error("Error getting mutual friends:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
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
};
