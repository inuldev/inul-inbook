"use client";

import React, { useState, useRef } from "react";
// import { format } from "date-fns";
import { formatDate } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  ThumbsUp,
  Reply,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import userStore from "@/store/userStore";
import {
  toggleCommentLike,
  deleteComment,
  replyToComment,
} from "@/lib/commentInteractionHelpers";

const MediaComments = ({ comments, postId }) => {
  const { user } = userStore();
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentLikes, setCommentLikes] = useState({});
  const [commentLikeCounts, setCommentLikeCounts] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const replyInputRef = useRef(null);

  const visibleComments = showAllComments ? comments : comments?.slice(0, 3);

  // Initialize like states for comments
  React.useEffect(() => {
    if (comments && comments.length > 0 && user?._id) {
      const initialLikes = {};
      const initialLikeCounts = {};

      comments.forEach((comment) => {
        // Check if user has liked this comment
        const isLiked =
          comment.likes &&
          Array.isArray(comment.likes) &&
          comment.likes.some((like) => {
            if (typeof like === "string") {
              return like === user._id;
            } else if (like && typeof like === "object") {
              return like._id === user._id;
            }
            return false;
          });

        initialLikes[comment._id] = isLiked;
        initialLikeCounts[comment._id] = comment.likeCount || 0;
      });

      setCommentLikes(initialLikes);
      setCommentLikeCounts(initialLikeCounts);
    }
  }, [comments, user?._id]);

  const formatCommentDate = (dateString) => {
    if (!dateString) return "";
    try {
      return formatDate(dateString);
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
        <div key={comment?._id} className="flex flex-col space-y-2 mb-4">
          {/* Main Comment */}
          <div className="flex items-start space-x-2">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 ${
                    commentLikes[comment?._id] ? "text-blue-500" : ""
                  }`}
                  onClick={() =>
                    toggleCommentLike(
                      comment._id,
                      commentLikes[comment._id] || false,
                      (newState) =>
                        setCommentLikes((prev) => ({
                          ...prev,
                          [comment._id]: newState,
                        })),
                      (updater) =>
                        setCommentLikeCounts((prev) => ({
                          ...prev,
                          [comment._id]: updater(prev[comment._id] || 0),
                        })),
                      user
                    )
                  }
                >
                  <ThumbsUp
                    className={`h-3 w-3 mr-1 ${
                      commentLikes[comment?._id] ? "fill-blue-500" : ""
                    }`}
                  />
                  {commentLikeCounts[comment?._id] || 0}{" "}
                  {commentLikes[comment?._id] ? "Liked" : "Like"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => setReplyingTo(comment._id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                {user?._id === comment?.user?._id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-red-500"
                    onClick={() => deleteComment(comment._id, postId, user)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
                <span className="ml-2">
                  {formatCommentDate(comment?.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Replies Section */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-10">
              {/* Toggle Replies Button */}
              {comment.replies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs mb-1 h-6 px-2"
                  onClick={() =>
                    setExpandedReplies((prev) => ({
                      ...prev,
                      [comment._id]: !prev[comment._id],
                    }))
                  }
                >
                  {expandedReplies[comment._id] ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Hide {comment.replies.length}{" "}
                      {comment.replies.length === 1 ? "reply" : "replies"}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      View {comment.replies.length}{" "}
                      {comment.replies.length === 1 ? "reply" : "replies"}
                    </>
                  )}
                </Button>
              )}

              {/* Replies List */}
              {expandedReplies[comment._id] &&
                comment.replies.map((reply) => (
                  <div
                    key={reply._id}
                    className="flex items-start space-x-2 mb-2 mt-1"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={reply?.user?.profilePicture} />
                      <AvatarFallback className="dark:bg-gray-400 text-xs">
                        {reply?.user?.username?.substring(0, 2).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-grow">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                        <p className="font-bold text-xs">
                          {reply?.user?.username || "User"}
                        </p>
                        <p className="text-xs">{reply?.text}</p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span className="text-xs text-gray-400">
                          {formatCommentDate(reply?.createdAt)}
                        </span>
                        {user?._id === reply?.user?._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 ml-2 text-red-500"
                            onClick={() =>
                              deleteComment(reply._id, postId, user)
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
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

      {/* Reply Dialog */}
      <Dialog
        open={!!replyingTo}
        onOpenChange={(open) => {
          if (!open) setReplyingTo(null);
          setReplyText("");
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reply to Comment</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profilePicture} />
                <AvatarFallback className="dark:bg-gray-400">
                  {user?.username?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="relative flex-grow">
                <Input
                  ref={replyInputRef}
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={isSubmitting}
                  className="pr-10 dark:border-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddReply();
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
                  onClick={handleAddReply}
                  disabled={!replyText.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-5 w-5 text-blue-500" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  function handleAddReply() {
    if (!replyText.trim() || isSubmitting || !replyingTo) return;

    setIsSubmitting(true);
    const tempReplyText = replyText.trim();
    setReplyText("");

    replyToComment(
      replyingTo,
      postId,
      tempReplyText,
      (newReply) => {
        // Close the dialog
        setReplyingTo(null);

        // Automatically expand replies for this comment
        setExpandedReplies((prev) => ({
          ...prev,
          [replyingTo]: true,
        }));

        // Log the reply for debugging
        console.log("New reply added:", newReply);
      },
      user
    ).finally(() => {
      setIsSubmitting(false);
    });
  }
};

export default MediaComments;
