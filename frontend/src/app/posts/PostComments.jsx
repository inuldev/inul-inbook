"use client";

/**
 * PostComments Component
 *
 * A component for displaying comments on posts.
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

/**
 * PostComments Component
 * @param {Object} props - Component props
 * @param {Object} props.post - Post data
 * @returns {React.ReactElement}
 */
const PostComments = ({ post }) => {
  const { user } = userStore();
  const comments = post?.comments || [];

  // If no comments, show a message
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  // Render comments
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment._id}
          comment={comment}
          postId={post._id}
          currentUser={user}
        />
      ))}
    </div>
  );
};

/**
 * CommentItem Component
 * @param {Object} props - Component props
 * @param {Object} props.comment - Comment data
 * @param {string} props.postId - Post ID
 * @param {Object} props.currentUser - Current user
 * @returns {React.ReactElement}
 */
const CommentItem = ({ comment, postId, currentUser }) => {
  const [isLiked, setIsLiked] = useState(
    comment.likes?.includes(currentUser?._id) || false
  );
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);

  // Check if the current user is the owner of the comment
  const isOwner = currentUser?._id === comment?.user?._id;

  /**
   * Handle like button click
   */
  const handleLikeToggle = async () => {
    await toggleCommentLike(comment._id, isLiked, setIsLiked, setLikeCount);
  };

  /**
   * Handle reply button click
   */
  const handleReplyToggle = () => {
    setShowReplyInput(!showReplyInput);
    if (!showReplyInput) {
      setReplyText("");
    }
  };

  /**
   * Handle reply submission
   */
  const handleReplySubmit = async () => {
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await replyToComment(comment._id, postId, replyText, (newReply) => {
        setReplies((prev) => [newReply, ...prev]);
        setReplyText("");
        setShowReplyInput(false);
        setShowReplies(true);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle delete button click
   */
  const handleDelete = async () => {
    await deleteComment(comment._id, postId, () => {
      // This will be handled by the parent component
    });
  };

  /**
   * Toggle replies visibility
   */
  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  return (
    <div className="flex space-x-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment?.user?.profilePicture} />
        <AvatarFallback className="dark:bg-gray-400">
          {comment?.user?.username?.substring(0, 2).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm dark:text-white">
                {comment?.user?.username || "Unknown User"}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {comment?.text}
              </p>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-6 w-6 p-0 dark:text-gray-300"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="flex items-center mt-1 space-x-3 text-xs">
          <button
            onClick={handleLikeToggle}
            className={`flex items-center ${
              isLiked
                ? "text-blue-600 dark:text-blue-500 font-semibold"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <ThumbsUp className="h-3 w-3 mr-1" />
            {isLiked ? "Liked" : "Like"} ({likeCount})
          </button>
          <button
            onClick={handleReplyToggle}
            className="flex items-center text-gray-500 dark:text-gray-400"
          >
            <Reply className="h-3 w-3 mr-1" />
            Reply
          </button>
          <span className="text-gray-500 dark:text-gray-400">
            {comment?.createdAt
              ? formatDate(comment.createdAt)
              : "Tanggal tidak diketahui"}
          </span>
        </div>

        {/* Reply input */}
        {showReplyInput && (
          <div className="mt-2 flex">
            <Input
              className="flex-1 mr-2 text-sm dark:border-gray-400"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleReplySubmit();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleReplySubmit}
              disabled={!replyText.trim() || isSubmitting}
            >
              Reply
            </Button>
          </div>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-2">
            <button
              onClick={toggleReplies}
              className="text-sm text-blue-600 dark:text-blue-500"
            >
              {showReplies
                ? "Hide replies"
                : `Show ${replies.length} ${
                    replies.length === 1 ? "reply" : "replies"
                  }`}
            </button>
            {showReplies && (
              <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                {replies.map((reply) => (
                  <div key={reply._id} className="flex space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={reply?.user?.profilePicture} />
                      <AvatarFallback className="dark:bg-gray-400">
                        {reply?.user?.username?.substring(0, 2).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                        <p className="font-semibold text-xs dark:text-white">
                          {reply?.user?.username || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-200">
                          {reply?.text}
                        </p>
                      </div>
                      <div className="flex items-center mt-1 space-x-2 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {reply?.createdAt
                            ? formatDate(reply.createdAt)
                            : "Tanggal tidak diketahui"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostComments;
