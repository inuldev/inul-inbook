"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Users,
  Video,
  User,
  MessageCircle,
  Bell,
  LogOut,
} from "lucide-react";

import userStore from "@/store/userStore";
import { showInfoToast } from "@/lib/toastUtils";
import useSidebarStore from "@/store/sidebarStore";
import useFriendNotificationStore from "@/store/friendNotificationStore";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const LeftSideBar = () => {
  const router = useRouter();
  // Gunakan selector untuk mendapatkan data user terbaru
  const user = userStore((state) => state.user);
  const logout = userStore((state) => state.logout);
  const { isSidebarOpen, toggleSidebar } = useSidebarStore();
  const { pendingRequestsCount, fetchPendingRequestsCount } =
    useFriendNotificationStore();

  useEffect(() => {
    // Fetch pending friend requests count when component mounts
    fetchPendingRequestsCount();

    // Set up an interval to periodically check for new friend requests
    const intervalId = setInterval(() => {
      fetchPendingRequestsCount();
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [fetchPendingRequestsCount]);

  const handleNavigation = (path) => {
    router.push(path);
    if (isSidebarOpen) {
      toggleSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Logout button clicked in LeftSideBar");

      // Import the deleteCookie function for direct access if needed
      const { deleteCookie } = await import("@/lib/cookieUtils");

      // Call the logout function from userStore
      const logoutSuccess = await logout();
      console.log("Logout result:", logoutSuccess ? "successful" : "failed");

      // Add a small delay to ensure cookies are processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if any auth cookies still remain
      const cookiesToCheck = [
        "token",
        "auth_status",
        "dev_token",
        "dev_auth_status",
        "auth_token_direct",
        "auth_token",
        "refresh_token",
      ];

      const remainingCookies = document.cookie.split("; ");
      const authCookiesRemaining = cookiesToCheck.filter((name) =>
        remainingCookies.some((c) => c.startsWith(`${name}=`))
      );

      // If any cookies remain, try to delete them directly
      if (authCookiesRemaining.length > 0) {
        console.warn(
          "⚠️ Some auth cookies still remain after logout:",
          authCookiesRemaining
        );

        // Try one more time with our improved deleteCookie function
        for (const cookieName of authCookiesRemaining) {
          await deleteCookie(cookieName, {
            secure: window.location.protocol === "https:",
            sameSite: "none",
            tryAllMethods: true,
          });
        }
      }

      // Use window.location.replace for a cleaner redirect without browser history
      window.location.replace("/user-login");
    } catch (error) {
      console.error("Logout failed:", error);

      try {
        // Import the deleteCookie function for direct access
        const { deleteCookie } = await import("@/lib/cookieUtils");
        const { clearAllAuthData } = await import("@/lib/authUtils");

        // Try to clear all auth data as a fallback
        await clearAllAuthData();

        // Also try to delete cookies directly with our improved function
        const cookiesToClear = [
          "token",
          "auth_status",
          "dev_token",
          "dev_auth_status",
          "auth_token_direct",
          "auth_token",
          "refresh_token",
        ];

        for (const cookieName of cookiesToClear) {
          await deleteCookie(cookieName, {
            secure: window.location.protocol === "https:",
            sameSite: "none",
            tryAllMethods: true,
          });
        }

        console.log("Manually cleared all auth data and cookies");
      } catch (clearError) {
        console.error("Error in manual cleanup:", clearError);
      }

      // Force logout even if it fails
      window.location.replace("/user-login");
    }
  };

  return (
    <aside
      className={`fixed top-16 left-0 h-full w-64 p-4 transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col z-50 md:z-0 ${
        isSidebarOpen
          ? "translate-x-0 bg-white dark:bg-[rgb(36,37,38)] shadow-lg"
          : "-translate-x-full"
      } ${isSidebarOpen ? "md:hidden" : ""} md:bg-transparent md:shadow-none`}
    >
      <div className="flex flex-col h-full overflow-y-auto mt-6">
        <nav className="space-y-4 flex-grow">
          <Button
            variant="ghost"
            className="full justify-start"
            onClick={() => handleNavigation("/")}
          >
            <Home className="mr-4" />
            Home Page
          </Button>
          <Button
            variant="ghost"
            className="full justify-start relative"
            onClick={() => handleNavigation("/friends-list")}
          >
            <Users className="mr-4" />
            Friends List
            {pendingRequestsCount > 0 && (
              <span className="absolute top-0 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className="full justify-start"
            onClick={() => handleNavigation("/video-feed")}
          >
            <Video className="mr-4" />
            Video Feed
          </Button>
          <Button
            variant="ghost"
            className="full justify-start"
            onClick={() => handleNavigation(`/user-profile/${user?._id}`)}
          >
            <User className="mr-4" />
            Profile
          </Button>
          <Button
            variant="ghost"
            className="full justify-start"
            onClick={() =>
              showInfoToast("Messages feature is currently under development")
            }
          >
            <MessageCircle className="mr-4" />
            Messages
          </Button>
          <Button
            variant="ghost"
            className="full justify-start"
            onClick={() =>
              showInfoToast(
                "Notifications feature is currently under development"
              )
            }
          >
            <Bell className="mr-4" />
            Notification
          </Button>
        </nav>

        {/* footer section */}
        <div className="mb-16 mt-4">
          <Separator className="my-4" />
          <div
            className="flex items-center space-x-2 mb-4 cursor-pointer"
            onClick={() => handleNavigation(`/user-profile/${user?._id}`)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profilePicture || ""} />
              <AvatarFallback className="dark:bg-gray-400">
                {user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">{user?.username || "User"}</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <Button
              variant="ghost"
              className="cursor-pointer -ml-4"
              onClick={handleLogout}
            >
              <LogOut />
              <span className="ml-2 font-bold text-md">Logout</span>
            </Button>
            <p>Privacy · Terms · Advertising</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSideBar;
