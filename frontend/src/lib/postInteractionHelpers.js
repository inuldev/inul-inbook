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

    // Fetch the post again to ensure we have the latest data
    try {
      await postStore.fetchPost(postId, true);
    } catch (fetchError) {
      console.warn(
        `Error fetching post after like toggle: ${fetchError.message}`
      );
      // Continue even if this fails, as we've already updated the UI
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
 * @param {Function} onCommentAdded - Optional callback when comment is added
 * @param {Function} onCommentSaved - Optional callback when comment is saved to server
 * @returns {Promise<void>}
 */
export const addPostComment = async (
  postId,
  commentText,
  setCommentText,
  setCommentCount,
  onCommentAdded = null,
  onCommentSaved = null
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

    // Store comment text and clear input immediately for better UX
    const tempCommentText = commentText.trim();
    setCommentText("");

    // Update comment count optimistically
    setCommentCount((prev) => prev + 1);

    // Only create a temporary comment if onCommentAdded is provided and we need to show it
    // This prevents duplicate comments when the component already adds a temp comment
    if (onCommentAdded) {
      const tempComment = {
        _id: `temp-${Date.now()}`,
        text: tempCommentText,
        user: user,
        createdAt: new Date().toISOString(),
        likes: [],
        likeCount: 0,
        replies: [],
        replyCount: 0,
        isTemp: true,
      };

      // Call the callback with the temporary comment
      onCommentAdded(tempComment);
    }

    // Call the store method in the background
    const postStore = usePostStore.getState();
    postStore
      .addComment(postId, tempCommentText)
      .then((newComment) => {
        // Success - no need to do anything as the post will be refreshed
        console.log("Comment added successfully:", newComment._id);

        // Call the callback with the new comment if provided
        if (onCommentSaved) {
          onCommentSaved(newComment);
        }
      })
      .catch((error) => {
        console.error("Error adding comment:", error);
        // Revert comment count on error
        setCommentCount((prev) => Math.max(0, prev - 1));
        // Show error message
        showErrorToast(error.message || "Failed to add comment");
        // Restore comment text on error
        setCommentText(commentText);
      });

    // Don't wait for the API call to complete
    // This makes the UI more responsive
  } catch (error) {
    console.error("Error in comment submission:", error);
    // Show error message
    showErrorToast(error.message || "Failed to add comment");
    // Restore comment text on error
    setCommentText(commentText);
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

    // Fetch the post again to ensure we have the latest data
    try {
      await postStore.fetchPost(postId, true);
    } catch (fetchError) {
      console.warn(`Error fetching post after share: ${fetchError.message}`);
      // Continue even if this fails, as we've already updated the UI
    }

    // Close the share dialog if provided
    if (setIsShareDialogOpen) {
      setIsShareDialogOpen(false);
    }

    // Show success message
    showSuccessToast(`Post shared on ${platform}`);
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
