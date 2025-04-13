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
 * @param {string} postId - The post ID
 * @param {boolean} isLiked - Current like status in UI
 * @param {Function} setIsLiked - Function to update like status state
 * @param {Function} setLikeCount - Function to update like count state
 * @returns {Promise<void>}
 */
export const toggleCommentLike = (
  commentId,
  postId,
  isLiked,
  setIsLiked,
  setLikeCount
) => {
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

  // Find the comment in the post store to update it directly
  const postStore = usePostStore.getState();
  const post = postStore.posts.find((p) => p._id === postId);

  if (post && post.comments) {
    // Try to find the comment in the post's comments
    let comment = post.comments.find((c) => c._id === commentId);

    // If not found, check if it's a reply
    if (!comment) {
      for (const parentComment of post.comments) {
        if (parentComment.replies && parentComment.replies.length > 0) {
          const reply = parentComment.replies.find((r) => r._id === commentId);
          if (reply) {
            comment = reply;
            break;
          }
        }
      }
    }

    // Update the comment's like status in the store if found
    if (comment) {
      comment.isLiked = newLikedState;
      comment.likeCount = newLikedState
        ? (comment.likeCount || 0) + 1
        : Math.max(0, (comment.likeCount || 0) - 1);
    }
  }

  // Make the API call in the background
  const endpoint = newLikedState ? "like" : "unlike";
  fetch(`${config.backendUrl}/api/posts/comments/${commentId}/${endpoint}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    timeout: config.apiTimeouts.short,
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.success) {
        // Revert UI changes on error
        setIsLiked(isLiked);
        setLikeCount((prev) => (isLiked ? prev : Math.max(0, prev - 1)));

        // Also revert the store changes
        if (post && post.comments) {
          let comment = post.comments.find((c) => c._id === commentId);

          if (!comment) {
            for (const parentComment of post.comments) {
              if (parentComment.replies && parentComment.replies.length > 0) {
                const reply = parentComment.replies.find(
                  (r) => r._id === commentId
                );
                if (reply) {
                  comment = reply;
                  break;
                }
              }
            }
          }

          if (comment) {
            comment.isLiked = isLiked;
            comment.likeCount = isLiked
              ? comment.likeCount || 0
              : Math.max(0, (comment.likeCount || 0) - 1);
          }
        }

        throw new Error(data.message || "Failed to update like status");
      }
    })
    .catch((error) => {
      console.error("Error toggling comment like:", error);
      // Don't show error toast to avoid disrupting user experience
    });
};

/**
 * Delete a comment
 * @param {string} commentId - The comment ID
 * @param {string} postId - The post ID
 * @param {string} parentCommentId - The parent comment ID (if it's a reply)
 * @param {Function} onCommentDeleted - Callback function after comment is deleted
 * @returns {Promise<void>}
 */
export const deleteComment = async (
  commentId,
  postId,
  parentCommentId = null,
  onCommentDeleted
) => {
  try {
    // Get the current user from userStore
    const { user: currentUser } = userStore.getState();

    // Check if user is logged in
    if (!currentUser || !currentUser._id) {
      showErrorToast("Please log in to delete comments");
      return;
    }

    // Call the callback function immediately for better UX
    if (onCommentDeleted) {
      onCommentDeleted(commentId);
    }

    // Make the API call
    let url = `${config.backendUrl}/api/posts/comments/${commentId}`;

    // If it's a reply, add the parent comment ID as a query parameter
    if (parentCommentId) {
      url += `?parentCommentId=${parentCommentId}`;
    }

    const response = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: config.apiTimeouts.medium,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to delete comment");
    }

    // Update the post in the store in the background
    setTimeout(() => {
      try {
        const postStore = usePostStore.getState();
        postStore.fetchPost(postId, true).catch((err) => {
          console.warn(`Background post refresh failed: ${err.message}`);
        });
      } catch (bgError) {
        console.warn("Error in background post refresh:", bgError);
      }
    }, 500);

    // Show success message
    showSuccessToast("Comment deleted");
  } catch (error) {
    console.error("Error deleting comment:", error);
    showErrorToast("Failed to delete comment");

    // Refresh the post to restore the comment if deletion failed
    try {
      const postStore = usePostStore.getState();
      postStore.fetchPost(postId, true);
    } catch (refreshError) {
      console.error(
        "Error refreshing post after failed deletion:",
        refreshError
      );
    }
  }
};

/**
 * Update a comment
 * @param {string} commentId - The comment ID
 * @param {string} postId - The post ID
 * @param {string} commentText - The updated comment text
 * @param {Function} onCommentUpdated - Callback function after comment is updated
 * @param {string} parentCommentId - The parent comment ID (if it's a reply)
 * @returns {Promise<void>}
 */
export const updateComment = async (
  commentId,
  postId,
  commentText,
  onCommentUpdated,
  parentCommentId = null
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

    // Create an updated comment object for immediate UI update
    const tempUpdatedComment = {
      _id: commentId,
      text: commentText.trim(),
      user: user,
      updatedAt: new Date().toISOString(),
    };

    // Call the callback function immediately for better UX
    if (onCommentUpdated) {
      onCommentUpdated(tempUpdatedComment);
    }

    // Make the API call
    let url = `${config.backendUrl}/api/posts/comments/${commentId}`;

    // If it's a reply, add the parent comment ID as a query parameter
    if (parentCommentId) {
      url += `?parentCommentId=${parentCommentId}`;
    }

    const response = await fetch(url, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: commentText.trim() }),
      timeout: config.apiTimeouts.medium,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to update comment");
    }

    // Get the updated comment from the server
    const updatedComment = data.data;

    // Update the post in the store in the background
    setTimeout(() => {
      try {
        const postStore = usePostStore.getState();
        postStore.fetchPost(postId, true).catch((err) => {
          console.warn(`Background post refresh failed: ${err.message}`);
        });
      } catch (bgError) {
        console.warn("Error in background post refresh:", bgError);
      }
    }, 500);

    // Show success message
    showSuccessToast("Comment updated");
  } catch (error) {
    console.error("Error updating comment:", error);
    showErrorToast("Failed to update comment");

    // Refresh the post to restore the original comment if update failed
    try {
      const postStore = usePostStore.getState();
      postStore.fetchPost(postId, true);
    } catch (refreshError) {
      console.error("Error refreshing post after failed update:", refreshError);
    }
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
    };

    // Update the post in the store in the background
    setTimeout(() => {
      try {
        const postStore = usePostStore.getState();
        postStore.fetchPost(postId, true).catch((err) => {
          console.warn(`Background post refresh failed: ${err.message}`);
        });
      } catch (bgError) {
        console.warn("Error in background post refresh:", bgError);
      }
    }, 500);

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
