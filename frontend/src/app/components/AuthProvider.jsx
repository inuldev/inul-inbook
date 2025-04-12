"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/ui/loader";
import userStore from "@/store/userStore";
import SearchParamsProvider from "./SearchParamsProvider";
import PathnameProvider from "./PathnameProvider";
import {
  isAuthenticated,
  getToken,
  getUserData,
  initAuthFromStorage,
  clearAuthData,
} from "@/lib/authUtils";

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

    async function checkAuth() {
      // We'll use a ref to track if this effect has already run
      // This prevents the auth check from running multiple times without causing re-renders
      if (authChecked && !loginSuccess) {
        console.log("Auth already checked, skipping");
        return;
      }

      console.log("Checking auth in AuthProvider");
      console.log("Checking for auth in ALL possible storage locations");

      // Periksa autentikasi menggunakan utility functions
      const authenticated = isAuthenticated();
      const token = getToken();
      const userData = getUserData();

      console.log("Auth check in AuthProvider using utility functions:", {
        authenticated,
        hasToken: !!token,
        hasUserData: !!userData,
      });

      if (authenticated) {
        console.log("User is authenticated using utility functions");
        userStore.setState({
          isAuthenticated: true,
          user: userData,
          loading: false,
        });
        setAuthChecked(true);
        return;
      }

      // Jika tidak terautentikasi dengan utility functions, coba metode lain
      console.log("Not authenticated with utility functions, trying other methods");

      // Coba inisialisasi dari storage (localStorage, sessionStorage, cookies)
      const storageAuthResult = initAuthFromStorage();
      console.log("Storage auth result:", storageAuthResult);

      if (storageAuthResult === true) {
        console.log("Authenticated from storage");
        setAuthChecked(true);
        return;
      }

      // Jika hanya token yang ditemukan
      if (storageAuthResult === "token-only") {
        console.log("Token found but no user data");

        // Coba ambil token dari storage
        const token = getToken();
        if (token) {
          console.log("Token found in storage:", token.substring(0, 10) + "...");

          // Coba ambil user data dari storage
          const userData = getUserData();
          if (userData) {
            try {
              // Verifikasi user data
              console.log("User data found in storage:", {
                id: userData._id,
                email: userData.email,
              });

              // Set state
              userStore.setState({
                isAuthenticated: true,
                user: userData,
                token,
                loading: false,
              });

              console.log("Authentication successful from storage");
              setAuthChecked(true);
              return;
            } catch (userDataError) {
              console.error("Error parsing user data from storage:", userDataError);

              // Jika gagal parse user data, coba ambil dari API
              console.log("Error with stored user data, trying to fetch from API");
              try {
                await getCurrentUser();
                console.log(
                  "Successfully fetched user data from API after storage error"
                );
                setAuthChecked(true);
                return;
              } catch (apiError) {
                console.error(
                  "Error fetching user data from API after storage error:",
                  apiError
                );
              }
            }
          } else {
            // Jika tidak ada user data di storage tapi ada token, coba ambil dari API
            console.log(
              "Token found but no user data, trying to fetch from API"
            );
            try {
              await getCurrentUser();
              console.log("Successfully fetched user data from API");
              setAuthChecked(true);
              return;
            } catch (apiError) {
              console.error("Error fetching user data from API:", apiError);
            }
          }
        }
      }

      // Coba metode legacy (localStorage langsung)
      console.log("Trying legacy auth method (direct localStorage)");
      const localStorageAuthResult = initAuthFromStorage();

      if (localStorageAuthResult === true) {
        console.log("Authenticated from legacy local storage method");
        setAuthChecked(true);
        return;
      }

      // Jika hanya token yang ditemukan tanpa user data
      if (localStorageAuthResult === "token-only") {
        console.log(
          "Token found from legacy method, trying to fetch user data"
        );
        try {
          await getCurrentUser();
          console.log(
            "Successfully fetched user data from API using legacy token"
          );

          // Verifikasi bahwa user data berhasil disimpan
          const storeState = userStore.getState();
          console.log("Store state after fetching user data:", {
            isAuthenticated: storeState.isAuthenticated,
            hasUser: !!storeState.user,
            userId: storeState.user?._id,
          });

          if (storeState.isAuthenticated && storeState.user) {
            console.log("Authentication successful from legacy token");
            setAuthChecked(true);
            return;
          } else {
            console.warn("User data fetched but not properly stored in state");
          }
        } catch (error) {
          console.error("Error fetching user data with legacy token:", error);
        }
      }

      // Jika sampai di sini, berarti tidak ada autentikasi yang valid
      console.log("No valid authentication found, clearing any partial auth data");

      // Reset state
      userStore.setState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      });

      try {
        await getCurrentUser();
      } catch (error) {
        console.error("Auth check failed:", error);
        // Hapus token yang tidak valid dari semua penyimpanan
        console.log("Clearing invalid tokens from all storage");

        // 1. Hapus dari cookies
        try {
          // Import deleteCookie secara dinamis untuk menghindari masalah SSR
          const { deleteCookie } = await import("@/lib/cookieUtils");

          // Hapus token cookie dengan pengaturan yang sesuai untuk cross-domain
          deleteCookie("token", {
            path: "/",
            secure: window.location.protocol === "https:",
            sameSite: window.location.hostname !== "localhost" ? "none" : "lax",
          });

          // Hapus auth_status cookie
          deleteCookie("auth_status", {
            path: "/",
            secure: window.location.protocol === "https:",
            sameSite: "lax",
          });

          console.log("Cookies dihapus menggunakan fungsi deleteCookie");
        } catch (cookieError) {
          console.error("Error deleting cookies:", cookieError);
        }

        // 2. Hapus dari localStorage dan sessionStorage
        try {
          clearAuthData();
          console.log("Auth data cleared from all storage");
        } catch (clearError) {
          console.error("Error clearing auth data:", clearError);
        }

        // 3. Reset state
        userStore.setState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
        });
      }

      setAuthChecked(true);
    }

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

// Main export component that wraps with SearchParamsProvider
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
