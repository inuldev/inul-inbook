import { create } from "zustand";
import config from "@/lib/config";
import {
  setCookie,
  deleteCookie,
  hasCookie,
  getAllCookies,
} from "@/lib/cookieUtils";

const userStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  tokenFromUrl: null, // Store token from URL for cross-domain authentication

  // Set authentication from local storage (for cross-domain auth)
  setAuthFromLocalStorage: () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("auth_token");
      const userJson = localStorage.getItem("auth_user");

      if (token && userJson) {
        const user = JSON.parse(userJson);
        console.log("Setting auth from local storage", { user });

        set({
          user,
          isAuthenticated: true,
          loading: false,
          error: null,
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error setting auth from local storage:", error);
      return false;
    }
  },

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${config.backendUrl}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        timeout: config.apiTimeouts.medium,
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Check if token cookie was set
      const hasToken = hasCookie("token");
      console.log("Token cookie present after login:", hasToken);

      if (!hasToken) {
        console.warn("No token cookie found after successful login");
        // If cookie wasn't set, try to set it manually
        setCookie("token", data.token, {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          secure: window.location.protocol === "https:",
          sameSite: "lax",
        });
      }

      // Also set a non-httpOnly cookie for client-side detection
      setCookie("auth_status", "logged_in", {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });

      // Store authentication in local storage for cross-domain auth
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        console.log("Stored authentication in local storage");
      }

      set({
        user: data.user, // Updated to match the response structure from backend
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return data;
    } catch (error) {
      console.error("Login error:", error);
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: error.message,
      });
      throw error;
    }
  },

  getCurrentUser: async () => {
    // If we're already authenticated and have user data, don't fetch again
    const state = userStore.getState();
    if (state.isAuthenticated && state.user && !state.loading) {
      console.log("Already authenticated with user data, skipping fetch");
      return state.user;
    }

    set({ loading: true, error: null });
    try {
      // Check if token exists in cookies or local storage
      const cookies = getAllCookies();
      console.log("Current cookies in getCurrentUser:", cookies);

      const hasToken = hasCookie("token");
      const hasAuthStatus = hasCookie("auth_status");
      const { tokenFromUrl } = userStore.getState();

      // Check for token in local storage (for cross-domain auth)
      const localStorageToken =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      console.log("Auth sources available:", {
        cookieToken: hasToken,
        cookieAuthStatus: hasAuthStatus,
        urlToken: !!tokenFromUrl,
        localStorageToken: !!localStorageToken,
      });

      // Check if we have any form of authentication
      if (!hasToken && !hasAuthStatus && !tokenFromUrl && !localStorageToken) {
        console.log("No authentication tokens found in any source");
        throw new Error("No authentication token found");
      }

      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();

      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      };

      // Add Authorization header if we have a token from any source
      if (tokenFromUrl) {
        headers["Authorization"] = `Bearer ${tokenFromUrl}`;
        console.log("Using token from URL for authorization");
      } else if (localStorageToken) {
        headers["Authorization"] = `Bearer ${localStorageToken}`;
        console.log("Using token from local storage for authorization");
      }

      const response = await fetch(
        `${config.backendUrl}/api/auth/me?_=${timestamp}`,
        {
          method: "GET",
          credentials: "include",
          headers,
          timeout: config.apiTimeouts.medium,
        }
      );

      console.log("Auth response status:", response.status);
      const data = await response.json();
      console.log("Auth response data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch user");
      }

      set({
        user: data.data,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return data.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: error.message,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Changed from POST to GET to match the backend route definition
      const response = await fetch(`${config.backendUrl}/api/auth/logout`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: config.apiTimeouts.short,
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Clear both cookies
      deleteCookie("token", {
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });
      deleteCookie("auth_status", {
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });
      console.log("Cleared auth cookies");

      // Clear local storage auth data
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        console.log("Cleared local storage auth data");
      }

      set({
        user: null,
        isAuthenticated: false,
        error: null,
        tokenFromUrl: null, // Clear the token from URL
      });
    } catch (error) {
      console.error("Error logging out:", error);
      set({ error: error.message });
      // Even if the server request fails, still clear the local state
      set({
        user: null,
        isAuthenticated: false,
        tokenFromUrl: null, // Clear the token from URL
      });
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${config.backendUrl}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        timeout: config.apiTimeouts.medium,
      });

      const data = await response.json();
      console.log("Register response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Set auth cookies
      setCookie("token", data.token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });
      setCookie("auth_status", "logged_in", {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });

      // Store authentication in local storage for cross-domain auth
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        console.log(
          "Stored authentication in local storage after registration"
        );
      }

      set({
        user: data.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: error.message,
      });
      throw error;
    }
  },

  clearErrors: () => set({ error: null }),
}));

export default userStore;
