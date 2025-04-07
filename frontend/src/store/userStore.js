import { create } from "zustand";
import config from "@/lib/config";

const userStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

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
      const hasToken = document.cookie.includes("token=");
      console.log("Token cookie present after login:", hasToken);

      if (!hasToken) {
        console.warn("No token cookie found after successful login");
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
    set({ loading: true, error: null });
    try {
      // Check if token exists in cookies
      const cookies = document.cookie;
      console.log("Current cookies:", cookies);

      const hasToken = cookies.includes("token=");
      if (!hasToken) {
        console.log("No token found in cookies");
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${config.backendUrl}/api/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: config.apiTimeouts.medium,
      });

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

      // Clear the token cookie
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error("Error logging out:", error);
      set({ error: error.message });
      // Even if the server request fails, still clear the local state
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },

  clearErrors: () => set({ error: null }),
}));

export default userStore;
