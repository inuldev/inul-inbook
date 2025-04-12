"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import userStore from "@/store/userStore";

export default function UserProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = userStore();

  useEffect(() => {
    // If user is authenticated, redirect to their profile page
    if (isAuthenticated && user && !loading) {
      router.push(`/user-profile/${user._id}`);
    }
  }, [isAuthenticated, user, loading, router]);

  // Show loading spinner while checking authentication or redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}
