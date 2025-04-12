import { create } from "zustand";
import config from "@/lib/config";

const useStoryStore = create((set) => ({
  stories: [],
  loading: false,
  error: null,

  // Fetch all stories
  fetchStories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${config.backendUrl}/api/stories`, {
        method: "GET",
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

      set({
        stories: data.data,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch feed stories
  fetchFeedStories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${config.backendUrl}/api/stories/feed/timeline`,
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
        stories: data.data,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Create a story
  createStory: async (storyData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      if (storyData.caption) formData.append("caption", storyData.caption);
      if (storyData.media) formData.append("media", storyData.media);

      const response = await fetch(`${config.backendUrl}/api/stories`, {
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
        stories: [data.data, ...state.stories],
        loading: false,
      }));

      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Create a story with direct upload to Cloudinary
  createStoryWithDirectUpload: async (storyData) => {
    set({ loading: true, error: null });
    try {
      // First, get upload signature
      const publicId = `story_${Date.now()}`;
      const signatureResponse = await fetch(
        `${config.backendUrl}/api/stories/upload-signature`,
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
      formData.append("file", storyData.media);
      formData.append("api_key", signatureData.data.apiKey);
      formData.append("timestamp", signatureData.data.timestamp);
      formData.append("signature", signatureData.data.signature);
      formData.append("public_id", publicId);
      formData.append("folder", "social-media-app/stories");

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

      // Create story with the uploaded media URL
      const storyResponse = await fetch(`${config.backendUrl}/api/stories`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption: storyData.caption || "",
          mediaUrl: cloudinaryData.secure_url,
          mediaType:
            cloudinaryData.resource_type === "image" ? "image" : "video",
        }),
        timeout: config.apiTimeouts.medium,
      });

      const storyResponseData = await storyResponse.json();

      if (!storyResponseData.success) {
        throw new Error(storyResponseData.message);
      }

      set((state) => ({
        stories: [storyResponseData.data, ...state.stories],
        loading: false,
      }));

      return storyResponseData.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // View a story
  viewStory: async (storyId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/stories/${storyId}/view`,
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
        stories: state.stories.map((story) =>
          story._id === storyId
            ? { ...story, viewCount: story.viewCount + 1, viewed: true }
            : story
        ),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Delete a story
  deleteStory: async (storyId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/stories/${storyId}`,
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
        throw new Error(data.message);
      }

      set((state) => ({
        stories: state.stories.filter((story) => story._id !== storyId),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Add a story to the store
  addStory: (story) =>
    set((state) => ({
      stories: [story, ...state.stories],
    })),

  // Clear stories
  clearStories: () => {
    set({
      stories: [],
    });
  },
}));

export default useStoryStore;
