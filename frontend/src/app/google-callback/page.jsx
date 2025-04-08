"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import userStore from "@/store/userStore";
import Loader from "@/lib/Loader";
import { hasCookie } from "@/lib/cookieUtils";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { logAuthDebugInfo, storeAuthError } from "@/lib/authDebug";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const { getCurrentUser } = userStore();

  // Get the Google auth hook
  const { handleGoogleCallback } = useGoogleAuth();

  useEffect(() => {
    console.log("Google callback page loaded");

    // Log detailed debug information
    logAuthDebugInfo("google-callback", {
      searchParams: Object.fromEntries(searchParams.entries()),
      timestamp: new Date().toISOString(),
    });

    // Handle the Google OAuth callback
    const processCallback = async () => {
      const success = await handleGoogleCallback(
        searchParams,
        getCurrentUser,
        // Success callback
        () => {
          console.log("Google authentication successful, redirecting to home");
          router.push("/");
        },
        // Error callback
        (errorMessage) => {
          console.error("Google authentication failed:", errorMessage);
          setError(errorMessage);

          // Store the error for debugging
          storeAuthError(errorMessage, {
            source: "google-callback",
            searchParams: Object.fromEntries(searchParams.entries()),
            cookies: document.cookie.split("; ").reduce((obj, cookie) => {
              const [name, value] = cookie.split("=");
              if (name) obj[name] = value;
              return obj;
            }, {}),
          });

          // Try to get the redirect URL from session storage
          const redirectUrl =
            sessionStorage.getItem("loginRedirectUrl") || "/user-login";
          console.log("Will redirect to:", redirectUrl);

          setTimeout(() => {
            router.push(redirectUrl);
          }, 3000);
        }
      );

      if (!success) {
        console.log("Google authentication was not successful");
      }
    };

    processCallback();
  }, [searchParams, getCurrentUser, router, handleGoogleCallback]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Google Login</h1>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
            {error}
            <p className="mt-2 text-sm">Redirecting to login page...</p>
          </div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Completing your login, please wait...</p>
          </>
        )}
      </div>
    </div>
  );
}
