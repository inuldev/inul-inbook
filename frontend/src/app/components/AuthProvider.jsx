"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import Loader from "@/lib/Loader";
import userStore from "@/store/userStore";

const publicRoutes = ["/user-login", "/user-register", "/forgot-password"];

export default function AuthProvider({ children }) {
  const { getCurrentUser, loading } = userStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginSuccess = searchParams.get("loginSuccess");
  const [authChecked, setAuthChecked] = useState(false);

  // Only check auth once on initial load or when login parameters change
  useEffect(() => {
    // Skip auth check for public routes
    if (publicRoutes.includes(pathname)) {
      userStore.setState({ loading: false });
      setAuthChecked(true);
      return;
    }

    const checkAuth = async () => {
      // Prevent multiple auth checks
      if (authChecked && !loginSuccess) return;

      console.log("Checking auth in AuthProvider");
      console.log("All cookies:", document.cookie);

      const hasToken = document.cookie.includes("token=");
      const hasAuthStatus = document.cookie.includes("auth_status=");

      // Special handling for Google OAuth callback
      if (loginSuccess === "true" && (hasToken || hasAuthStatus)) {
        console.log("Google login detected, fetching user data");
        try {
          await getCurrentUser();
          setAuthChecked(true);
          return;
        } catch (error) {
          console.error("Error fetching user after Google login:", error);
        }
      }

      if (!hasToken && !hasAuthStatus) {
        console.log("No auth tokens found");
        userStore.setState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
        setAuthChecked(true);
        return;
      }

      try {
        await getCurrentUser();
      } catch (error) {
        console.error("Auth check failed:", error);
        // Clear invalid tokens
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "auth_status=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        userStore.setState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, [pathname, loginSuccess, getCurrentUser, authChecked]);

  // Show minimal loading indicator while checking auth
  if (loading && !authChecked) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return children;
}
