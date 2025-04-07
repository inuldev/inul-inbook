"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import userStore from "@/store/userStore";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const { isAuthenticated, loading } = userStore();
  const [isChecking, setIsChecking] = useState(true);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    if (isChecking) {
      const hasToken = document.cookie.includes("token=");

      if (!hasToken && !redirectAttempted) {
        console.log("AuthGuard: No token found, redirecting");
        setRedirectAttempted(true);
        router.push("/user-login", { replace: true });
        return;
      }

      setIsChecking(false);
    }
  }, [isChecking, redirectAttempted, router]);

  // Show loading spinner while checking authentication
  if (isChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authenticated, show the children
  return isAuthenticated ? children : null;
}
