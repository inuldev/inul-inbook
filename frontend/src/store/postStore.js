/**
 * Post Store - Manages all post-related state and operations
 *
 * This store handles:
 * - Fetching, creating, updating, and deleting posts
 * - Post interactions (like, comment, share)
 * - Processing post data for consistent format
 * - Maintaining post state across the application
 */

import { create } from "zustand";
import config from "@/lib/config";
import userStore from "@/store/userStore";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";

/**
 * Post Store implementation
 */
const usePostStore = create((set, get) => ({
  // State
  posts: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },

  /**
   * Fetch all posts with pagination
   * @param {number} page - Page number
   * @param {number} limit - Number of posts per page
   * @returns {Promise<Array>} - Array of posts
   */
  fetchPosts: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.medium,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch posts");
      }

      // Process posts to ensure consistent format
      const currentUser = userStore.getState().user;
      const processedPosts = data.data.map((post) =>
        get().processPost(post, currentUser)
      );

      set({
        posts: processedPosts,
        pagination: data.pagination,
        loading: false,
      });

      return processedPosts;
    } catch (error) {
      console.error("Error fetching posts:", error);
      set({ error: error.message, loading: false });
      return [];
    }
  },

  /**
   * Fetch feed posts (posts from followed users)
   * @param {number} page - Page number
   * @param {number} limit - Number of posts per page
   * @returns {Promise<Array>} - Array of posts
   */
  fetchFeedPosts: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/feed/timeline?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.medium,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch feed posts");
      }

      // Process posts to ensure consistent format
      const currentUser = userStore.getState().user;
      const processedPosts = data.data.map((post) =>
        get().processPost(post, currentUser)
      );

      set({
        posts: processedPosts,
        pagination: data.pagination,
        loading: false,
      });

      return processedPosts;
    } catch (error) {
      console.error("Error fetching feed posts:", error);
      set({ error: error.message, loading: false });
      return [];
    }
  },

  /**
   * Fetch a single post by ID
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} - Post object
   */
  fetchPost: async (postId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${config.backendUrl}/api/posts/${postId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: config.apiTimeouts.medium,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch post");
      }

      // Process post to ensure consistent format
      const currentUser = userStore.getState().user;
      const processedPost = get().processPost(data.data, currentUser);

      // Update the post in the store if it exists
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? processedPost : post
        ),
        loading: false,
      }));

      return processedPost;
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create a new post with form data (for multipart/form-data uploads)
   * @param {Object} postData - Post data
   * @returns {Promise<Object>} - Created post
   */
  createPost: async (postData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("content", postData.content);
      if (postData.privacy) formData.append("privacy", postData.privacy);
      if (postData.media) formData.append("media", postData.media);

      const response = await fetch(`${config.backendUrl}/api/posts`, {
        method: "POST",
        credentials: "include",
        body: formData,
        timeout: config.apiTimeouts.upload,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create post");
      }

      // Process post to ensure consistent format
      const currentUser = userStore.getState().user;
      const processedPost = get().processPost(data.data, currentUser);

      set((state) => ({
        posts: [processedPost, ...state.posts],
        loading: false,
      }));

      showSuccessToast("Post created successfully");
      return processedPost;
    } catch (error) {
      console.error("Error creating post:", error);
      set({ error: error.message, loading: false });
      showErrorToast(error.message || "Failed to create post");
      throw error;
    }
  },

  /**
   * Create a new post with direct upload to Cloudinary
   * @param {Object} postData - Post data
   * @returns {Promise<Object>} - Created post
   */
  createPostWithDirectUpload: async (postData) => {
    set({ loading: true, error: null });
    try {
      // If no media, use regular createPost
      if (!postData.media) {
        return get().createPost(postData);
      }

      // Get upload signature from backend
      const signatureResponse = await fetch(
        `${config.backendUrl}/api/posts/signature`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.short,
        }
      );

      const signatureData = await signatureResponse.json();

      if (!signatureData.success) {
        throw new Error(
          signatureData.message || "Failed to get upload signature"
        );
      }

      // Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append("file", postData.media);
      formData.append("api_key", signatureData.data.apiKey);
      formData.append("timestamp", signatureData.data.timestamp);
      formData.append("signature", signatureData.data.signature);
      formData.append("folder", signatureData.data.folder);

      // Upload to Cloudinary
      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.data.cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
          timeout: config.apiTimeouts.upload,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (cloudinaryResponse.status !== 200) {
        throw new Error(
          cloudinaryData.error?.message || "Failed to upload media"
        );
      }

      // Create post with the uploaded media URL
      const postResponse = await fetch(`${config.backendUrl}/api/posts`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: postData.content,
          privacy: postData.privacy || "public",
          mediaUrl: cloudinaryData.secure_url,
          mediaType:
            cloudinaryData.resource_type === "image" ? "image" : "video",
        }),
        timeout: config.apiTimeouts.medium,
      });

      const postResponseData = await postResponse.json();

      if (!postResponseData.success) {
        throw new Error(postResponseData.message || "Failed to create post");
      }

      // Process post to ensure consistent format
      const currentUser = userStore.getState().user;
      const processedPost = get().processPost(
        postResponseData.data,
        currentUser
      );

      set((state) => ({
        posts: [processedPost, ...state.posts],
        loading: false,
      }));

      showSuccessToast("Post created successfully");
      return processedPost;
    } catch (error) {
      console.error("Error creating post with direct upload:", error);
      set({ error: error.message, loading: false });
      showErrorToast(error.message || "Failed to create post");
      throw error;
    }
  },

  /**
   * Update an existing post
   * @param {string} postId - Post ID
   * @param {Object} postData - Updated post data
   * @returns {Promise<Object>} - Updated post
   */
  updatePost: async (postId, postData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${config.backendUrl}/api/posts/${postId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
        timeout: config.apiTimeouts.medium,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update post");
      }

      // Process post to ensure consistent format
      const currentUser = userStore.getState().user;
      const processedPost = get().processPost(data.data, currentUser);

      // Update the post in the store
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? processedPost : post
        ),
        loading: false,
      }));

      showSuccessToast("Post updated successfully");
      return processedPost;
    } catch (error) {
      console.error("Error updating post:", error);
      set({ error: error.message, loading: false });
      showErrorToast(error.message || "Failed to update post");
      throw error;
    }
  },

  /**
   * Delete a post
   * @param {string} postId - Post ID
   * @returns {Promise<boolean>} - Success status
   */
  deletePost: async (postId) => {
    try {
      const response = await fetch(`${config.backendUrl}/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: config.apiTimeouts.medium,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to delete post");
      }

      // Remove the post from the store
      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId),
      }));

      showSuccessToast("Post deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      showErrorToast(error.message || "Failed to delete post");
      throw error;
    }
  },

  /**
   * Toggle like status for a post (like or unlike)
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} - Result with success status and updated like state
   */
  togglePostLike: async (postId) => {
    try {
      // Get the current user from userStore and ensure it's logged in
      const { user: currentUser } = userStore.getState();
      if (!currentUser || !currentUser._id) {
        throw new Error("User not logged in");
      }

      // First, get the current state of the post to ensure we have accurate data
      const checkResponse = await fetch(
        `${config.backendUrl}/api/posts/${postId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.short,
        }
      );

      const checkData = await checkResponse.json();

      if (!checkData.success) {
        throw new Error("Failed to get post state");
      }

      // Get the actual current like state from the server
      const actualIsLiked = checkData.data.likes.includes(currentUser._id);

      // Determine the action based on the ACTUAL server state
      const endpoint = actualIsLiked ? "unlike" : "like";
      const newLikedState = !actualIsLiked;

      // Make the API call
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/${endpoint}`,
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

      // Handle common error cases gracefully
      if (!data.success) {
        // If the post is already in the desired state, don't treat it as an error
        if (
          (newLikedState && data.message === "Post already liked") ||
          (!newLikedState && data.message === "Post not liked yet")
        ) {
          // Return the actual state from the server
          return { success: true, isLiked: actualIsLiked };
        }

        throw new Error(data.message || `Failed to ${endpoint} post`);
      }

      // Get the actual like count from the server response if available
      let actualLikeCount = null;
      if (data.data && data.data.likeCount !== undefined) {
        actualLikeCount = data.data.likeCount;
      }

      // Update the posts in the store
      set((state) => {
        const updatedPosts = state.posts.map((post) => {
          if (post._id === postId) {
            // Calculate the new like count
            const newCount =
              actualLikeCount !== null
                ? actualLikeCount
                : newLikedState
                ? (post.likeCount || 0) + 1
                : Math.max(0, (post.likeCount || 1) - 1);

            // Update likes array
            let updatedLikes = post.likes || [];
            if (newLikedState) {
              // Add user to likes if not already there
              if (!updatedLikes.includes(currentUser._id)) {
                updatedLikes = [...updatedLikes, currentUser._id];
              }
            } else {
              // Remove user from likes
              updatedLikes = updatedLikes.filter((id) => {
                if (typeof id === "string") {
                  return id !== currentUser._id;
                } else if (id && typeof id === "object") {
                  return id._id !== currentUser._id;
                }
                return true;
              });
            }

            // Log for debugging
            console.log(`Updating post ${post._id} in store:`, {
              newLikedState,
              newCount,
              updatedLikes,
            });

            return {
              ...post,
              likeCount: newCount,
              isLiked: newLikedState,
              likes: updatedLikes,
            };
          }
          return post;
        });

        return { posts: updatedPosts };
      });

      // Get the final like count from the updated post
      const currentState = get();
      const updatedPost = currentState.posts.find((p) => p._id === postId);
      const finalLikeCount = updatedPost
        ? updatedPost.likeCount
        : actualLikeCount || (newLikedState ? 1 : 0);

      console.log("Final like state in store:", {
        postId,
        isLiked: newLikedState,
        likeCount: finalLikeCount,
        actualLikeCount,
      });

      // Return the new state and the actual like count
      return {
        success: true,
        isLiked: newLikedState,
        likeCount: finalLikeCount,
      };
    } catch (error) {
      console.error("Error toggling post like:", error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Add a comment to a post
   * @param {string} postId - Post ID
   * @param {string} commentText - Comment text
   * @returns {Promise<Object>} - Created comment
   */
  addComment: async (postId, commentText) => {
    try {
      // Get current user
      const currentUser = userStore.getState().user;
      if (!currentUser || !currentUser._id) {
        throw new Error("User not logged in");
      }

      // Check if comment text is empty
      if (!commentText.trim()) {
        throw new Error("Comment text cannot be empty");
      }

      // Make the API call
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/comment`,
        {
          method: "POST",
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
        throw new Error(data.message || "Failed to add comment");
      }

      // Create a complete comment object with all necessary fields
      const newComment = {
        _id: data.data._id,
        text: data.data.text,
        user: data.data.user || {
          _id: currentUser._id,
          username: currentUser.username,
          profilePicture: currentUser.profilePicture,
        },
        createdAt: data.data.createdAt || new Date().toISOString(),
        likes: [],
        likeCount: 0,
        replies: [],
        replyCount: 0,
      };

      // Update the post in the store
      set((state) => {
        const existingPost = state.posts.find((p) => p._id === postId);

        if (existingPost) {
          // Add the new comment to the post
          const updatedComments = [
            newComment,
            ...(existingPost.comments || []),
          ];

          // Make sure we don't have duplicates
          const uniqueComments = updatedComments.filter(
            (comment, index, self) =>
              index === self.findIndex((c) => c._id === comment._id)
          );

          // Update the post with the new comment
          const updatedPost = {
            ...existingPost,
            comments: uniqueComments,
            commentCount: (existingPost.commentCount || 0) + 1,
          };

          // Update the posts array
          return {
            posts: state.posts.map((post) =>
              post._id === postId ? updatedPost : post
            ),
          };
        }

        return state;
      });

      // After adding a comment, fetch the updated post to ensure we have all comments
      try {
        await get().fetchPost(postId);
      } catch (error) {
        console.warn(
          `Error fetching updated post after comment: ${error.message}`
        );
        // Continue even if this fails, as we've already updated the store with the new comment
      }

      return newComment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  /**
   * Share a post
   * @param {string} postId - Post ID
   * @param {string} platform - Platform to share on
   * @returns {Promise<Object>} - Updated post
   */
  sharePost: async (postId, platform) => {
    try {
      // Get current user
      const currentUser = userStore.getState().user;
      if (!currentUser || !currentUser._id) {
        throw new Error("User not logged in");
      }

      // Make the API call
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
      set((state) => {
        const existingPost = state.posts.find((p) => p._id === postId);

        if (existingPost) {
          const updatedPost = {
            ...existingPost,
            shareCount: data.data.shareCount,
          };

          return {
            posts: state.posts.map((post) =>
              post._id === postId ? updatedPost : post
            ),
          };
        }

        return state;
      });

      return data.data;
    } catch (error) {
      console.error("Error sharing post:", error);
      throw error;
    }
  },

  /**
   * Get posts for a specific user
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Number of posts per page
   * @returns {Promise<Array>} - Array of posts
   */
  getUserPosts: async (userId, page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/user/${userId}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.medium,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch user posts");
      }

      // Process posts to ensure consistent format
      const currentUser = userStore.getState().user;
      const processedPosts = data.data.map((post) =>
        get().processPost(post, currentUser)
      );

      set({
        posts: processedPosts,
        pagination: data.pagination,
        loading: false,
      });

      return processedPosts;
    } catch (error) {
      console.error("Error fetching user posts:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Add a post to the store
   * @param {Object} post - Post object
   */
  addPost: (post) => {
    const currentUser = userStore.getState().user;
    const processedPost = get().processPost(post, currentUser);

    set((state) => ({
      posts: [processedPost, ...state.posts],
    }));

    return processedPost;
  },

  /**
   * Process a post to ensure consistent format
   * @param {Object} post - Post object
   * @param {Object} currentUser - Current user object
   * @returns {Object} - Processed post
   */
  processPost: (post, currentUser) => {
    // Ensure likes is always an array
    const likes = Array.isArray(post.likes) ? post.likes : [];

    // Ensure comments is always an array
    const comments = Array.isArray(post.comments) ? post.comments : [];

    // Check if the current user has liked this post
    let isLiked = false;

    if (currentUser && currentUser._id) {
      isLiked = likes.some((like) => {
        if (typeof like === "string") {
          return like === currentUser._id;
        } else if (like && typeof like === "object") {
          return like._id === currentUser._id;
        }
        return false;
      });

      // Log for debugging
      console.log(`Processing post ${post._id}, isLiked: ${isLiked}`, {
        currentUser: currentUser._id,
        likes,
      });
    }

    // Ensure counts match the arrays length
    const likeCount = Math.max(post.likeCount || 0, likes.length);
    const commentCount = Math.max(post.commentCount || 0, comments.length);
    const shareCount = post.shareCount || 0;

    return {
      ...post,
      likes,
      comments,
      likeCount,
      commentCount,
      shareCount,
      isLiked: !!isLiked,
    };
  },

  /**
   * Update a post in the store
   * @param {Object} updatedPost - Updated post object
   */
  updatePostInStore: (updatedPost) => {
    const currentUser = userStore.getState().user;
    const processedPost = get().processPost(updatedPost, currentUser);

    set((state) => ({
      posts: state.posts.map((post) =>
        post._id === processedPost._id ? processedPost : post
      ),
    }));

    return processedPost;
  },

  /**
   * Clear all posts from the store
   */
  clearPosts: () => {
    set({
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
    });
  },
}));

export default usePostStore;
