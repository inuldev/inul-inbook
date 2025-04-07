import { get, post, put, del } from "@/lib/api";

/**
 * Get all users for friend suggestions (excluding current user and friends)
 * @returns {Promise<Array>} - List of users
 */
export const getFriendSuggestions = async () => {
  try {
    const response = await get("api/friends/suggestions");
    
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch friend suggestions");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error fetching friend suggestions:", error);
    throw error;
  }
};

/**
 * Get all friend requests for the current user
 * @returns {Promise<Array>} - List of friend requests
 */
export const getFriendRequests = async () => {
  try {
    const response = await get("api/friends/requests");
    
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch friend requests");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    throw error;
  }
};

/**
 * Send a friend request to another user
 * @param {string} userId - ID of the user to send a request to
 * @returns {Promise<Object>} - Result of the operation
 */
export const sendFriendRequest = async (userId) => {
  try {
    const response = await post(`api/friends/request/${userId}`);
    
    if (!response.success) {
      throw new Error(response.message || "Failed to send friend request");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error sending friend request:", error);
    throw error;
  }
};

/**
 * Accept a friend request
 * @param {string} requestId - ID of the friend request
 * @returns {Promise<Object>} - Result of the operation
 */
export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await put(`api/friends/accept/${requestId}`);
    
    if (!response.success) {
      throw new Error(response.message || "Failed to accept friend request");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error accepting friend request:", error);
    throw error;
  }
};

/**
 * Decline a friend request
 * @param {string} requestId - ID of the friend request
 * @returns {Promise<Object>} - Result of the operation
 */
export const declineFriendRequest = async (requestId) => {
  try {
    const response = await put(`api/friends/decline/${requestId}`);
    
    if (!response.success) {
      throw new Error(response.message || "Failed to decline friend request");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error declining friend request:", error);
    throw error;
  }
};

/**
 * Remove a friend
 * @param {string} userId - ID of the user to unfriend
 * @returns {Promise<Object>} - Result of the operation
 */
export const removeFriend = async (userId) => {
  try {
    const response = await del(`api/friends/${userId}`);
    
    if (!response.success) {
      throw new Error(response.message || "Failed to remove friend");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
};
