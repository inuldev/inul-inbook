/**
 * Post Interaction Helpers
 *
 * This module provides helper functions for post interactions (like, comment, share, edit)
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
import config from "@/lib/config";
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

/**
 * Edit a post
 * @param {string} postId - The post ID
 * @param {Object} postData - The updated post data
 * @param {string} postData.content - The updated post content
 * @param {string} postData.privacy - The updated post privacy setting
 * @param {Object} postData.mediaData - The updated post media data (optional)
 * @param {Function} onSuccess - Callback function to execute on successful edit
 * @param {Function} onError - Callback function to execute on error
 * @returns {Promise<Object>} - The updated post
 */
export const editPost = async (postId, postData, onSuccess, onError) => {
  try {
    // Get current user
    const { user } = userStore.getState();

    if (!user || !user._id) {
      const error = new Error("Please log in to edit posts");
      showErrorToast(error.message);
      if (onError) onError(error);
      return;
    }

    const { content, privacy, mediaData } = postData;

    // Check if content is empty
    if (!content || !content.trim()) {
      const error = new Error("Post content cannot be empty");
      showErrorToast(error.message);
      if (onError) onError(error);
      return;
    }

    // Get the post store
    const postStore = usePostStore.getState();

    // Check if media has changed
    const isMediaChanged = mediaData && mediaData.url;

    try {
      let updatedPost;

      // If media has changed or we're adding new media, use the direct upload endpoint
      if (isMediaChanged) {
        const response = await fetch(
          `${config.backendUrl}/api/posts/${postId}/direct`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: content.trim(),
              privacy,
              mediaUrl: mediaData.url,
              mediaType: mediaData.type,
            }),
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to update post");
        }

        // Update post in store
        updatedPost = postStore.updatePostInStore(data.data);
      } else {
        // Regular update without media changes
        updatedPost = await postStore.updatePost(postId, {
          content: content.trim(),
          privacy,
        });
      }

      // Show success message
      showSuccessToast("Post updated successfully");

      // Call success callback if provided
      if (onSuccess) onSuccess(updatedPost);

      return updatedPost;
    } catch (error) {
      console.error("Error editing post:", error);
      showErrorToast(error.message || "Failed to update post");

      // Call error callback if provided
      if (onError) onError(error);

      throw error;
    }
  } catch (error) {
    console.error("Error in edit post procedure:", error);
    showErrorToast(error.message || "An unexpected error occurred");

    // Call error callback if provided
    if (onError) onError(error);

    throw error;
  }
};
