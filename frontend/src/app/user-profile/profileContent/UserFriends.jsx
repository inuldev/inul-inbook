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

import { userFriendStore } from "@/store/userFriendsStore";
import userStore from "@/store/userStore";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import { followUser } from "@/service/user.service";

const UserFriends = ({ id, isOwner }) => {
  const router = useRouter();
  const { user } = userStore();
  const { 
    fetchFollowing, 
    following, 
    loading, 
    UnfollowUser, 
    FollowUser 
  } = userFriendStore();
  
  const [isCurrentUserFollowing, setIsCurrentUserFollowing] = useState({});

  useEffect(() => {
    if (id) {
      fetchFollowing(id);
    }
  }, [id, fetchFollowing]);

  // Check if the current user is following each friend
  useEffect(() => {
    if (user && following.length > 0) {
      const followingMap = {};
      following.forEach(friend => {
        // Check if the current user is following this friend
        const isFollowing = user.following && user.following.includes(friend._id);
        followingMap[friend._id] = isFollowing;
      });
      setIsCurrentUserFollowing(followingMap);
    }
  }, [user, following]);

  const handleUnfollow = async (userId) => {
    try {
      await UnfollowUser(userId);
      showSuccessToast("You have unfollowed successfully");
      
      // Update local state
      setIsCurrentUserFollowing(prev => ({
        ...prev,
        [userId]: false
      }));
      
      // Refresh the friends list
      await fetchFollowing(id);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      showErrorToast("Failed to unfollow user");
    }
  };

  const handleFollow = async (userId) => {
    try {
      await FollowUser(userId);
      showSuccessToast("You are now following this user");
      
      // Update local state
      setIsCurrentUserFollowing(prev => ({
        ...prev,
        [userId]: true
      }));
      
      // Refresh the friends list
      await fetchFollowing(id);
    } catch (error) {
      console.error("Error following user:", error);
      showErrorToast("Failed to follow user");
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
            Friends
          </h2>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading friends...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              Friends ({following.length})
            </h2>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/friends-list")}
              >
                View Friend Suggestions
              </Button>
            )}
          </div>
          
          {following.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {isOwner 
                  ? "You don't have any friends yet. Go to Friend Suggestions to find people to follow." 
                  : "This user doesn't have any friends yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {following.map((friend) => (
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
                        <span>{friend?.followerCount || 0} followers</span>
                        <span>•</span>
                        <span>{friend?.followingCount || 0} following</span>
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
                          <DropdownMenuItem onClick={() => handleUnfollow(friend._id)}>
                            <UserX className="h-4 w-4 mr-2" /> Unfollow
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleFollow(friend._id)}>
                            <UserPlus className="h-4 w-4 mr-2" /> Follow
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserFriends;
