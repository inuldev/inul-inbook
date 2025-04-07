"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import userStore from "@/store/userStore";

const publicRoutes = ["/user-login", "/user-register", "/forgot-password"];

export default function AuthProvider({ children }) {
  const { getCurrentUser, isAuthenticated, loading } = userStore();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const hasToken = document.cookie.includes("token=");

      if (!hasToken) {
        userStore.setState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
        return;
      }

      try {
        await getCurrentUser();
      } catch (error) {
        console.error("Auth check failed:", error);
        // Clear invalid token
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        userStore.setState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    };

    checkAuth();
  }, [getCurrentUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return children;
}
