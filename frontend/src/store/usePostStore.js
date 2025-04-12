import { create } from "zustand";
import config from "@/lib/config";

export const usePostStore = create((set, get) => ({
  userPosts: [],
  loading: false,
  error: null,

  // Fetch posts for a specific user
  fetchUserPost: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/user/${userId}`,
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

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch user posts");
      }

      set({
        userPosts: data.data,
        loading: false,
      });
      
      return data.data;
    } catch (error) {
      console.error("Error fetching user posts:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Like a post
  handleLikePost: async (postId) => {
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

      if (!response.ok) {
        throw new Error(data.message || "Failed to like post");
      }

      // Update the post in the userPosts array
      set((state) => ({
        userPosts: state.userPosts.map((post) =>
          post._id === postId ? { ...post, ...data.data } : post
        ),
      }));

      return data.data;
    } catch (error) {
      console.error("Error liking post:", error);
      throw error;
    }
  },

  // Comment on a post
  handleCommentPost: async (postId, comment) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/comment`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: comment }),
          timeout: config.apiTimeouts.medium,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to comment on post");
      }

      // Update the post in the userPosts array
      set((state) => ({
        userPosts: state.userPosts.map((post) =>
          post._id === postId ? { ...post, ...data.data } : post
        ),
      }));

      return data.data;
    } catch (error) {
      console.error("Error commenting on post:", error);
      throw error;
    }
  },

  // Share a post
  handleSharePost: async (postId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/share`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.medium,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to share post");
      }

      // Add the new shared post to the userPosts array
      set((state) => ({
        userPosts: [data.data, ...state.userPosts],
      }));

      return data.data;
    } catch (error) {
      console.error("Error sharing post:", error);
      throw error;
    }
  },

  // Clear errors
  clearErrors: () => set({ error: null }),
}));
