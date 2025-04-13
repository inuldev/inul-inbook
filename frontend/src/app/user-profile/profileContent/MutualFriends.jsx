import { motion } from "framer-motion";
import React, { useEffect } from "react";
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

const MutualFriends = ({ id, isOwner }) => {
  const router = useRouter();
  const { fetchMutualFriends, mutualFriends, UnfollowUser } = userFriendStore();
  const [currentPage, setCurrentPage] = useState(1);
  const friendsPerPage = 6; // Menampilkan 6 teman per halaman (3 baris x 2 kolom)
  useEffect(() => {
    if (id) {
      fetchMutualFriends(id);
    }
  }, [id, fetchMutualFriends]);

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

      // Refresh the mutual friends list
      await fetchMutualFriends(id);

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
        await userFriendStore.getState().FollowUser(userId);
      } catch (storeError) {
        // If store method fails, try direct service call
        console.warn(
          "Store follow failed, trying direct service call",
          storeError
        );
        await followUser(userId);
      }

      showSuccessToast("Berhasil mengikuti pengguna");

      // Refresh the mutual friends list
      await fetchMutualFriends(id);

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

  // Pagination logic
  const indexOfLastFriend = currentPage * friendsPerPage;
  const indexOfFirstFriend = indexOfLastFriend - friendsPerPage;
  const currentFriends = mutualFriends.slice(
    indexOfFirstFriend,
    indexOfLastFriend
  );
  const totalPages = Math.ceil(mutualFriends.length / friendsPerPage);

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
              Teman Bersama ({mutualFriends.length})
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
          {mutualFriends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {isOwner
                  ? "Anda tidak memiliki teman bersama dengan pengguna ini."
                  : "Tidak ada teman bersama dengan pengguna ini."}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4 text-gray-300" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleUnfollow(friend._id)}
                        >
                          <UserX className="h-4 w-4 mr-2" /> Berhenti Mengikuti
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default MutualFriends;
