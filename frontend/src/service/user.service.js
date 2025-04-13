import { get, post, put } from "@/lib/api";
import userStore from "@/store/userStore";

/**
 * Fetch user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile data
 */
export const fetchUserProfile = async (userId) => {
  try {
    console.log(`Fetching user profile for user ${userId}...`);

    // Get current user from store
    const { user } = userStore.getState();

    // Fetch user profile from API
    const response = await get(`api/users/${userId}`);

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch user profile");
    }

    console.log(`User profile fetched successfully:`, response.data);

    // Check if the profile belongs to the current user
    const isOwner = user && user._id === userId;

    // If this is the current user's profile, update the user data in the store
    if (isOwner) {
      console.log(`Updating current user data in store with profile data`);
      userStore.getState().setUser(response.data);
    }

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
    console.log(`Updating profile for user ${userId}`);

    // Log form data contents (for debugging)
    for (let [key, value] of formData.entries()) {
      if (key === "profilePicture" || key === "coverPhoto") {
        console.log(`FormData contains ${key}: [File]`);
      } else {
        console.log(`FormData contains ${key}: ${value}`);
      }
    }

    // Check if formData contains profilePicture
    const hasProfilePicture = formData.has("profilePicture");
    console.log(`Has profile picture: ${hasProfilePicture}`);

    // If there's a profile picture, use the profile-picture endpoint
    if (hasProfilePicture) {
      console.log("Using profile-picture endpoint");
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

      console.log("Profile picture update successful:", response.data);
      return response.data;
    } else {
      // Otherwise use the regular profile endpoint
      console.log("Using regular profile endpoint");

      // Convert FormData to JSON for regular profile endpoint
      // This is because the backend expects JSON for the regular profile endpoint
      const profileData = {};
      for (let [key, value] of formData.entries()) {
        profileData[key] = value;
      }

      console.log("Converted profile data:", profileData);

      const response = await put(
        `api/users/profile`,
        profileData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
        "upload"
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to update profile");
      }

      console.log("Profile update successful:", response.data);
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
    console.log(`Sending bio update request for user ${userId}:`, bioData);

    // Ensure work and education are properly formatted as arrays
    const sanitizedBioData = {
      ...bioData,
      work: Array.isArray(bioData.work) ? bioData.work : [],
      education: Array.isArray(bioData.education) ? bioData.education : [],
    };

    console.log(`Sanitized bio data:`, sanitizedBioData);

    // Make sure we're sending the right Content-Type header
    const response = await put(`api/users/bio`, sanitizedBioData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to update bio");
    }

    console.log("Bio update successful, response:", response);
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
    console.log(`Updating cover photo for user ${userId}`);

    // Log form data contents (for debugging)
    for (let [key, value] of formData.entries()) {
      if (key === "coverPhoto") {
        console.log(`FormData contains ${key}: [File]`);
      } else {
        console.log(`FormData contains ${key}: ${value}`);
      }
    }

    console.log("Using cover-photo endpoint");
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

    console.log("Cover photo update successful:", response.data);
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

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    console.log(`Getting user profile for user ${userId}...`);

    const response = await get(`api/users/${userId}`);

    if (!response.success) {
      throw new Error(response.message || "Failed to get user profile");
    }

    console.log(`User profile retrieved successfully:`, response.data);

    // Get current user from store
    const { user } = userStore.getState();

    // If this is the current user's profile, update the user data in the store
    if (user && user._id === userId) {
      console.log(`Updating current user data in store with profile data`);
      userStore.getState().setUser(response.data);
    }

    return response.data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};
