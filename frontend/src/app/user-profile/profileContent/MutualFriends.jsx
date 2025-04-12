import { motion } from "framer-motion";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { userFriendStore } from "@/store/userFriendsStore";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";

const MutualFriends = ({ id, isOwner }) => {
  const router = useRouter();
  const { fetchMutualFriends, mutualFriends, unfollowUser } = userFriendStore();
  useEffect(() => {
    if (id) {
      fetchMutualFriends(id);
    }
  }, [id, fetchMutualFriends]);

  const handleUnfollow = async (userId) => {
    await unfollowUser(userId);
    showSuccessToast("you have unfollow successfully");
  };

  const handleUserClick = (userId) => {
    try {
      router.push(`/user-profile/${userId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      showErrorToast("Failed to navigate to user profile");
    }
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
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-300">
            Mutual Friends
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mutualFriends.map((friend) => (
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
                      <span>{friend?.followerCount} followers</span>
                      <span>•</span>
                      <span>{friend?.followingCount} following</span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4 text-gray-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  {isOwner && (
                    <DropdownMenuContent
                      align="end"
                      onClick={async () => {
                        await handleUnfollow(friend._id);
                        await fetchMutualFriends(id);
                      }}
                    >
                      <DropdownMenuItem>
                        <UserX className="h-4 w-4 mr-2" /> Unfollow
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MutualFriends;
