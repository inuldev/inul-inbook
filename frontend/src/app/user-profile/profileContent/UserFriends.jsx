import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, UserX, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { userFriendStore } from "@/store/userFriendsStore";
import userStore from "@/store/userStore";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import { followUser, unfollowUser } from "@/service/user.service";

const UserFriends = ({ id, isOwner }) => {
  const router = useRouter();
  const { user } = userStore();
  const { fetchFollowing, following, loading, UnfollowUser, FollowUser } =
    userFriendStore();

  const [isCurrentUserFollowing, setIsCurrentUserFollowing] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const friendsPerPage = 6; // Menampilkan 6 teman per halaman (3 baris x 2 kolom)

  useEffect(() => {
    if (id) {
      fetchFollowing(id);
    }
  }, [id, fetchFollowing]);

  // Check if the current user is following each friend
  useEffect(() => {
    if (user && following.length > 0) {
      const followingMap = {};
      following.forEach((friend) => {
        // Check if the current user is following this friend
        // First check if user.following is an array of IDs
        if (Array.isArray(user.following)) {
          followingMap[friend._id] = user.following.includes(friend._id);
        }
        // Then check if it's an array of objects with _id property
        else if (
          Array.isArray(user.following) &&
          user.following.some((f) => typeof f === "object")
        ) {
          followingMap[friend._id] = user.following.some(
            (f) => f._id === friend._id
          );
        }
        // Default to false if we can't determine
        else {
          followingMap[friend._id] = false;
        }
      });
      setIsCurrentUserFollowing(followingMap);
    }
  }, [user, following]);

  const handleUnfollow = async (userId) => {
    try {
      // First try using the store method
      try {
        await UnfollowUser(userId);
      } catch (storeError) {
        // If store method fails, try direct service call
        console.warn(
          "Store unfollow failed, trying direct service call",
          storeError
        );
        await unfollowUser(userId);
      }

      showSuccessToast("Berhasil berhenti mengikuti");

      // Update local state immediately for better UX
      setIsCurrentUserFollowing((prev) => ({
        ...prev,
        [userId]: false,
      }));

      // Refresh the friends list
      await fetchFollowing(id);

      // Also refresh current user data to update following list
      const { getCurrentUser } = userStore.getState();
      await getCurrentUser();
    } catch (error) {
      console.error("Error unfollowing user:", error);
      showErrorToast("Gagal berhenti mengikuti pengguna");
    }
  };

  const handleFollow = async (userId) => {
    try {
      // First try using the store method
      try {
        await FollowUser(userId);
      } catch (storeError) {
        // If store method fails, try direct service call
        console.warn(
          "Store follow failed, trying direct service call",
          storeError
        );
        await followUser(userId);
      }

      showSuccessToast("Berhasil mengikuti pengguna");

      // Update local state immediately for better UX
      setIsCurrentUserFollowing((prev) => ({
        ...prev,
        [userId]: true,
      }));

      // Refresh the friends list
      await fetchFollowing(id);

      // Also refresh current user data to update following list
      const { getCurrentUser } = userStore.getState();
      await getCurrentUser();
    } catch (error) {
      console.error("Error following user:", error);
      showErrorToast("Gagal mengikuti pengguna");
    }
  };

  const handleUserClick = (userId) => {
    try {
      router.push(`/user-profile/${userId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      showErrorToast("Failed to navigate to user profile");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-300">
            Teman
          </h2>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Memuat daftar teman...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pagination logic
  const indexOfLastFriend = currentPage * friendsPerPage;
  const indexOfFirstFriend = indexOfLastFriend - friendsPerPage;
  const currentFriends = following.slice(indexOfFirstFriend, indexOfLastFriend);
  const totalPages = Math.ceil(following.length / friendsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-4"
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold dark:text-gray-300">
              Teman ({following.length})
            </h2>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/friends-list")}
              >
                Lihat Saran Teman
              </Button>
            )}
          </div>

          {following.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {isOwner
                  ? "Anda belum memiliki teman. Kunjungi Saran Teman untuk menemukan orang yang dapat Anda ikuti."
                  : "Pengguna ini belum memiliki teman."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg flex items-start justify-between"
                  >
                    <div
                      className="flex items-center space-x-4 cursor-pointer"
                      onClick={() => handleUserClick(friend._id)}
                    >
                      <Avatar>
                        {friend.profilePicture ? (
                          <AvatarImage
                            src={friend.profilePicture || ""}
                            alt={friend.username}
                          />
                        ) : (
                          <AvatarFallback className="dark:bg-gray-400">
                            {friend.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-semibold dark:text-gray-100">
                          {friend.username}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span>{friend?.followerCount || 0} pengikut</span>
                          <span>•</span>
                          <span>{friend?.followingCount || 0} mengikuti</span>
                        </div>
                      </div>
                    </div>

                    {/* Only show action buttons if the user is not viewing their own profile */}
                    {user && user._id !== friend._id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4 text-gray-300" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isCurrentUserFollowing[friend._id] ? (
                            <DropdownMenuItem
                              onClick={() => handleUnfollow(friend._id)}
                            >
                              <UserX className="h-4 w-4 mr-2" /> Berhenti
                              Mengikuti
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleFollow(friend._id)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" /> Ikuti
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            handlePageChange(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserFriends;
