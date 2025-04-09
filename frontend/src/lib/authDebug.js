/**
 * Utility functions for debugging authentication issues
 */

import { getAllCookies } from "./cookieUtils";

/**
 * Log detailed authentication information for debugging
 * @param {string} source - The source of the log (e.g., 'login', 'callback')
 * @param {Object} [additionalInfo={}] - Additional information to log
 */
export function logAuthDebugInfo(source, additionalInfo = {}) {
  try {
    console.group(`Auth Debug Info (${source})`);

    // Log basic environment info
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
    console.log("Current URL:", window.location.href);
    console.log("Origin:", window.location.origin);
    console.log("Referer:", document.referer); // referer is the correct spelling

    // Log cookies
    console.log("Cookies:", getAllCookies());

    // Log session storage items related to auth
    const sessionItems = {};
    const authKeys = [
      "loginRedirectUrl",
      "frontendUrl",
      "googleAuthTimestamp",
      "googleAuthState",
      "authError",
    ];

    authKeys.forEach((key) => {
      const value = sessionStorage.getItem(key);
      if (value) {
        sessionItems[key] = value;
      }
    });

    console.log("Session Storage:", sessionItems);

    // Log additional info
    if (Object.keys(additionalInfo).length > 0) {
      console.log("Additional Info:", additionalInfo);
    }

    console.groupEnd();
  } catch (error) {
    console.error("Error logging auth debug info:", error);
  }
}

/**
 * Store authentication error information in session storage
 * @param {string} errorMessage - The error message
 * @param {Object} [errorDetails={}] - Additional error details
 */
export function storeAuthError(errorMessage, errorDetails = {}) {
  try {
    const errorInfo = {
      message: errorMessage,
      timestamp: new Date().toISOString(),
      ...errorDetails,
    };

    sessionStorage.setItem("authError", JSON.stringify(errorInfo));
    console.error("Auth error stored:", errorInfo);
  } catch (error) {
    console.error("Error storing auth error:", error);
  }
}

/**
 * Get stored authentication error information
 * @returns {Object|null} The stored error information or null if none exists
 */
export function getStoredAuthError() {
  try {
    const errorJson = sessionStorage.getItem("authError");
    if (!errorJson) return null;

    return JSON.parse(errorJson);
  } catch (error) {
    console.error("Error retrieving stored auth error:", error);
    return null;
  }
}

/**
 * Clear stored authentication error information
 */
export function clearStoredAuthError() {
  try {
    sessionStorage.removeItem("authError");
  } catch (error) {
    console.error("Error clearing stored auth error:", error);
  }
}
