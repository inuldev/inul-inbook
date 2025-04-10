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
    // Toggle the like state immediately for better UX
    const newLikedState = !isLiked;

    // Update UI immediately
    setIsLiked(newLikedState);
    setLikeCount((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

    // Get the post store
    const postStore = usePostStore.getState();

    // Call the appropriate store method
    if (newLikedState) {
      await postStore.likePost(post._id);
      showSuccessToast("Post liked");
    } else {
      await postStore.unlikePost(post._id);
      showInfoToast("Post unliked");
    }
  } catch (error) {
    // Revert UI changes on error
    setIsLiked(isLiked);
    setLikeCount((prev) => (isLiked ? prev : Math.max(0, prev - 1)));
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

    // Get the post store
    const postStore = usePostStore.getState();

    // Add the comment
    const newComment = await postStore.addComment(postId, commentText);

    // Update UI
    setComments((prev) => [newComment, ...prev]);
    setCommentCount((prev) => prev + 1);
    setCommentText("");
    showSuccessToast("Comment added");
  } catch (error) {
    console.error("Error adding comment:", error);
    showErrorToast("Failed to add comment");
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
