import { create } from "zustand";
import config from "@/lib/config";
import userStore from "@/store/userStore";

const usePostStore = create((set) => ({
  posts: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },

  // Fetch all posts
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
        throw new Error(data.message);
      }

      set({
        posts: data.data,
        pagination: data.pagination,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch feed posts
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
        throw new Error(data.message);
      }

      set({
        posts: data.data,
        pagination: data.pagination,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Create a post
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
        throw new Error(data.message);
      }

      set((state) => ({
        posts: [data.data, ...state.posts],
        loading: false,
      }));

      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Create a post with direct upload to Cloudinary
  createPostWithDirectUpload: async (postData) => {
    set({ loading: true, error: null });
    try {
      // First, get upload signature
      const publicId = `post_${Date.now()}`;
      const signatureResponse = await fetch(
        `${config.backendUrl}/api/posts/upload-signature`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publicId }),
          timeout: config.apiTimeouts.short,
        }
      );

      const signatureData = await signatureResponse.json();

      if (!signatureData.success) {
        throw new Error(signatureData.message);
      }

      // Upload to Cloudinary directly
      const formData = new FormData();
      formData.append("file", postData.media);
      formData.append("api_key", signatureData.data.apiKey);
      formData.append("timestamp", signatureData.data.timestamp);
      formData.append("signature", signatureData.data.signature);
      formData.append("public_id", publicId);
      formData.append("folder", "social-media-app/posts");

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.data.cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
          timeout: config.apiTimeouts.upload,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (cloudinaryData.error) {
        throw new Error(cloudinaryData.error.message);
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
        throw new Error(postResponseData.message);
      }

      set((state) => ({
        posts: [postResponseData.data, ...state.posts],
        loading: false,
      }));

      return postResponseData.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Like a post
  likePost: async (postId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/like`,
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
        throw new Error(data.message);
      }

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? { ...post, likeCount: post.likeCount + 1, isLiked: true }
            : post
        ),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Unlike a post
  unlikePost: async (postId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/unlike`,
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
        throw new Error(data.message);
      }

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? { ...post, likeCount: post.likeCount - 1, isLiked: false }
            : post
        ),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Update a post
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
        throw new Error(data.message);
      }

      // Update the post in the store
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? data.data : post
        ),
        loading: false,
      }));

      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete a post
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
        throw new Error(data.message);
      }

      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Get user posts
  getUserPosts: async (userId, page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/user/${userId}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      set({
        posts: data.data,
        pagination: data.pagination,
        loading: false,
      });

      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Add a post to the store
  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
    })),

  // Fetch video posts
  fetchVideoPosts: async (page = 1, limit = 10) => {
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
        throw new Error(data.message);
      }

      // Filter only video posts
      const videoPosts = data.data.filter((post) => post.mediaType === "video");

      return {
        posts: videoPosts,
        pagination: {
          ...data.pagination,
          total: videoPosts.length,
        },
      };
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Like a post
  likePost: async (postId) => {
    try {
      // Get current user
      const currentUser = userStore.getState().user;

      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/like`,
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
        throw new Error(data.message);
      }

      // Update the post in the store
      const updatedPost = { likeCount: 0 };

      set((state) => {
        const newPosts = state.posts.map((post) => {
          if (post._id === postId) {
            updatedPost.likeCount = (post.likeCount || 0) + 1;
            return {
              ...post,
              likes: [...(post.likes || []), currentUser._id],
              likeCount: updatedPost.likeCount,
            };
          }
          return post;
        });

        return { posts: newPosts };
      });

      return data.data;
    } catch (error) {
      console.error("Error liking post:", error);
      throw error;
    }
  },

  // Unlike a post
  unlikePost: async (postId) => {
    try {
      // Get current user
      const currentUser = userStore.getState().user;

      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/unlike`,
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
        throw new Error(data.message);
      }

      // Update the post in the store
      const updatedPost = { likeCount: 0 };

      set((state) => {
        const newPosts = state.posts.map((post) => {
          if (post._id === postId) {
            const updatedLikes = (post.likes || []).filter(
              (userId) => userId !== currentUser._id
            );
            updatedPost.likeCount = Math.max(0, (post.likeCount || 1) - 1);
            return {
              ...post,
              likes: updatedLikes,
              likeCount: updatedPost.likeCount,
            };
          }
          return post;
        });

        return { posts: newPosts };
      });

      return data.data;
    } catch (error) {
      console.error("Error unliking post:", error);
      throw error;
    }
  },

  // Add a comment to a post
  addComment: async (postId, text) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/comment`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
          timeout: config.apiTimeouts.medium,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Update the post in the store
      const updatedPost = { commentCount: 0 };

      set((state) => {
        const newPosts = state.posts.map((post) => {
          if (post._id === postId) {
            updatedPost.commentCount = (post.commentCount || 0) + 1;
            return {
              ...post,
              comments: [data.data, ...(post.comments || [])],
              commentCount: updatedPost.commentCount,
            };
          }
          return post;
        });

        return { posts: newPosts };
      });

      return data.data;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  // Update a post in the store
  updatePostInStore: (updatedPost) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      ),
    })),

  // Share a post
  sharePost: async (postId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/share`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.short,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Update the post in the store
      const updatedPost = { shareCount: data.data.shareCount };

      set((state) => {
        const newPosts = state.posts.map((post) => {
          if (post._id === postId) {
            return { ...post, shareCount: updatedPost.shareCount };
          }
          return post;
        });

        return { posts: newPosts };
      });

      return data.data;
    } catch (error) {
      console.error("Error sharing post:", error);
      throw error;
    }
  },

  // Clear posts
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
