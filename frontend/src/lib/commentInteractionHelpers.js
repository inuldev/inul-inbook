/**
 * Comment Interaction Helpers
 *
 * This module provides helper functions for comment interactions (like, reply, update, delete)
 * that can be used across different components.
 *
 * These functions are designed to:
 * 1. Provide a consistent interface for comment interactions
 * 2. Handle optimistic updates for better UX
 * 3. Properly handle errors and rollbacks
 * 4. Update UI state consistently
 */

import config from "@/lib/config";
import userStore from "@/store/userStore";
import usePostStore from "@/store/postStore";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";

/**
 * Toggle like status for a comment
 * @param {string} commentId - The comment ID
 * @param {boolean} isLiked - Current like status in UI
 * @param {Function} setIsLiked - Function to update like status state
 * @param {Function} setLikeCount - Function to update like count state
 * @returns {Promise<void>}
 */
export const toggleCommentLike = async (
  commentId,
  isLiked,
  setIsLiked,
  setLikeCount
) => {
  try {
    // Get current user
    const { user } = userStore.getState();
    if (!user || !user._id) {
      showErrorToast("Please log in to like comments");
      return;
    }

    // Toggle the like state immediately for better UX
    const newLikedState = !isLiked;

    // Update UI immediately (optimistic update)
    setIsLiked(newLikedState);
    setLikeCount((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

    // Make the API call
    const endpoint = newLikedState ? "like" : "unlike";
    const response = await fetch(
      `${config.backendUrl}/api/posts/comments/${commentId}/${endpoint}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: config.apiTimeouts.short,
      }
    );

    const data = await response.json();

    if (!data.success) {
      // Revert UI changes on error
      setIsLiked(isLiked);
      setLikeCount((prev) => (isLiked ? prev : Math.max(0, prev - 1)));
      throw new Error(data.message || "Failed to update like status");
    }

    // Show success message
    showSuccessToast(newLikedState ? "Comment liked" : "Comment unliked");
  } catch (error) {
    console.error("Error toggling comment like:", error);
    showErrorToast("Failed to update like status");
  }
};

/**
 * Delete a comment
 * @param {string} commentId - The comment ID
 * @param {string} postId - The post ID
 * @param {Function} onCommentDeleted - Callback function after comment is deleted
 * @returns {Promise<void>}
 */
export const deleteComment = async (commentId, postId, onCommentDeleted) => {
  try {
    // Get the current user from userStore
    const { user: currentUser } = userStore.getState();

    // Check if user is logged in
    if (!currentUser || !currentUser._id) {
      showErrorToast("Please log in to delete comments");
      return;
    }

    // Make the API call
    const response = await fetch(
      `${config.backendUrl}/api/posts/comments/${commentId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: config.apiTimeouts.medium,
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to delete comment");
    }

    // Fetch the updated post to get the latest comments
    const postStore = usePostStore.getState();
    await postStore.fetchPost(postId);

    // Call the callback function
    if (onCommentDeleted) {
      onCommentDeleted(commentId);
    }

    // Show success message
    showSuccessToast("Comment deleted");
  } catch (error) {
    console.error("Error deleting comment:", error);
    showErrorToast("Failed to delete comment");
  }
};

/**
 * Update a comment
 * @param {string} commentId - The comment ID
 * @param {string} postId - The post ID
 * @param {string} commentText - The updated comment text
 * @param {Function} onCommentUpdated - Callback function after comment is updated
 * @returns {Promise<void>}
 */
export const updateComment = async (
  commentId,
  postId,
  commentText,
  onCommentUpdated
) => {
  try {
    // Get current user
    const { user } = userStore.getState();
    if (!user || !user._id) {
      showErrorToast("Please log in to update comments");
      return;
    }

    // Check if comment text is empty
    if (!commentText.trim()) {
      showErrorToast("Comment text cannot be empty");
      return;
    }

    // Make the API call
    const response = await fetch(
      `${config.backendUrl}/api/posts/comments/${commentId}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentText.trim() }),
        timeout: config.apiTimeouts.medium,
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to update comment");
    }

    // Get the updated comment from the server
    const updatedComment = data.data;

    // Fetch the updated post to get the latest comments
    const postStore = usePostStore.getState();
    await postStore.fetchPost(postId);

    // Call the callback function with the updated comment
    if (onCommentUpdated) {
      onCommentUpdated(updatedComment);
    }

    // Show success message
    showSuccessToast("Comment updated");
  } catch (error) {
    console.error("Error updating comment:", error);
    showErrorToast("Failed to update comment");
  }
};

/**
 * Reply to a comment
 * @param {string} commentId - The parent comment ID
 * @param {string} postId - The post ID
 * @param {string} replyText - The reply text
 * @param {Function} onReplyAdded - Callback function after reply is added
 * @returns {Promise<void>}
 */
export const replyToComment = async (
  commentId,
  postId,
  replyText,
  onReplyAdded
) => {
  try {
    // Get current user
    const { user } = userStore.getState();
    if (!user || !user._id) {
      showErrorToast("Please log in to reply to comments");
      return;
    }

    // Check if reply text is empty
    if (!replyText.trim()) {
      return;
    }

    // Make the API call
    const response = await fetch(
      `${config.backendUrl}/api/posts/comments/${commentId}/reply`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: replyText.trim() }),
        timeout: config.apiTimeouts.medium,
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to reply to comment");
    }

    // Get the actual reply data from the server
    const serverReply = data.data;

    // Create a complete reply object with all necessary fields
    const newReply = {
      _id: serverReply._id,
      text: serverReply.text,
      user: serverReply.user || {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
      },
      createdAt: serverReply.createdAt || new Date().toISOString(),
      parentComment: commentId,
      likes: [],
      likeCount: 0,
      replies: [],
      replyCount: 0,
    };

    // Fetch the updated post to get the latest comments
    const postStore = usePostStore.getState();
    await postStore.fetchPost(postId);

    // Call the callback function with the new reply
    if (onReplyAdded) {
      onReplyAdded(newReply);
    }

    // Show success message
    showSuccessToast("Reply added");
  } catch (error) {
    console.error("Error replying to comment:", error);
    showErrorToast("Failed to reply to comment");
  }
};
