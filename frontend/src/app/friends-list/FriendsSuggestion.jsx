import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { sendFriendRequest } from "@/service/friends.service";

const FriendsSuggestion = ({ friend, onRequestSent }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = async () => {
    try {
      setIsLoading(true);
      await sendFriendRequest(friend._id);
      toast.success("Friend request sent!");
      if (onRequestSent) onRequestSent();
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error(error.message || "Failed to send friend request");
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
          <AvatarImage src={friend?.profilePicture} />
          <AvatarFallback>{friend?.username?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold text-center mb-4">
          {friend?.username || "User"}
        </h3>

        <div className="flex flex-col justify-between">
          <Button
            className="bg-blue-500"
            size="lg"
            onClick={handleSendRequest}
            disabled={isLoading}
          >
            <UserPlus className="mr-2 h-4 w-4" /> Add Friend
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FriendsSuggestion;
