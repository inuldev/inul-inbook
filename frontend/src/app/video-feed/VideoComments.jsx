import React from "react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const VideoComments = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <>
      {comments?.map((comment) => (
        <div key={comment?._id} className="flex items-start space-x-2 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment?.user?.profilePicture} />
            <AvatarFallback className="dark:bg-gray-400">
              {comment?.user?.username?.substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
              <p className="font-semibold text-sm">
                {comment?.user?.username || "Unknown User"}
              </p>
              <p className="text-sm">{comment?.text}</p>
            </div>
            <div className="flex items-center mt-1 text-xs text-gray-400">
              <Button variant="ghost" size="sm">
                Like
              </Button>
              <Button variant="ghost" size="sm">
                Reply
              </Button>
              <span>
                {comment?.createdAt
                  ? new Date(comment.createdAt).toLocaleString()
                  : "Unknown time"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default VideoComments;
