"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import userStore from "@/store/userStore";
import { storeAuthError } from "@/lib/authDebug";
import { debugLog, logAuthState } from "@/lib/debugUtils";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const processAuth = async () => {
      try {
        debugLog("auth", "=== Auth Callback Started ===");
        logAuthState();

        const token = searchParams.get("token");
        const success = searchParams.get("success");

        // Log all parameters
        const allParams = {};
        searchParams.forEach((value, key) => {
          allParams[key] = value;
        });
        debugLog("auth", "Auth callback parameters", allParams);

        if (success !== "true" || !token) {
          const errorMessage =
            searchParams.get("error") || "Authentication failed";
          throw new Error(errorMessage);
        }

        // Use existing userStore functions
        const userData = {
          _id: searchParams.get("userId"),
          username: searchParams.get("username"),
          email: searchParams.get("email"),
          profilePicture: searchParams.get("profilePicture"),
        };

        // Set token in userStore state
        userStore.setState({ tokenFromUrl: token });

        // Try to authenticate using getCurrentUser
        await userStore.getState().getCurrentUser();

        // If successful, store in localStorage for cross-domain auth
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(userData));

        debugLog("auth", "Authentication successful", {
          userData,
          token: token ? token.substring(0, 10) + "..." : null,
          localStorage: {
            hasToken: !!localStorage.getItem("auth_token"),
            hasUser: !!localStorage.getItem("auth_user"),
          },
        });

        logAuthState();

        if (isSubscribed) {
          setProcessing(false);
          // Add a small delay to ensure logs are captured
          setTimeout(() => {
            debugLog("auth", "Redirecting to home page");
            router.push("/?loginSuccess=true");
          }, 500);
        }
      } catch (err) {
        debugLog("auth", "Auth callback error", {
          error: err.message,
          stack: err.stack,
        });

        // Use existing auth debug utility
        storeAuthError("Auth callback failed", {
          error: err.message,
          params: {
            success: searchParams.get("success"),
            hasToken: !!searchParams.get("token"),
            userId: searchParams.get("userId"),
            email: searchParams.get("email"),
          },
        });

        // Log the current state
        logAuthState();

        if (isSubscribed) {
          setProcessing(false);
          setError(err.message);

          // Add a small delay to ensure logs are captured
          setTimeout(() => {
            debugLog("auth", "Redirecting to login page after error");
            router.push("/user-login");
          }, 3000);
        }
      }
    };

    processAuth();

    return () => {
      isSubscribed = false;
    };
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">
          {processing
            ? "Processing Authentication"
            : error
            ? "Authentication Failed"
            : "Authentication Successful"}
        </h1>

        {processing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
            {/* <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div> */}
            <p>Completing your login, please wait...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
            <p>{error}</p>
            <p className="mt-2 text-sm">Redirecting to login page...</p>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg mb-4">
            <p>Login successful!</p>
            <p className="mt-2 text-sm">Redirecting to home page...</p>
          </div>
        )}
      </div>
    </div>
  );
}
