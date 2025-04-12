import { useState } from "react";
import { setCookie } from "@/lib/cookieUtils";
import { debugLog, logAuth, logAuthState } from "@/lib/debugUtils";
import userStore from "@/store/userStore";
import { clearAuthData } from "@/lib/authUtils";

/**
 * Custom hook for handling Google OAuth authentication
 * @returns {Object} Google auth methods and state
 */
export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initiate Google OAuth login flow with enhanced cross-domain support
   * @param {Function} clearErrors - Function to clear previous errors
   * @returns {boolean} Success status
   */
  const initiateGoogleLogin = (clearErrors) => {
    try {
      setLoading(true);
      setError(null);

      // Clear any previous errors if a function is provided
      if (typeof clearErrors === "function") {
        clearErrors();
      }

      // Log current auth state before starting OAuth flow
      logAuth("Starting Google OAuth flow");
      logAuthState();

      // Save current URL to session storage for potential redirect after login
      if (typeof window !== "undefined") {
        // Store the current path for redirect after login
        sessionStorage.setItem("loginRedirectUrl", window.location.pathname);

        // Store the frontend URL for the callback
        const frontendUrl = window.location.origin;
        sessionStorage.setItem("frontendUrl", frontendUrl);

        // Store detailed debug info
        const debugInfo = {
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer, // Konsisten menggunakan 'referrer'
          cookies: document.cookie ? "present" : "none",
          localStorage: localStorage.length > 0 ? "present" : "none",
          origin: window.location.origin,
          hostname: window.location.hostname,
          protocol: window.location.protocol,
        };

        sessionStorage.setItem("googleAuthDebug", JSON.stringify(debugInfo));
        debugLog("oauth", "Stored debug info in sessionStorage", debugInfo);
      }

      // Determine the best Google OAuth URL to use
      let googleAuthUrl;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      // First try: Use the Next.js API route (proxy) for better error handling
      googleAuthUrl = "/api/auth/google";

      // Add state parameter for security and tracking
      const state = {
        timestamp: Date.now(),
        origin: window.location.origin,
        path: window.location.pathname,
        referrer: document.referrer,
        clientId: Math.random().toString(36).substring(2, 15), // Add a unique client ID
      };

      // Store state in sessionStorage for verification on callback
      sessionStorage.setItem("googleAuthState", JSON.stringify(state));

      // Add state parameter to URL
      googleAuthUrl += `?state=${encodeURIComponent(JSON.stringify(state))}`;

      // Add timestamp to prevent caching
      googleAuthUrl += `&_=${Date.now()}`;

      debugLog("oauth", "Using Google OAuth URL with state parameter", {
        googleAuthUrl,
        backendUrl,
        environment: process.env.NODE_ENV,
      });

      // Clear ALL existing auth tokens and user data before starting new auth flow
      try {
        console.log(
          "Clearing all authentication data before starting new OAuth flow"
        );

        // Gunakan utility function untuk menghapus semua data autentikasi
        clearAuthData();

        debugLog(
          "oauth",
          "Cleared ALL existing auth tokens and user data before starting new flow"
        );
      } catch (clearError) {
        debugLog(
          "oauth",
          "Error clearing existing tokens and user data",
          clearError
        );
      }

      // Add a small delay to ensure logs are captured before redirect
      setTimeout(() => {
        debugLog("oauth", `Redirecting to Google OAuth: ${googleAuthUrl}`);

        // Try to open in same window
        window.location.href = googleAuthUrl;

        // Fallback: try to open in a new window if redirect doesn't work
        setTimeout(() => {
          debugLog("oauth", "Trying fallback: window.open");
          window.open(googleAuthUrl, "_self");
        }, 1000);
      }, 100);

      return true;
    } catch (error) {
      console.error("Error initiating Google login:", error);
      logAuth("Google OAuth error", {
        error: error.message,
        stack: error.stack,
      });

      setError(
        "Failed to connect to authentication service. Please try again."
      );
      setLoading(false);
      return false;
    }
  };

  /**
   * Handle the response from Google OAuth with enhanced cross-domain support
   * @param {Object} searchParams - URL search parameters from the callback
   * @param {Function} getCurrentUser - Function to fetch the current user
   * @param {Function} onSuccess - Callback function on successful authentication
   * @param {Function} onError - Callback function on authentication error
   * @returns {Promise<boolean>} Success status
   */
  const handleGoogleCallback = async (
    searchParams,
    getCurrentUser,
    onSuccess,
    onError
  ) => {
    try {
      debugLog("oauth", "Processing Google OAuth callback");
      logAuthState();

      // Get debug info from session storage
      let debugInfo = null;
      try {
        const debugInfoStr = sessionStorage.getItem("googleAuthDebug");
        if (debugInfoStr) {
          debugInfo = JSON.parse(debugInfoStr);
          debugLog(
            "oauth",
            "Retrieved debug info from sessionStorage",
            debugInfo
          );
        }
      } catch (e) {
        debugLog("oauth", "Error retrieving debug info", e);
      }

      // Log search params
      const searchParamsObj = Object.fromEntries(searchParams.entries());
      debugLog("oauth", "Search params:", searchParamsObj);

      // Check if we have the loginSuccess parameter
      const loginSuccess = searchParams.get("loginSuccess");
      const tokenSet = searchParams.get("tokenSet");
      const provider = searchParams.get("provider");

      // Verify state parameter if present (security check)
      const stateParam = searchParams.get("state");
      let stateValid = false;

      if (stateParam) {
        try {
          // Get stored state from sessionStorage
          const storedState = sessionStorage.getItem("googleAuthState");

          if (storedState) {
            const parsedStoredState = JSON.parse(storedState);
            const parsedStateParam = JSON.parse(decodeURIComponent(stateParam));

            // Check if timestamps are close (within 10 minutes)
            const timeDiff = Math.abs(
              parsedStateParam.timestamp - parsedStoredState.timestamp
            );
            stateValid = timeDiff < 10 * 60 * 1000; // 10 minutes

            debugLog("oauth", "State validation", {
              stateValid,
              timeDiff,
              storedState: parsedStoredState,
              receivedState: parsedStateParam,
            });
          }
        } catch (stateError) {
          debugLog("oauth", "Error validating state parameter", stateError);
          // Non-fatal error, continue with authentication
        }
      }

      debugLog("oauth", "Auth parameters", {
        loginSuccess,
        tokenSet,
        provider,
      });

      // Log all cookies for debugging
      debugLog("oauth", "Cookies present:", document.cookie);
      const allCookies = document.cookie.split("; ").reduce((obj, cookie) => {
        if (cookie) {
          const [name, value] = cookie.split("=");
          if (name) obj[name] = value;
        }
        return obj;
      }, {});
      debugLog("oauth", "Parsed cookies:", allCookies);

      // Log localStorage
      const localStorageItems = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        localStorageItems[key] = localStorage.getItem(key);
      }
      debugLog("oauth", "LocalStorage items:", localStorageItems);

      if (loginSuccess === "true" || provider === "google") {
        debugLog("oauth", "Login success detected");

        // Check if we have auth cookies
        const hasTokenCookie = document.cookie.includes("token=");
        const hasAuthStatusCookie = document.cookie.includes("auth_status=");

        debugLog("oauth", "Cookie status", {
          hasTokenCookie,
          hasAuthStatusCookie,
        });

        // Check if we have a token in the URL - this is our primary method in production
        const tokenParam = searchParams.get("token");
        const userId = searchParams.get("userId");
        const username = searchParams.get("username");
        const email = searchParams.get("email");
        const profilePicture = searchParams.get("profilePicture");

        debugLog("oauth", "URL parameters", {
          hasToken: !!tokenParam,
          hasUserId: !!userId,
          tokenLength: tokenParam ? tokenParam.length : 0,
        });

        if (tokenParam) {
          debugLog(
            "oauth",
            "Token found in URL, setting cookies and localStorage"
          );

          // Set cookies manually with different options for different environments
          const isSecure = window.location.protocol === "https:";
          const isProduction =
            process.env.NODE_ENV === "production" ||
            window.location.hostname !== "localhost";

          debugLog("oauth", "Cookie settings", {
            isSecure,
            isProduction,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
          });

          // Set the token cookie
          setCookie("token", tokenParam, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            secure: isSecure,
            sameSite: isProduction ? "none" : "lax",
          });

          // Set the auth status cookie
          setCookie("auth_status", "logged_in", {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            secure: isSecure,
            sameSite: "lax", // This can be lax for better compatibility
          });

          // Also try setting cookies directly with document.cookie as a fallback
          try {
            document.cookie = `token=${encodeURIComponent(
              tokenParam
            )}; path=/; max-age=${60 * 60 * 24 * 30}${
              isSecure ? "; Secure" : ""
            }; SameSite=${isProduction ? "None" : "Lax"}`;
            document.cookie = `auth_status=logged_in; path=/; max-age=${
              60 * 60 * 24 * 30
            }${isSecure ? "; Secure" : ""}; SameSite=Lax`;
            debugLog("oauth", "Fallback cookies set directly");
          } catch (cookieError) {
            debugLog("oauth", "Error setting fallback cookies", cookieError);
          }

          // Store in localStorage as another fallback
          try {
            localStorage.setItem("auth_token", tokenParam);

            // Store user data if available
            if (userId) {
              const userData = {
                _id: userId,
                username: username || "",
                email: email || "",
                profilePicture: profilePicture || "",
              };
              localStorage.setItem("auth_user", JSON.stringify(userData));
              debugLog("oauth", "User data stored in localStorage", userData);
            }

            debugLog("oauth", "Auth data stored in localStorage");
          } catch (storageError) {
            debugLog("oauth", "Error storing in localStorage", storageError);
          }

          // Verify cookies and localStorage were set
          setTimeout(() => {
            const cookiesAfter = document.cookie;
            const hasTokenAfter = cookiesAfter.includes("token=");
            const hasAuthStatusAfter = cookiesAfter.includes("auth_status=");
            const hasLocalStorageToken = !!localStorage.getItem("auth_token");
            const hasLocalStorageUser = !!localStorage.getItem("auth_user");

            debugLog("oauth", "Auth storage verification", {
              cookiesPresent: cookiesAfter ? "yes" : "no",
              hasTokenCookie: hasTokenAfter,
              hasAuthStatusCookie: hasAuthStatusAfter,
              hasLocalStorageToken,
              hasLocalStorageUser,
            });
          }, 100);
        }

        // If token cookie is missing but auth was successful, set a fallback cookie
        if (
          !hasAuthStatusCookie &&
          (tokenSet === "true" || provider === "google")
        ) {
          debugLog("oauth", "Setting fallback auth_status cookie");
          setCookie("auth_status", "logged_in", {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            secure: window.location.protocol === "https:",
            sameSite: "lax",
          });
        }

        // Try to get the current user
        try {
          // Check if we have auth in localStorage as a fallback
          const localStorageToken = localStorage.getItem("auth_token");
          const localStorageUser = localStorage.getItem("auth_user");

          if (localStorageToken && localStorageUser) {
            debugLog("oauth", "Using localStorage auth data");
            // We can use the localStorage data to set the user directly
            try {
              const userData = JSON.parse(localStorageUser);
              debugLog("oauth", "User data from localStorage", userData);

              // Update the user store directly
              if (userData && userData._id) {
                debugLog("oauth", "Setting user data from localStorage");
                userStore.setState({
                  user: userData,
                  isAuthenticated: true,
                  loading: false,
                  error: null,
                  tokenFromUrl: localStorageToken,
                });

                if (typeof onSuccess === "function") {
                  onSuccess();
                }
                return true;
              }
            } catch (parseError) {
              debugLog(
                "oauth",
                "Error parsing user data from localStorage",
                parseError
              );
            }
          }

          // Try to get the current user from the API
          debugLog("oauth", "Fetching user data from API");
          await getCurrentUser();
          debugLog("oauth", "User data fetched successfully from API");

          if (typeof onSuccess === "function") {
            onSuccess();
          }
          return true;
        } catch (error) {
          debugLog("oauth", "Error fetching user after Google login", {
            error: error.message,
            stack: error.stack,
          });

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

        debugLog("oauth", "Authentication error", {
          errorMsg,
          searchParams: searchParamsObj,
        });

        if (typeof onError === "function") {
          onError(errorMessage);
        }
        return false;
      }
    } catch (error) {
      debugLog("oauth", "Error handling Google callback", {
        error: error.message,
        stack: error.stack,
      });

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
