import React, { useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  acceptFriendRequest,
  declineFriendRequest,
} from "@/service/friends.service";

const FriendRequest = ({ friend, onRequestProcessed }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      await acceptFriendRequest(friend._id);
      toast.success("Friend request accepted!");
      if (onRequestProcessed) onRequestProcessed();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error(error.message || "Failed to accept friend request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsLoading(true);
      await declineFriendRequest(friend._id);
      toast.success("Friend request declined");
      if (onRequestProcessed) onRequestProcessed();
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error(error.message || "Failed to decline friend request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white mb-4 dark:bg-gray-800 p-4 shadow rounded-lg"
      >
        <Avatar className="h-32 w-32 rounded mx-auto mb-4">
          <AvatarImage src={friend?.sender?.profilePicture} />
          <AvatarFallback>
            {friend?.sender?.username?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold text-center mb-4">
          {friend?.sender?.username || "User"}
        </h3>

        <div className="flex flex-col justify-between">
          <Button
            className="bg-blue-500"
            size="lg"
            onClick={handleAccept}
            disabled={isLoading}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Confirm
          </Button>
          <Button
            className="mt-2"
            size="lg"
            onClick={handleDecline}
            disabled={isLoading}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FriendRequest;
