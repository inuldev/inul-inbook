import { create } from "zustand";
import config from "@/lib/config";
import { followUser, unfollowUser } from "@/service/user.service";

export const userFriendStore = create((set, get) => ({
  mutualFriends: [],
  followers: [],
  following: [],
  loading: false,
  error: null,

  // Fetch mutual friends
  fetchMutualFriends: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${config.backendUrl}/api/users/mutual-friends/${userId}`,
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
        throw new Error(data.message || "Failed to fetch mutual friends");
      }

      set({
        mutualFriends: data.data || [],
        loading: false,
      });

      return data.data;
    } catch (error) {
      console.error("Error fetching mutual friends:", error);
      set({
        error: error.message,
        loading: false,
        mutualFriends: [],
      });
      return [];
    }
  },

  // Fetch user followers
  fetchFollowers: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${config.backendUrl}/api/users/followers/${userId}`,
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
        throw new Error(data.message || "Failed to fetch followers");
      }

      set({
        followers: data.data || [],
        loading: false,
      });

      return data.data;
    } catch (error) {
      console.error("Error fetching followers:", error);
      set({
        error: error.message,
        loading: false,
        followers: [],
      });
      return [];
    }
  },

  // Fetch user following
  fetchFollowing: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${config.backendUrl}/api/users/following/${userId}`,
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
        throw new Error(data.message || "Failed to fetch following");
      }

      // Log the response for debugging
      console.log(
        `Fetched ${data.data?.length || 0} following users for user ${userId}`
      );

      set({
        following: data.data || [],
        loading: false,
      });

      return data.data;
    } catch (error) {
      console.error("Error fetching following:", error);
      set({
        error: error.message,
        loading: false,
        following: [],
      });
      return [];
    }
  },

  // Follow a user
  FollowUser: async (userId) => {
    try {
      const result = await followUser(userId);

      // Update the mutual friends list
      set((state) => ({
        mutualFriends: [...state.mutualFriends, result],
      }));

      return result;
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    }
  },

  // Unfollow a user
  UnfollowUser: async (userId) => {
    try {
      await unfollowUser(userId);

      // Remove the user from mutual friends list
      set((state) => ({
        mutualFriends: state.mutualFriends.filter(
          (friend) => friend._id !== userId
        ),
      }));

      // Refresh friend suggestions to make sure the unfollowed user appears there
      try {
        const { getFriendSuggestions } = await import(
          "@/service/friends.service"
        );
        await getFriendSuggestions();
      } catch (refreshError) {
        console.error("Error refreshing friend suggestions:", refreshError);
        // Continue even if refresh fails
      }

      return true;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    }
  },

  // Clear errors
  clearErrors: () => set({ error: null }),
}));
