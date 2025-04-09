"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import userStore from "@/store/userStore";

const MediaComments = ({ comments }) => {
  const { user } = userStore();
  const [showAllComments, setShowAllComments] = useState(false);
  
  const visibleComments = showAllComments ? comments : comments?.slice(0, 3);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <>
      {visibleComments?.map((comment) => (
        <div key={comment?._id} className="flex items-start space-x-2 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment?.user?.profilePicture} />
            <AvatarFallback className="dark:bg-gray-400">
              {comment?.user?.username?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-grow">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
              <p className="font-bold text-sm">
                {comment?.user?.username || "User"}
              </p>
              <p className="text-sm">{comment?.text}</p>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Button variant="ghost" size="sm" className="h-6 px-2">
                Like
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                Reply
              </Button>
              {user?._id === comment?.user?._id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-red-500"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              )}
              <span className="ml-2">{formatDate(comment?.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}

      {comments?.length > 3 && (
        <div className="text-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllComments(!showAllComments)}
            className="text-blue-500"
          >
            {showAllComments ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" /> Show More Comments (
                {comments.length - 3})
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
};

export default MediaComments;
