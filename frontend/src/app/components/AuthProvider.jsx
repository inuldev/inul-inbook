"use client";

import { useEffect, useState } from "react";

import Loader from "@/lib/Loader";
import userStore from "@/store/userStore";
import SearchParamsProvider from "./SearchParamsProvider";
import PathnameProvider from "./PathnameProvider";
import { hasCookie } from "@/lib/cookieUtils";

const publicRoutes = ["/user-login", "/user-register", "/forgot-password"];

// Inner component that receives searchParams and pathname safely
function AuthProviderCore({ searchParams, pathname, children }) {
  const { getCurrentUser, loading } = userStore();
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
      // We'll use a ref to track if this effect has already run
      // This prevents the auth check from running multiple times without causing re-renders
      if (authChecked && !loginSuccess) {
        console.log("Auth already checked, skipping");
        return;
      }

      console.log("Checking auth in AuthProvider");
      console.log("Checking for auth cookies");

      const hasToken = hasCookie("token");
      const hasAuthStatus = hasCookie("auth_status");

      // Special handling for Google OAuth callback
      if (loginSuccess === "true") {
        console.log("Google login detected, checking auth status");
        console.log("Token cookie present:", hasToken);
        console.log("Auth status cookie present:", hasAuthStatus);
        console.log("All cookies:", document.cookie);

        // Check for token in URL - this is our primary method in production
        const tokenFromUrl = searchParams.get("token");
        if (tokenFromUrl) {
          console.log("Token found in URL, will use this for authentication");

          // Set cookies manually with different options for different environments
          const isSecure = window.location.protocol === "https:";
          const isProduction = window.location.hostname !== "localhost";

          // Set the token cookie directly
          document.cookie = `token=${encodeURIComponent(
            tokenFromUrl
          )}; path=/; max-age=${60 * 60 * 24 * 30}${
            isSecure ? "; Secure" : ""
          }; SameSite=${isProduction ? "None" : "Lax"}`;
          document.cookie = `auth_status=logged_in; path=/; max-age=${
            60 * 60 * 24 * 30
          }${isSecure ? "; Secure" : ""}; SameSite=Lax`;

          console.log("Cookies set directly from URL token");

          // Verify cookies were set
          const hasTokenNow = document.cookie.includes("token=");
          const hasAuthStatusNow = document.cookie.includes("auth_status=");
          console.log("Token cookie now present:", hasTokenNow);
          console.log("Auth status cookie now present:", hasAuthStatusNow);

          // Try to fetch user data with the token
          try {
            // Use the token directly in the Authorization header
            userStore.setState({ tokenFromUrl: tokenFromUrl });
            await getCurrentUser();
            setAuthChecked(true);

            // Remove token from URL without page reload
            const url = new URL(window.location.href);
            url.searchParams.delete("token");
            window.history.replaceState({}, document.title, url.toString());
            return;
          } catch (error) {
            console.error("Error fetching user with URL token:", error);
            userStore.setState({ tokenFromUrl: null });
          }
        }

        // If we have tokens in cookies, try to fetch user data
        if (hasToken || hasAuthStatus) {
          console.log("Auth tokens found in cookies, fetching user data");
          try {
            await getCurrentUser();
            setAuthChecked(true);
            return;
          } catch (error) {
            console.error("Error fetching user after Google login:", error);
          }
        } else {
          console.error("Google login success but no auth tokens found");

          // Try to set a fallback cookie and retry
          if (typeof document !== "undefined") {
            console.log("Setting fallback auth_status cookie");
            // Always set Secure for SameSite=None, and use Lax with Secure for HTTPS
            const isHttps = window.location.protocol === "https:";
            document.cookie = isHttps
              ? "auth_status=logged_in; path=/; max-age=2592000; SameSite=None; Secure"
              : "auth_status=logged_in; path=/; max-age=2592000; SameSite=Lax";

            // Check if cookie was set
            const cookieSet = document.cookie.includes("auth_status=");
            console.log("Fallback cookie set success:", cookieSet);

            if (cookieSet) {
              // Try to fetch user data again
              try {
                await getCurrentUser();
                setAuthChecked(true);
                return;
              } catch (secondError) {
                console.error(
                  "Error fetching user after setting fallback cookie:",
                  secondError
                );
              }
            }
          }

          // This is a special case where the redirect worked but cookies weren't set
          // We'll mark auth as checked but not authenticated
          userStore.setState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: "Google login failed: Authentication tokens not received",
          });
          setAuthChecked(true);
          return;
        }
      }

      // Check for authentication in local storage
      const localStorageAuthChecked = userStore
        .getState()
        .setAuthFromLocalStorage();
      if (localStorageAuthChecked) {
        console.log("Authenticated from local storage");
        setAuthChecked(true);
        return;
      }

      if (!hasToken && !hasAuthStatus) {
        console.log("No auth tokens found in cookies or local storage");
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
    // Remove authChecked and setAuthChecked from dependencies to prevent infinite loop
  }, [pathname, loginSuccess, getCurrentUser]);

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

// Component that receives searchParams and wraps with PathnameProvider
function AuthProviderInner({ searchParams, children }) {
  return (
    <PathnameProvider>
      {(pathname) => (
        <AuthProviderCore searchParams={searchParams} pathname={pathname}>
          {children}
        </AuthProviderCore>
      )}
    </PathnameProvider>
  );
}

// Main AuthProvider that wraps everything with SearchParamsProvider
export default function AuthProvider({ children }) {
  return (
    <SearchParamsProvider>
      {(searchParams) => (
        <AuthProviderInner searchParams={searchParams}>
          {children}
        </AuthProviderInner>
      )}
    </SearchParamsProvider>
  );
}
