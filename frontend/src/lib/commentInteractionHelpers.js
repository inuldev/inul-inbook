import config from "@/lib/config";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import usePostStore from "@/store/postStore";

/**
 * Like a comment
 * @param {string} commentId - The comment ID
 * @param {boolean} isLiked - Current like status
 * @param {Function} setIsLiked - Function to update like status state
 * @param {Function} setLikeCount - Function to update like count state
 * @param {Object} user - Current user object
 * @returns {Promise<void>}
 */
export const toggleCommentLike = async (
  commentId,
  isLiked,
  setIsLiked,
  setLikeCount,
  user
) => {
  // Check if user is logged in
  if (!user || !user._id) {
    showErrorToast("Please log in to like comments");
    return;
  }

  try {
    // Toggle the like state immediately for better UX
    const newLikedState = !isLiked;

    // Update UI immediately
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
 * @param {Object} user - Current user object
 * @returns {Promise<void>}
 */
export const deleteComment = async (
  commentId,
  postId,
  onCommentDeleted,
  user
) => {
  // Check if user is logged in
  if (!user || !user._id) {
    showErrorToast("Please log in to delete comments");
    return;
  }

  try {
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

    // Update the post in the store
    const postStore = usePostStore.getState();

    // Fetch the updated post to get the latest comments
    const updatedResponse = await fetch(
      `${config.backendUrl}/api/posts/${postId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: config.apiTimeouts.medium,
      }
    );

    const updatedData = await updatedResponse.json();

    if (updatedData.success) {
      // Process the updated post
      const processedPost = postStore.processPost(updatedData.data, user);

      // Update the post in the store
      postStore.updatePostInStore(processedPost);

      // Call the callback function
      if (onCommentDeleted) {
        onCommentDeleted(commentId);
      }
    }

    // Show success message
    showSuccessToast("Comment deleted");
  } catch (error) {
    console.error("Error deleting comment:", error);
    showErrorToast("Failed to delete comment");
  }
};

/**
 * Reply to a comment
 * @param {string} commentId - The parent comment ID
 * @param {string} postId - The post ID
 * @param {string} replyText - The reply text
 * @param {Function} onReplyAdded - Callback function after reply is added
 * @param {Object} user - Current user object
 * @returns {Promise<void>}
 */
export const replyToComment = async (
  commentId,
  postId,
  replyText,
  onReplyAdded,
  user
) => {
  // Check if user is logged in
  if (!user || !user._id) {
    showErrorToast("Please log in to reply to comments");
    return;
  }

  // Check if reply text is empty
  if (!replyText.trim()) {
    return;
  }

  try {
    // Make the API call
    const response = await fetch(
      `${config.backendUrl}/api/posts/comments/${commentId}/reply`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: replyText }),
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
      parentComment: commentId, // Use the correct field name as in the backend model
      likes: [],
      likeCount: 0,
      replies: [],
      replyCount: 0,
    };

    // Log the reply for debugging
    console.log("Created reply object:", newReply);
    console.log("Server reply data:", serverReply);

    // Update the post in the store
    const postStore = usePostStore.getState();
    const existingPost = postStore.posts.find((p) => p._id === postId);

    if (existingPost && existingPost.comments) {
      // Find the parent comment
      const updatedComments = existingPost.comments.map((comment) => {
        if (comment._id === commentId) {
          // Add the reply to this comment
          return {
            ...comment,
            replies: comment.replies
              ? [...comment.replies, newReply]
              : [newReply],
            replyCount: (comment.replyCount || 0) + 1,
          };
        }
        return comment;
      });

      // Update the post with the new comments
      postStore.updatePostInStore({
        ...existingPost,
        comments: updatedComments,
      });
    }

    // Also fetch the updated post to ensure we have the latest data
    try {
      const updatedResponse = await fetch(
        `${config.backendUrl}/api/posts/${postId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.medium,
        }
      );

      const updatedData = await updatedResponse.json();

      if (updatedData.success) {
        // Process the updated post
        const processedPost = postStore.processPost(updatedData.data, user);

        // Update the post in the store
        postStore.updatePostInStore(processedPost);
      }
    } catch (fetchError) {
      console.warn("Error fetching updated post after reply:", fetchError);
      // Continue even if this fails, as we've already updated the UI
    }

    // Call the callback function with the new reply
    if (onReplyAdded) {
      // Make sure we're passing the complete reply object
      const completeReply = {
        _id: data.data._id,
        text: data.data.text,
        user: {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
        },
        createdAt: data.data.createdAt || new Date().toISOString(),
        parentId: commentId,
      };
      onReplyAdded(completeReply);
    }

    // Show success message
    showSuccessToast("Reply added");
  } catch (error) {
    console.error("Error replying to comment:", error);
    showErrorToast("Failed to reply to comment");
  }
};
