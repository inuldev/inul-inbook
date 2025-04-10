import config from "@/lib/config";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "@/lib/toastUtils";
import usePostStore from "@/store/postStore";

/**
 * Toggle like status for a post
 * @param {Object} post - The post object
 * @param {boolean} isLiked - Current like status
 * @param {Function} setIsLiked - Function to update like status state
 * @param {Function} setLikeCount - Function to update like count state
 * @param {Object} user - Current user object
 * @returns {Promise<void>}
 */
export const togglePostLike = async (
  post,
  isLiked,
  setIsLiked,
  setLikeCount,
  user
) => {
  // Check if user is logged in
  if (!user || !user._id) {
    showErrorToast("Please log in to like posts");
    return;
  }

  try {
    // Determine the action based on current UI state
    const action = isLiked ? "unlike" : "like";

    // Temporarily update UI for better UX
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(
      newLikedState
        ? (post.likeCount || 0) + 1
        : Math.max(0, (post.likeCount || 1) - 1)
    );

    // Make the API call
    const response = await fetch(
      `${config.backendUrl}/api/posts/${post._id}/${action}`,
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

    // After the API call, get the current state to ensure accuracy
    const getResponse = await fetch(
      `${config.backendUrl}/api/posts/${post._id}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: config.apiTimeouts.short,
      }
    );

    const getPostData = await getResponse.json();

    if (getPostData.success) {
      // Get the actual state from the server
      const serverIsLiked = getPostData.data.likes.includes(user._id);
      const serverLikeCount = getPostData.data.likeCount || 0;

      // Update UI to match server state
      setIsLiked(serverIsLiked);
      setLikeCount(serverLikeCount);

      // Update the post in the store
      const postStore = usePostStore.getState();
      postStore.updatePostInStore({
        ...post,
        isLiked: serverIsLiked,
        likeCount: serverLikeCount,
      });

      // Show appropriate message
      if (serverIsLiked) {
        showSuccessToast("Post liked");
      } else {
        showInfoToast("Post unliked");
      }
    } else {
      throw new Error("Failed to get updated post state");
    }
  } catch (error) {
    // Revert UI changes on error
    setIsLiked(isLiked);
    setLikeCount(post.likeCount || 0);
    console.error("Error toggling like:", error);
    showErrorToast("Failed to update like status");
  }
};

/**
 * Add a comment to a post
 * @param {string} postId - The post ID
 * @param {string} commentText - The comment text
 * @param {Function} setCommentText - Function to update comment text state
 * @param {Function} setComments - Function to update comments state
 * @param {Function} setCommentCount - Function to update comment count state
 * @param {Object} user - Current user object
 * @param {Function} setIsSubmitting - Function to update submitting state
 * @returns {Promise<void>}
 */
export const addPostComment = async (
  postId,
  commentText,
  setCommentText,
  setComments,
  setCommentCount,
  user,
  setIsSubmitting
) => {
  // Check if user is logged in
  if (!user || !user._id) {
    showErrorToast("Please log in to comment");
    return;
  }

  // Check if comment text is empty
  if (!commentText.trim()) {
    return;
  }

  try {
    setIsSubmitting(true);
    const tempCommentText = commentText.trim();
    setCommentText(""); // Clear input immediately for better UX

    // Make the API call directly
    const response = await fetch(
      `${config.backendUrl}/api/posts/${postId}/comment`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: tempCommentText }),
        timeout: config.apiTimeouts.medium,
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to add comment");
    }

    // Get the actual comment data from the response
    // This ensures we're using the server's data structure
    const serverComment = data.data;

    // Make sure the comment has all required fields
    const newComment = {
      _id: serverComment._id,
      text: serverComment.text,
      user: serverComment.user || {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
      },
      createdAt: serverComment.createdAt || new Date().toISOString(),
      likes: [],
      likeCount: 0,
      replies: [],
      replyCount: 0,
    };

    // Log the comment for debugging
    console.log("New comment created:", newComment);

    // Update UI - only add this one comment
    // First check if the comment already exists to avoid duplicates
    setComments((prev) => {
      // Check if comment already exists
      const exists = prev.some((comment) => comment._id === newComment._id);
      if (exists) {
        return prev; // Don't add if it already exists
      }
      return [newComment, ...prev];
    });

    setCommentCount((prev) => prev + 1);

    // Update the post in the store
    const postStore = usePostStore.getState();
    const existingPost = postStore.posts.find((p) => p._id === postId);

    if (existingPost) {
      // Only add the new comment, don't duplicate
      const updatedComments = [newComment, ...(existingPost.comments || [])];

      // Make sure we don't have duplicates
      const uniqueComments = updatedComments.filter(
        (comment, index, self) =>
          index === self.findIndex((c) => c._id === comment._id)
      );

      postStore.updatePostInStore({
        ...existingPost,
        comments: uniqueComments,
        commentCount: (existingPost.commentCount || 0) + 1,
      });
    }

    showSuccessToast("Comment added");
  } catch (error) {
    console.error("Error adding comment:", error);
    showErrorToast("Failed to add comment");
    setCommentText(commentText); // Restore comment text on error
  } finally {
    setIsSubmitting(false);
  }
};

/**
 * Share a post
 * @param {string} postId - The post ID
 * @param {string} platform - The platform to share on
 * @param {Function} setShareCount - Function to update share count state
 * @param {Object} user - Current user object
 * @param {Function} setIsShareDialogOpen - Function to update share dialog state
 * @returns {Promise<void>}
 */
export const sharePost = async (
  postId,
  platform,
  setShareCount,
  user,
  setIsShareDialogOpen
) => {
  // Check if user is logged in
  if (!user || !user._id) {
    showErrorToast("Please log in to share posts");
    return;
  }

  // Update UI immediately
  setShareCount((prev) => prev + 1);

  try {
    // Make the API call directly to ensure we're using the latest API
    const response = await fetch(
      `${config.backendUrl}/api/posts/${postId}/share`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform }),
        timeout: config.apiTimeouts.short,
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to share post");
    }

    // Update the post in the store
    const postStore = usePostStore.getState();
    const existingPost = postStore.posts.find((p) => p._id === postId);

    if (existingPost) {
      postStore.updatePostInStore({
        ...existingPost,
        shareCount: data.data.shareCount,
      });
    }

    // Close the share dialog
    if (setIsShareDialogOpen) {
      setIsShareDialogOpen(false);
    }

    showSuccessToast(`Post shared on ${platform}`);
  } catch (error) {
    // Revert UI changes on error
    setShareCount((prev) => Math.max(0, prev - 1));
    console.error("Error sharing post:", error);
    showErrorToast("Failed to share post");
  }
};

/**
 * Generate a shareable link for a post
 * @param {string} postId - The post ID
 * @returns {string} - The shareable link
 */
export const generateSharedLink = (postId) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
  return `${baseUrl}/posts/${postId}`;
};
