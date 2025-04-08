import { useState } from "react";
import { setCookie } from "@/lib/cookieUtils";

/**
 * Custom hook for handling Google OAuth authentication
 * @returns {Object} Google auth methods and state
 */
export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initiate Google OAuth login flow
   * @param {Function} clearErrors - Function to clear previous errors
   * @returns {void}
   */
  const initiateGoogleLogin = (clearErrors) => {
    try {
      setLoading(true);
      setError(null);

      // Clear any previous errors if a function is provided
      if (typeof clearErrors === "function") {
        clearErrors();
      }

      // Save current URL to session storage for potential redirect after login
      if (typeof window !== "undefined") {
        // Store the current path for redirect after login
        sessionStorage.setItem("loginRedirectUrl", window.location.pathname);

        // Store the frontend URL for the callback
        const frontendUrl = window.location.origin;
        sessionStorage.setItem("frontendUrl", frontendUrl);

        // Store timestamp for debugging
        sessionStorage.setItem("googleAuthTimestamp", Date.now().toString());
      }

      // Use window.location for OAuth redirect as router.push won't work for external URLs
      const googleAuthUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`;
      console.log("Redirecting to Google OAuth:", googleAuthUrl);

      // Redirect to Google OAuth
      window.location.href = googleAuthUrl;

      // Note: The function doesn't return after this point in most cases
      // as the browser is redirected
    } catch (error) {
      console.error("Error initiating Google login:", error);
      setError(
        "Failed to connect to authentication service. Please try again."
      );
      setLoading(false);
      return false;
    }
  };

  /**
   * Handle the response from Google OAuth
   * @param {Object} searchParams - URL search parameters from the callback
   * @param {Function} getCurrentUser - Function to fetch the current user
   * @param {Function} onSuccess - Callback function on successful authentication
   * @param {Function} onError - Callback function on authentication error
   */
  const handleGoogleCallback = async (
    searchParams,
    getCurrentUser,
    onSuccess,
    onError
  ) => {
    try {
      console.log("Processing Google OAuth callback");
      console.log("Search params:", Object.fromEntries(searchParams.entries()));

      // Check if we have the loginSuccess parameter
      const loginSuccess = searchParams.get("loginSuccess");
      const tokenSet = searchParams.get("tokenSet");

      // Log all cookies for debugging
      console.log("Cookies present:", document.cookie);
      const allCookies = document.cookie.split("; ").reduce((obj, cookie) => {
        if (cookie) {
          const [name, value] = cookie.split("=");
          if (name) obj[name] = value;
        }
        return obj;
      }, {});
      console.log("Parsed cookies:", allCookies);

      if (loginSuccess === "true") {
        console.log("Login success detected");

        // Check if we have auth cookies
        const hasTokenCookie = document.cookie.includes("token=");
        const hasAuthStatusCookie = document.cookie.includes("auth_status=");

        console.log("Token cookie present:", hasTokenCookie);
        console.log("Auth status cookie present:", hasAuthStatusCookie);

        // Check if we have a token in the URL (for debugging only)
        const tokenParam = searchParams.get("token");
        if (tokenParam && tokenSet === "true") {
          console.log("Token found in URL, setting cookies manually");

          // Set cookies manually
          setCookie("token", tokenParam, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            secure: window.location.protocol === "https:",
            sameSite: "lax",
          });

          setCookie("auth_status", "logged_in", {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            secure: window.location.protocol === "https:",
            sameSite: "lax",
          });
        }

        // If token cookie is missing but auth was successful, set a fallback cookie
        if (!hasAuthStatusCookie && tokenSet === "true") {
          console.log("Setting fallback auth_status cookie");
          setCookie("auth_status", "logged_in", {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            secure: window.location.protocol === "https:",
            sameSite: "lax",
          });
        }

        // Try to get the current user
        try {
          await getCurrentUser();
          console.log("User data fetched successfully");

          if (typeof onSuccess === "function") {
            onSuccess();
          }
          return true;
        } catch (error) {
          console.error("Error fetching user after Google login:", error);
          if (typeof onError === "function") {
            onError("Failed to fetch user data. Please try again.");
          }
          return false;
        }
      } else {
        // Check for error parameter
        const errorMsg = searchParams.get("error");
        const errorMessage = errorMsg
          ? `Authentication error: ${errorMsg}`
          : "Authentication failed: Invalid response";

        console.error(errorMessage);
        if (typeof onError === "function") {
          onError(errorMessage);
        }
        return false;
      }
    } catch (error) {
      console.error("Error handling Google callback:", error);
      if (typeof onError === "function") {
        onError("An unexpected error occurred. Please try again.");
      }
      return false;
    }
  };

  return {
    initiateGoogleLogin,
    handleGoogleCallback,
    loading,
    error,
  };
}
