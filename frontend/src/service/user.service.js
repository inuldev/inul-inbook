import { get, post, put } from "@/lib/api";
import userStore from "@/store/userStore";

/**
 * Fetch user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile data
 */
export const fetchUserProfile = async (userId) => {
  try {
    // Get current user from store
    const { user } = userStore.getState();

    // Fetch user profile from API
    const response = await get(`api/users/${userId}`);

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch user profile");
    }

    // Check if the profile belongs to the current user
    const isOwner = user && user._id === userId;

    return {
      profile: response.data,
      isOwner,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {FormData} formData - Form data with profile updates
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUserProfile = async (userId, formData) => {
  try {
    // Check if formData contains profilePicture
    const hasProfilePicture = formData.has("profilePicture");

    // If there's a profile picture, use the profile-picture endpoint
    if (hasProfilePicture) {
      const response = await put(
        `api/users/profile-picture`,
        formData,
        {
          // Don't set Content-Type header for FormData
          headers: {},
        },
        "upload"
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to update profile picture");
      }

      return response.data;
    } else {
      // Otherwise use the regular profile endpoint
      const response = await put(
        `api/users/profile`,
        formData,
        {
          // Don't set Content-Type header for FormData
          headers: {},
        },
        "upload"
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to update profile");
      }

      return response.data;
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Update user bio
 * @param {string} userId - User ID
 * @param {Object} bioData - Bio data to update
 * @returns {Promise<Object>} - Updated bio data
 */
export const updateUserBio = async (userId, bioData) => {
  try {
    const response = await put(`api/users/bio`, bioData);

    if (!response.success) {
      throw new Error(response.message || "Failed to update bio");
    }

    return response.data;
  } catch (error) {
    console.error("Error updating user bio:", error);
    throw error;
  }
};

/**
 * Create or update user bio
 * @param {string} userId - User ID
 * @param {Object} bioData - Bio data to create or update
 * @returns {Promise<Object>} - Updated bio data
 */
export const createOrUpdateUserBio = async (userId, bioData) => {
  try {
    const response = await put(`api/users/bio`, bioData);

    if (!response.success) {
      throw new Error(response.message || "Failed to update bio");
    }

    return response.data;
  } catch (error) {
    console.error("Error creating or updating user bio:", error);
    throw error;
  }
};

/**
 * Update user cover photo
 * @param {string} userId - User ID
 * @param {FormData} formData - Form data with cover photo
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUserCoverPhoto = async (userId, formData) => {
  try {
    const response = await put(
      `api/users/cover-photo`,
      formData,
      {
        // Don't set Content-Type header for FormData
        headers: {},
      },
      "upload"
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to update cover photo");
    }

    return response.data;
  } catch (error) {
    console.error("Error updating cover photo:", error);
    throw error;
  }
};

/**
 * Follow a user
 * @param {string} userId - User ID to follow
 * @returns {Promise<Object>} - Updated user data
 */
export const followUser = async (userId) => {
  try {
    const response = await put(`api/users/follow/${userId}`, {});

    if (!response.success) {
      throw new Error(response.message || "Failed to follow user");
    }

    return response.data;
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

/**
 * Unfollow a user
 * @param {string} userId - User ID to unfollow
 * @returns {Promise<Object>} - Updated user data
 */
export const unfollowUser = async (userId) => {
  try {
    const response = await put(`api/users/unfollow/${userId}`, {});

    if (!response.success) {
      throw new Error(response.message || "Failed to unfollow user");
    }

    return response.data;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};

/**
 * Search for users
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching users
 */
export const searchUsers = async (query) => {
  try {
    const response = await get(
      `api/users/search?query=${encodeURIComponent(query)}`
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to search users");
    }

    return response.data;
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};
