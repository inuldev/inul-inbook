"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Home,
  Video,
  Users,
  Menu,
  Bell,
  MessageCircle,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

import userStore from "@/store/userStore";
import { showInfoToast } from "@/lib/toastUtils";
import useSidebarStore from "@/store/sidebarStore";
import useFriendNotificationStore from "@/store/friendNotificationStore";
import { searchUsers } from "@/service/user.service";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const router = useRouter();
  // Gunakan selector untuk mendapatkan data user terbaru
  const user = userStore((state) => state.user);
  const logout = userStore((state) => state.logout);
  const { toggleSidebar } = useSidebarStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const { theme, setTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { pendingRequestsCount, fetchPendingRequestsCount } =
    useFriendNotificationStore();

  useEffect(() => {
    fetchPendingRequestsCount();

    // Refresh user data to ensure we have the latest profile picture
    userStore
      .getState()
      .getCurrentUser()
      .catch((err) => {
        console.error("Error refreshing user data:", err);
      });

    // Set up an interval to refresh user data periodically
    const refreshInterval = setInterval(() => {
      userStore
        .getState()
        .getCurrentUser()
        .catch((err) => {
          console.error("Error refreshing user data:", err);
        });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [fetchPendingRequestsCount]);

  // Handle search input change
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      setIsSearching(true);
      setIsSearchOpen(true);

      try {
        const results = await searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setIsSearchOpen(false);
      setSearchResults([]);
    }
  };

  // Handle clicking on a search result
  const handleSearchResultClick = (userId) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    router.push(`/user-profile/${userId}`);
  };

  // Close search results when clicking outside
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavigation = (path, item) => {
    router.push(path);
    setActiveTab(item);
  };

  const handleLogout = async () => {
    console.log("Logout button clicked in Header");
    setIsLoggingOut(true);
    try {
      // Panggil fungsi logout dari userStore
      await logout();
      console.log("Logout successful");

      // Gunakan window.location.href untuk memastikan halaman di-refresh sepenuhnya
      // dan menghindari middleware redirect loop
      window.location.href = "/user-login";
    } catch (error) {
      console.error("Logout failed:", error);

      // Jika logout gagal, coba hapus cookie secara manual dengan berbagai metode
      try {
        // Hapus semua cookie autentikasi yang mungkin ada
        const cookiesToClear = [
          "token",
          "auth_status",
          "dev_token",
          "dev_auth_status",
          "auth_token_direct",
          "auth_token",
          "refresh_token",
        ];

        // Hapus dengan berbagai kombinasi pengaturan
        cookiesToClear.forEach((cookieName) => {
          // Metode 1: Hapus dengan path=/ (standar)
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

          // Metode 2: Hapus dengan Secure dan SameSite=None untuk produksi
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None`;

          // Metode 3: Hapus dengan SameSite=Lax untuk development
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        });

        console.log("Manually cleared all auth cookies");
      } catch (clearError) {
        console.error("Error clearing cookies manually:", clearError);
      }

      // Force logout even if it fails using window.location for full page refresh
      window.location.href = "/user-login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white dark:bg-[rgb(36,37,38)] text-foreground shadow-md h-16 fixed top-0 left-0 right-0 z-50 p-2">
      <div className="mx-auto flex justify-between items-center p-2">
        <div className="flex items-center gap-2 md:gap-4">
          <Image
            src="/images/logo.png"
            width={50}
            height={50}
            alt="logo"
            onClick={() => handleNavigation("/")}
            className="cursor-pointer"
          />
          <div className="relative" ref={searchRef}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-8 w-40 md:w-64 h-10 bg-gray-100 dark:bg-[rgb(58,59,60)] rounded-full"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              {isSearchOpen && (
                <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg mt-1 z-50 max-h-[300px] overflow-y-auto">
                  <div className="p-2">
                    {isSearching ? (
                      <div className="flex justify-center items-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((result) => (
                        <div
                          key={result._id}
                          className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                          onClick={() => handleSearchResultClick(result._id)}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={result.profilePicture || ""} />
                              <AvatarFallback className="dark:bg-gray-600">
                                {result.username?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {result.username}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : searchQuery.trim().length >= 2 ? (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                        No users found
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
        <nav className="hidden md:flex justify-around w-[40%] max-w-md">
          {[
            { icon: Home, path: "/", name: "home" },
            { icon: Video, path: "/video-feed", name: "video" },
            {
              icon: Users,
              path: "/friends-list",
              name: "friends",
              notification: pendingRequestsCount > 0,
            },
          ].map(({ icon: Icon, path, name, notification }) => (
            <Button
              key={name}
              variant="ghost"
              size="icon"
              className={`relative text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-transparent ${
                activeTab === name ? "text-blue-600 dark:text-blue-400" : " "
              }`}
              onClick={() => handleNavigation(path, name)}
            >
              <div className="relative">
                <Icon />
                {notification && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-center">
                    {pendingRequestsCount}
                  </span>
                )}
              </div>
            </Button>
          ))}
        </nav>

        <div className="flex space-x-2 md:space-x-4 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-600 cursor-pointer"
            onClick={toggleSidebar}
          >
            <Menu />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:block text-gray-600 cursor-pointer pl-1"
            onClick={() =>
              showInfoToast(
                "Notifications feature is currently under development"
              )
            }
          >
            <Bell />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:block text-gray-600 cursor-pointer pl-1"
            onClick={() =>
              showInfoToast("Messages feature is currently under development")
            }
          >
            <MessageCircle />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={user?.profilePicture || ""} />
                  <AvatarFallback className="dark:bg-gray-400">
                    {user?.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 z-50" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={user?.profilePicture || ""} />
                      <AvatarFallback className="dark:bg-gray-400">
                        {user?.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="">
                      <p className="text-sm font-medium leading-none">
                        {user?.username || "User"}
                      </p>
                      <p className="text-xs mt-2 text-gray-600 dark:text-gray-400 leading-none">
                        {user?.email || ""}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => handleNavigation(`/user-profile/${user?._id}`)}
              >
                <Users />
                <span className="ml-2">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() =>
                  showInfoToast(
                    "Messages feature is currently under development"
                  )
                }
              >
                <MessageCircle />
                <span className="ml-2">Messages</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="cursor-pointer"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="mr-2" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="mr-2" />
                    <span>Light Mode</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut />
                <span className="ml-2">
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
