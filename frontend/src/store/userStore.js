import { create } from "zustand";
import config from "@/lib/config";
import {
  setCookie,
  deleteCookie,
  hasCookie,
  getAllCookies,
} from "@/lib/cookieUtils";
import { storeToken, storeUserData, clearAuthData } from "@/lib/authUtils";

const userStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  tokenFromUrl: null, // Store token from URL for cross-domain authentication
  token: null, // Store token in state for easier access

  // Set token in state and all storage locations
  setToken: (token) => {
    console.log(
      "Setting token in store:",
      token ? token.substring(0, 10) + "..." : "null"
    );

    // Update Zustand store state
    set({ token, isAuthenticated: !!token });

    if (token && typeof window !== "undefined") {
      // Store token in all storage locations using our utility function
      const success = storeToken(token);
      console.log(`Token storage ${success ? "successful" : "failed"}`);

      // Also set HTTP-only cookie for server-side access
      try {
        setCookie("token", token, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: "/",
          secure: window.location.protocol === "https:",
          sameSite: "lax",
        });
        console.log("Token stored in HTTP-only cookie");
      } catch (cookieError) {
        console.error("Error storing token in HTTP-only cookie:", cookieError);
      }
    } else if (!token && typeof window !== "undefined") {
      // Clear all authentication data using our utility function
      clearAuthData();
      console.log("Authentication data cleared");
    }
  },

  // Set authentication from all possible storage locations (for cross-domain auth)
  setAuthFromLocalStorage: () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined") return false;

      console.log("Checking all storage locations for auth data");

      // Coba dapatkan token dari berbagai sumber dengan prioritas
      let token = null;
      let userJson = null;

      // 1. Coba dari window object
      if (window.authToken) {
        token = window.authToken;
        console.log("Found token in window object");
      }
      // 2. Coba dari localStorage
      else if (localStorage.getItem("auth_token")) {
        token = localStorage.getItem("auth_token");
        console.log("Found token in localStorage");
      }
      // 3. Coba dari sessionStorage
      else if (sessionStorage.getItem("auth_token")) {
        token = sessionStorage.getItem("auth_token");
        console.log("Found token in sessionStorage");
      }
      // 4. Coba dari direct cookie
      else if (document.cookie.includes("auth_token_direct=")) {
        try {
          const cookies = document.cookie.split("; ");
          const directTokenCookie = cookies.find((c) =>
            c.startsWith("auth_token_direct=")
          );
          if (directTokenCookie) {
            token = decodeURIComponent(directTokenCookie.split("=")[1]);
            console.log("Found token in direct cookie");
          }
        } catch (cookieError) {
          console.error(
            "Error retrieving token from direct cookie:",
            cookieError
          );
        }
      }

      // Coba dapatkan user data dari berbagai sumber
      if (localStorage.getItem("auth_user")) {
        userJson = localStorage.getItem("auth_user");
        console.log("Found user data in localStorage");
      } else if (sessionStorage.getItem("auth_user")) {
        userJson = sessionStorage.getItem("auth_user");
        console.log("Found user data in sessionStorage");
      }

      if (token && userJson) {
        const user = JSON.parse(userJson);
        console.log("Setting auth from storage", { user });

        // Simpan token di state
        set({
          token,
          user,
          isAuthenticated: true,
          loading: false,
          error: null,
        });

        // Simpan token di semua lokasi penyimpanan untuk redundansi
        try {
          window.authToken = token;
          localStorage.setItem("auth_token", token);
          sessionStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", userJson);
          sessionStorage.setItem("auth_user", userJson);
          document.cookie = `auth_token_direct=${encodeURIComponent(
            token
          )}; path=/; max-age=${30 * 24 * 60 * 60}`;
          console.log("Stored auth data in all storage locations");
        } catch (storageError) {
          console.error(
            "Error storing auth data in all locations:",
            storageError
          );
        }

        return true;
      }

      // Jika hanya token yang ditemukan tanpa user data, coba gunakan token untuk mendapatkan user data
      if (token) {
        console.log(
          "Found token but no user data, will try to fetch user data"
        );
        // Set token in state so getCurrentUser can use it
        set({ token });
        return "token-only";
      }

      return false;
    } catch (error) {
      console.error("Error setting auth from storage:", error);
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
          sameSite: "none",
        });
      }

      // Also set a non-httpOnly cookie for client-side detection
      setCookie("auth_status", "logged_in", {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });

      // Store authentication in all storage locations using utility functions
      if (typeof window !== "undefined") {
        // Store token in all storage locations
        const tokenStored = storeToken(data.token);
        console.log(`Token storage ${tokenStored ? "successful" : "failed"}`);

        // Store user data in all storage locations
        const userDataStored = storeUserData(data.user);
        console.log(
          `User data storage ${userDataStored ? "successful" : "failed"}`
        );
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

      // Periksa semua kemungkinan lokasi token
      const hasToken = hasCookie("token");
      const hasDevToken = hasCookie("dev_token");
      const hasAuthStatus =
        hasCookie("auth_status") || hasCookie("dev_auth_status");
      const { tokenFromUrl, token: stateToken } = userStore.getState();

      // Check for token in all storage locations
      const localStorageToken =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const sessionStorageToken =
        typeof window !== "undefined"
          ? sessionStorage.getItem("auth_token")
          : null;
      const windowToken =
        typeof window !== "undefined" && window.authToken
          ? window.authToken
          : null;

      // Check for token in direct cookie
      let directCookieToken = null;
      if (
        typeof window !== "undefined" &&
        document.cookie.includes("auth_token_direct=")
      ) {
        try {
          const cookies = document.cookie.split("; ");
          const directTokenCookie = cookies.find((c) =>
            c.startsWith("auth_token_direct=")
          );
          if (directTokenCookie) {
            directCookieToken = decodeURIComponent(
              directTokenCookie.split("=")[1]
            );
          }
        } catch (cookieError) {
          console.error(
            "Error retrieving token from direct cookie:",
            cookieError
          );
        }
      }

      // Check for token in dev cookie
      let devCookieToken = null;
      if (
        typeof window !== "undefined" &&
        document.cookie.includes("dev_token=")
      ) {
        try {
          const cookies = document.cookie.split("; ");
          const devTokenCookie = cookies.find((c) =>
            c.startsWith("dev_token=")
          );
          if (devTokenCookie) {
            devCookieToken = decodeURIComponent(devTokenCookie.split("=")[1]);
          }
        } catch (cookieError) {
          console.error("Error retrieving token from dev cookie:", cookieError);
        }
      }

      console.log("Auth sources available:", {
        cookieToken: hasToken,
        devCookieToken: hasDevToken,
        cookieAuthStatus: hasAuthStatus,
        urlToken: !!tokenFromUrl,
        stateToken: !!stateToken,
        localStorageToken: !!localStorageToken,
        sessionStorageToken: !!sessionStorageToken,
        windowToken: !!windowToken,
        directCookieToken: !!directCookieToken,
        devCookieToken: !!devCookieToken,
      });

      // Check if we have any form of authentication
      if (
        !hasToken &&
        !hasDevToken &&
        !hasAuthStatus &&
        !tokenFromUrl &&
        !stateToken &&
        !localStorageToken &&
        !sessionStorageToken &&
        !windowToken &&
        !directCookieToken &&
        !devCookieToken
      ) {
        console.log("No authentication tokens found in any source");

        // Instead of throwing an error, just set the state to unauthenticated
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: "No authentication token found",
        });

        // Log the issue but don't redirect to login
        console.log(
          "No authentication token found, continuing as unauthenticated user"
        );

        // Return early to prevent the API call
        return null;
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

      // Add Authorization header if we have a token from any source (in order of priority)
      if (tokenFromUrl) {
        headers["Authorization"] = `Bearer ${tokenFromUrl}`;
        console.log("Using token from URL for authorization");
      } else if (stateToken) {
        headers["Authorization"] = `Bearer ${stateToken}`;
        console.log("Using token from state for authorization");
      } else if (windowToken) {
        headers["Authorization"] = `Bearer ${windowToken}`;
        console.log("Using token from window object for authorization");
      } else if (localStorageToken) {
        headers["Authorization"] = `Bearer ${localStorageToken}`;
        console.log("Using token from localStorage for authorization");
      } else if (sessionStorageToken) {
        headers["Authorization"] = `Bearer ${sessionStorageToken}`;
        console.log("Using token from sessionStorage for authorization");
      } else if (directCookieToken) {
        headers["Authorization"] = `Bearer ${directCookieToken}`;
        console.log("Using token from direct cookie for authorization");
      } else if (devCookieToken) {
        headers["Authorization"] = `Bearer ${devCookieToken}`;
        console.log("Using token from dev cookie for authorization");
      } else if (hasToken || hasDevToken) {
        // Jika token ada di httpOnly cookie, tidak perlu menambahkan header Authorization
        // karena browser akan mengirimkan cookie secara otomatis
        console.log("Using token from httpOnly cookie for authorization");
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

      // Simpan user data di state
      set({
        user: data.data,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      // Simpan user data di semua lokasi penyimpanan menggunakan utility functions
      try {
        // Store user data in all storage locations
        const userDataStored = storeUserData(data.data);
        console.log(
          `User data storage ${userDataStored ? "successful" : "failed"}`
        );

        // Get effective token from all possible sources
        const effectiveToken =
          tokenFromUrl ||
          stateToken ||
          windowToken ||
          localStorageToken ||
          sessionStorageToken ||
          directCookieToken ||
          devCookieToken;

        // Store token in all storage locations if available
        if (effectiveToken) {
          const tokenStored = storeToken(effectiveToken);
          console.log(`Token storage ${tokenStored ? "successful" : "failed"}`);
        }
      } catch (storageError) {
        console.error("Error storing user data in storage:", storageError);
      }

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
      // Send a request to the backend to clear the session
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

      // Clear all cookies
      deleteCookie("token", {
        path: "/",
        secure: window.location.protocol === "https:",
        sameSite: "none",
      });
      deleteCookie("auth_status", {
        path: "/",
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });
      deleteCookie("dev_token", {
        path: "/",
        secure: window.location.protocol === "https:",
        sameSite: "none",
      });
      deleteCookie("auth_token_direct", {
        path: "/",
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });
      console.log("Cleared all auth cookies");

      // Clear all storage auth data
      if (typeof window !== "undefined") {
        // Clear localStorage
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token_backup");

        // Clear sessionStorage
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_user");
        sessionStorage.removeItem("auth_token_backup");

        // Clear window object
        if (window.authToken) delete window.authToken;
        if (window.authUser) delete window.authUser;

        // Use clearAuthData utility function for additional cleanup
        clearAuthData();

        console.log("Cleared all storage auth data");
      }

      // Reset state
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        tokenFromUrl: null,
        token: null,
        loading: false,
      });

      console.log("Logout successful, all auth data cleared");
    } catch (error) {
      console.error("Error logging out:", error);
      set({ error: error.message });

      // Even if the server request fails, still clear all auth data
      try {
        // Clear cookies manually
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "auth_status=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "dev_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "auth_token_direct=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // Clear all storage
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          localStorage.removeItem("auth_token_backup");

          sessionStorage.removeItem("auth_token");
          sessionStorage.removeItem("auth_user");
          sessionStorage.removeItem("auth_token_backup");

          if (window.authToken) delete window.authToken;
          if (window.authUser) delete window.authUser;

          clearAuthData();
        }

        console.log("Manually cleared all auth data after logout error");
      } catch (clearError) {
        console.error("Error clearing auth data:", clearError);
      }

      // Reset state
      set({
        user: null,
        isAuthenticated: false,
        tokenFromUrl: null,
        token: null,
        loading: false,
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
        sameSite: "none",
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

  // Debug function to check user state
  checkUser: () => {
    const state = get();
    console.log("Current user state:", {
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      error: state.error,
      token: state.token ? "[TOKEN EXISTS]" : null,
    });
    return state.user;
  },
}));

export default userStore;
