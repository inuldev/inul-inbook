"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import userStore from "@/store/userStore";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback page loaded");
        
        // Get parameters from URL
        const provider = searchParams.get("provider");
        const success = searchParams.get("success");
        const token = searchParams.get("token");
        const userId = searchParams.get("userId");
        const username = searchParams.get("username");
        const email = searchParams.get("email");
        const profilePicture = searchParams.get("profilePicture");
        
        console.log("Auth provider:", provider);
        console.log("Auth success:", success);
        console.log("Token received:", token ? "Yes (hidden)" : "No");
        
        if (success === "true" && token) {
          // Store authentication data in local storage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify({
            _id: userId,
            username,
            email,
            profilePicture
          }));
          
          // Update the auth state in the store
          userStore.getState().setAuthFromLocalStorage();
          
          // Redirect to home page
          console.log("Authentication successful, redirecting to home");
          setTimeout(() => {
            router.push("/");
          }, 1000);
        } else {
          // Handle authentication failure
          const errorMsg = searchParams.get("error") || "Authentication failed";
          setError(errorMsg);
          console.error("Authentication failed:", errorMsg);
          
          // Redirect to login page after a delay
          setTimeout(() => {
            router.push("/user-login");
          }, 3000);
        }
      } catch (err) {
        console.error("Error processing auth callback:", err);
        setError("An unexpected error occurred");
        
        // Redirect to login page after a delay
        setTimeout(() => {
          router.push("/user-login");
        }, 3000);
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">
          {processing ? "Processing Authentication" : error ? "Authentication Failed" : "Authentication Successful"}
        </h1>

        {processing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Completing your login, please wait...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
            {error}
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
