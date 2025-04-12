const User = require("../model/User");
const FriendRequest = require("../model/FriendRequest");

// @desc    Get friend suggestions (all users except current user, friends, and pending requests)
// @route   GET /api/friends/suggestions
// @access  Private
const getFriendSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find all pending friend requests involving the current user
    const pendingRequests = await FriendRequest.find({
      $or: [
        { sender: currentUser._id, status: "pending" },
        { recipient: currentUser._id, status: "pending" },
      ],
    });

    // Extract user IDs from pending requests
    const pendingUserIds = pendingRequests.reduce((ids, request) => {
      // If current user is the sender, add recipient to excluded list
      if (request.sender.toString() === currentUser._id.toString()) {
        ids.push(request.recipient);
      }
      // If current user is the recipient, add sender to excluded list
      if (request.recipient.toString() === currentUser._id.toString()) {
        ids.push(request.sender);
      }
      return ids;
    }, []);

    // Get all users except current user, those in following/followers lists, and those with pending requests
    // Note: We only exclude users that are in BOTH following AND followers lists to ensure unfollowed users appear
    const suggestions = await User.find({
      $and: [
        { _id: { $ne: currentUser._id } },
        // Only exclude users that the current user is following
        { _id: { $nin: currentUser.following } },
        // We don't exclude followers here to ensure unfollowed users appear in suggestions
        { _id: { $nin: pendingUserIds } },
      ],
    }).select("username email profilePicture");

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("Error getting friend suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get friend requests for current user
// @route   GET /api/friends/requests
// @access  Private
const getFriendRequests = async (req, res) => {
  try {
    // Find all friend requests where the current user is the recipient
    const requests = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "username email profilePicture");

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error getting friend requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Send a friend request
// @route   POST /api/friends/request/:id
// @access  Private
const sendFriendRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if recipient exists
    const recipient = await User.findById(id);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    // Check if sender is trying to send a request to themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    // Check if any request exists (regardless of status)
    const existingRequest = await FriendRequest.findOne({
      sender: req.user.id,
      recipient: id,
    });

    if (existingRequest) {
      // If there's an existing request but it's not pending, update it
      if (existingRequest.status !== "pending") {
        existingRequest.status = "pending";
        await existingRequest.save();

        return res.status(200).json({
          success: true,
          data: existingRequest,
          message: "Friend request renewed",
        });
      } else {
        // If it's already pending, return an error
        return res.status(400).json({
          success: false,
          message: "Friend request already sent",
        });
      }
    }

    // If no existing request, create a new one
    const friendRequest = await FriendRequest.create({
      sender: req.user.id,
      recipient: id,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      data: friendRequest,
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Accept a friend request
// @route   PUT /api/friends/accept/:id
// @access  Private
const acceptFriendRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the friend request
    const friendRequest = await FriendRequest.findById(id);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // Check if the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this request",
      });
    }

    // Update the friend request status
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add each user to the other's following/followers lists to create a bidirectional relationship
    const sender = await User.findById(friendRequest.sender);
    const recipient = await User.findById(friendRequest.recipient);

    // Add recipient to sender's following list
    if (!sender.following.includes(recipient._id)) {
      sender.following.push(recipient._id);
      sender.followingCount += 1;
    }

    // Add sender to recipient's followers list
    if (!recipient.followers.includes(sender._id)) {
      recipient.followers.push(sender._id);
      recipient.followerCount += 1;
    }

    // Add sender to recipient's following list (for bidirectional friendship)
    if (!recipient.following.includes(sender._id)) {
      recipient.following.push(sender._id);
      recipient.followingCount += 1;
    }

    // Add recipient to sender's followers list (for bidirectional friendship)
    if (!sender.followers.includes(recipient._id)) {
      sender.followers.push(recipient._id);
      sender.followerCount += 1;
    }

    // Save both users
    await sender.save();
    await recipient.save();

    console.log(
      `Created bidirectional friendship between ${sender.username} and ${recipient.username}`
    );

    res.status(200).json({
      success: true,
      data: friendRequest,
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Decline a friend request
// @route   PUT /api/friends/decline/:id
// @access  Private
const declineFriendRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the friend request
    const friendRequest = await FriendRequest.findById(id);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // Check if the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to decline this request",
      });
    }

    // Instead of just updating the status, we'll delete the request
    // This will allow the user to reappear in friend suggestions
    await FriendRequest.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Friend request declined and removed",
    });
  } catch (error) {
    console.error("Error declining friend request:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Remove a friend
// @route   DELETE /api/friends/:id
// @access  Private
const removeFriend = async (req, res) => {
  try {
    const { id } = req.params;

    // Find both users
    const currentUser = await User.findById(req.user.id);
    const friend = await User.findById(id);

    if (!currentUser || !friend) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove friend from current user's following list
    currentUser.following = currentUser.following.filter(
      (followingId) => followingId.toString() !== id
    );
    currentUser.followingCount = currentUser.following.length;
    await currentUser.save();

    // Remove current user from friend's followers list
    friend.followers = friend.followers.filter(
      (followerId) => followerId.toString() !== req.user.id
    );
    friend.followerCount = friend.followers.length;
    await friend.save();

    res.status(200).json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getFriendSuggestions,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
};
