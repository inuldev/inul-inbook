"use client";

/**
 * VideoComments Component
 *
 * A component for displaying comments on video posts.
 */

import React, { useState } from "react";
// import { format } from "date-fns";
import { formatDate } from "@/lib/utils";
import { MoreHorizontal, ThumbsUp, Reply, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import userStore from "@/store/userStore";
import {
  toggleCommentLike,
  deleteComment,
  replyToComment,
} from "@/lib/commentInteractionHelpers";

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
                  ? formatTanggalWaktu(comment.createdAt)
                  : "Waktu tidak diketahui"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default VideoComments;
