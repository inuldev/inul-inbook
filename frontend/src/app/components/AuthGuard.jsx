"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import userStore from "@/store/userStore";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const { isAuthenticated, loading } = userStore();

  useEffect(() => {
    // Simple redirect if not authenticated
    if (!loading && !isAuthenticated) {
      console.log("AuthGuard: Not authenticated, redirecting to login");
      router.push("/user-login", { replace: true });
    }
  }, [isAuthenticated, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authenticated, show the children
  return isAuthenticated ? children : null;
}
