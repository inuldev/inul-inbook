/**
 * Post Interaction Helpers
 *
 * This module provides helper functions for post interactions (like, comment, share)
 * that can be used across different components.
 *
 * These functions are designed to:
 * 1. Provide a consistent interface for post interactions
 * 2. Handle optimistic updates for better UX
 * 3. Properly handle errors and rollbacks
 * 4. Update UI state consistently
 */

import usePostStore from "@/store/postStore";
import userStore from "@/store/userStore";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "@/lib/toastUtils";

/**
 * Toggle like status for a post
 * @param {string} postId - The post ID
 * @param {boolean} isLiked - Current like status in UI
 * @param {Function} setIsLiked - Function to update like status state
 * @param {Function} setLikeCount - Function to update like count state
 * @returns {Promise<void>}
 */
export const togglePostLike = async (
  postId,
  isLiked,
  setIsLiked,
  setLikeCount
) => {
  try {
    // Get current user
    const { user } = userStore.getState();
    if (!user || !user._id) {
      showErrorToast("Please log in to like posts");
      return;
    }

    // Toggle the like state immediately for better UX
    const newLikedState = !isLiked;

    // Update UI immediately (optimistic update)
    setIsLiked(newLikedState);
    setLikeCount((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

    // Call the store method
    const postStore = usePostStore.getState();
    const result = await postStore.togglePostLike(postId);

    // Log for debugging
    console.log("Server response for like toggle:", result);

    // Always update UI with the state returned from the server
    setIsLiked(result.isLiked);

    // Use the actual like count from the server if available
    if (result.likeCount !== null && result.likeCount !== undefined) {
      console.log("Setting like count from server:", result.likeCount);
      setLikeCount(result.likeCount);
    }

    // Show success message
    if (result.isLiked) {
      showSuccessToast("Post liked");
    } else {
      showInfoToast("Post unliked");
    }
  } catch (error) {
    console.error("Error toggling post like:", error);

    // Revert UI changes on error
    setIsLiked(isLiked);

    // Show error message
    showErrorToast(error.message || "Failed to update like status");
  }
};

/**
 * Add a comment to a post
 * @param {string} postId - The post ID
 * @param {string} commentText - The comment text
 * @param {Function} setCommentText - Function to update comment text state
 * @param {Function} setCommentCount - Function to update comment count state
 * @param {Function} setIsSubmitting - Function to update submitting state
 * @param {Function} onCommentAdded - Optional callback when comment is added
 * @returns {Promise<void>}
 */
export const addPostComment = async (
  postId,
  commentText,
  setCommentText,
  setCommentCount,
  setIsSubmitting,
  onCommentAdded = null
) => {
  try {
    // Get current user
    const { user } = userStore.getState();
    if (!user || !user._id) {
      showErrorToast("Please log in to comment");
      return;
    }

    // Check if comment text is empty
    if (!commentText.trim()) {
      return;
    }

    // Set submitting state
    if (setIsSubmitting) setIsSubmitting(true);

    // Store comment text and clear input immediately for better UX
    const tempCommentText = commentText.trim();
    setCommentText("");

    // Call the store method
    const postStore = usePostStore.getState();
    const newComment = await postStore.addComment(postId, tempCommentText);

    // Update comment count
    setCommentCount((prev) => prev + 1);

    // Call the callback if provided
    if (onCommentAdded) {
      onCommentAdded(newComment);
    }

    // Show success message
    showSuccessToast("Comment added");
  } catch (error) {
    console.error("Error adding comment:", error);

    // Show error message
    showErrorToast(error.message || "Failed to add comment");

    // Restore comment text on error
    setCommentText(commentText);
  } finally {
    // Reset submitting state
    if (setIsSubmitting) setIsSubmitting(false);
  }
};

/**
 * Share a post
 * @param {string} postId - The post ID
 * @param {string} platform - The platform to share on
 * @param {Function} setShareCount - Function to update share count state
 * @param {Function} setIsShareDialogOpen - Function to update share dialog state
 * @returns {Promise<void>}
 */
export const sharePost = async (
  postId,
  platform,
  setShareCount,
  setIsShareDialogOpen = null
) => {
  try {
    // Get current user
    const { user } = userStore.getState();
    if (!user || !user._id) {
      showErrorToast("Please log in to share posts");
      return;
    }

    // Update UI immediately (optimistic update)
    setShareCount((prev) => prev + 1);

    // Call the store method
    const postStore = usePostStore.getState();
    await postStore.sharePost(postId, platform);

    // Close the share dialog if provided
    if (setIsShareDialogOpen) {
      setIsShareDialogOpen(false);
    }

    // Success message is now handled by the caller to avoid duplicate messages
  } catch (error) {
    console.error("Error sharing post:", error);

    // Revert UI changes on error
    setShareCount((prev) => Math.max(0, prev - 1));

    // Show error message
    showErrorToast(error.message || "Failed to share post");
  }
};

/**
 * Generate a shareable link for a post
 * @param {string} postId - The post ID
 * @returns {string} - The shareable link
 */
export const generateSharedLink = (postId) => {
  // Get the base URL from environment variable or current origin
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;

  // Create a full URL to the post
  const postUrl = `${baseUrl}/posts/${postId}`;

  console.log(`Generated shared link for post ${postId}: ${postUrl}`);
  return postUrl;
};
