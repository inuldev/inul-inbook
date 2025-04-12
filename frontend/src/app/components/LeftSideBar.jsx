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
  const { user, logout } = userStore();
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
      await logout();
      console.log("Logout successful");

      // Gunakan window.location.href untuk memastikan halaman di-refresh sepenuhnya
      // dan menghindari middleware redirect loop
      window.location.href = "/user-login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Manually clear the cookies if the server request fails
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "auth_status=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log("Manually cleared token cookies");
      // Force logout even if it fails using window.location for full page refresh
      window.location.href = "/user-login";
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
