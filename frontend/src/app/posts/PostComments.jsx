"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Send, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import usePostStore from "@/store/postStore";
import userStore from "@/store/userStore";

const PostComments = ({ post }) => {
  const { user } = userStore();
  const { addComment } = usePostStore();
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (post?.comments) {
      setComments(post.comments);
    }
  }, [post]);

  const visibleComments = showAllComments ? comments : comments?.slice(0, 2);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      const newComment = await addComment(post._id, commentText);
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">Comments</h3>

      <div className="flex items-center space-x-2 mb-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.profilePicture} />
          <AvatarFallback className="dark:bg-gray-400">
            {user?.username?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow relative">
          <Input
            placeholder="Write a comment..."
            className="rounded-full h-12 dark:bg-[rgb(58,59,60)] pr-12"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            disabled={isSubmitting}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
            onClick={handleAddComment}
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-5 w-5 text-blue-500" />
            )}
          </Button>
        </div>
      </div>

      {comments?.length > 0 ? (
        <div className="max-h-60 overflow-y-auto pr-2">
          {visibleComments?.map((comment) => (
            <div key={comment?._id} className="flex items-start space-x-2 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment?.user?.profilePicture} />
                <AvatarFallback className="dark:bg-gray-400">
                  {comment?.user?.username?.charAt(0) || "U"}
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

          {comments?.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-blue-500 dark:text-blue-400"
              onClick={() => setShowAllComments(!showAllComments)}
            >
              {showAllComments ? (
                <>
                  Show Less <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  Show All {comments.length} Comments{" "}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};

export default PostComments;
