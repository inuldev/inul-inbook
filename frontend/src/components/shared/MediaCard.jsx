"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import {
  Clock,
  MessageCircle,
  Share2,
  ThumbsUp,
  Send,
  MoreHorizontal,
  Trash2,
  Edit,
} from "lucide-react";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "@/lib/toastUtils";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import usePostStore from "@/store/postStore";
import userStore from "@/store/userStore";
import MediaComments from "./MediaComments";

const MediaCard = ({
  post,
  isVideoFeed = false,
  customHandlers = null,
  initialLiked = false,
}) => {
  const { user } = userStore();
  const { likePost, unlikePost, deletePost, sharePost } = usePostStore();
  const [showComments, setShowComments] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post?.commentCount || 0);
  const [shareCount, setShareCount] = useState(post?.shareCount || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentInputRef = useRef(null);

  useEffect(() => {
    // If initialLiked is provided, use it; otherwise check post likes
    if (initialLiked !== undefined) {
      setIsLiked(initialLiked);
    } else if (post?.likes && user?._id) {
      setIsLiked(post.likes.includes(user._id));
    }

    // Update counts from post data
    setLikeCount(post?.likeCount || 0);
    setCommentCount(post?.commentCount || 0);
    setShareCount(post?.shareCount || 0);
  }, [
    post,
    user,
    initialLiked,
    post?.likeCount,
    post?.commentCount,
    post?.shareCount,
  ]);

  const handleLikeToggle = async () => {
    try {
      // If custom handler is provided, use it
      if (customHandlers?.handleLikeToggle) {
        customHandlers.handleLikeToggle();
        // Update UI state
        setIsLiked(!isLiked);
        setLikeCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
        return;
      }

      // Default behavior
      if (isLiked) {
        await unlikePost(post._id);
        setIsLiked(false);
        // Don't update likeCount here, it will be updated by the store
        showInfoToast("Post unliked");
      } else {
        await likePost(post._id);
        setIsLiked(true);
        // Don't update likeCount here, it will be updated by the store
        showSuccessToast("Post liked");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      showErrorToast("Failed to update like status");
    }
  };

  const handleDeletePost = async () => {
    try {
      setIsDeleting(true);
      await deletePost(post._id);
      showSuccessToast("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      showErrorToast("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // If custom handler is provided, use it
      if (customHandlers?.handleAddComment) {
        await customHandlers.handleAddComment(commentText);

        // Clear the input
        setCommentText("");

        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
        showSuccessToast("Comment added");
        return;
      }

      // Default behavior
      const postStore = usePostStore.getState();
      const newComment = await postStore.addComment(post._id, commentText);

      // Update the local post object with the new comment
      if (!post.comments) {
        post.comments = [];
      }

      post.comments = [newComment, ...post.comments];
      // Don't update the comment count here, it will be updated by the store

      // Clear the input
      setCommentText("");

      // Focus back on the input for easy commenting
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }

      showSuccessToast("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      showErrorToast("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSharedLink = () => {
    return `${
      process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin
    }/posts/${post?._id}`;
  };

  const handleShare = async (platform) => {
    try {
      // If custom handler is provided, use it
      if (customHandlers?.handleShare) {
        customHandlers.handleShare(platform);
        showSuccessToast(`Post shared on ${platform}`);
      } else {
        // Default behavior - call the sharePost function
        await sharePost(post._id);
        showSuccessToast(`Post shared on ${platform}`);
      }

      // Don't update the share count here, it will be updated by the store
    } catch (error) {
      console.error("Error sharing post:", error);
      showErrorToast("Failed to share post");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const isOwner = user?._id === post?.user?._id;

  return (
    <motion.div
      key={post?._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        className={
          isVideoFeed
            ? "bg-white dark:bg-[rgb(36,37,38)] rounded-lg shadow-lg overflow-hidden mb-4"
            : ""
        }
      >
        <CardContent className="p-6 dark:text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 cursor-pointer">
              <Avatar>
                <AvatarImage src={post?.user?.profilePicture} />
                <AvatarFallback className="dark:bg-gray-400">
                  {post?.user?.username?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold dark:text-white">
                  {post?.user?.username || "Unknown User"}
                </p>
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {post?.createdAt
                      ? format(new Date(post.createdAt), "MMM dd, yyyy")
                      : "Unknown date"}
                  </span>
                </div>
              </div>
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="dark:hover:bg-gray-500">
                    <MoreHorizontal className="dark:text-white h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setIsEditFormOpen(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-500 focus:text-red-500"
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete Post"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {post?.content && (
            <p className="mb-4 text-gray-800 dark:text-gray-200">
              {post?.content}
            </p>
          )}

          {post?.mediaUrl && (
            <div className="relative rounded-lg overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
              {post.mediaType === "image" ? (
                <div className="flex items-center justify-center">
                  <img
                    src={post?.mediaUrl}
                    alt="post_image"
                    className="w-full h-auto object-contain max-h-[500px]"
                    loading="lazy"
                  />
                </div>
              ) : (
                post.mediaType === "video" && (
                  <div className="flex items-center justify-center">
                    <video
                      controls
                      className="w-full object-contain max-h-[500px]"
                      preload="metadata"
                    >
                      <source src={post?.mediaUrl} type="video/mp4" />
                      Your browser does not support the video tag
                    </video>
                  </div>
                )
              )}
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 hover:underline cursor-pointer">
              {likeCount} {likeCount === 1 ? "like" : "likes"}
            </span>
            <div className="flex gap-3">
              <span
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
                onClick={() => setShowComments(!showComments)}
              >
                {commentCount} {commentCount === 1 ? "comment" : "comments"}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {shareCount} {shareCount === 1 ? "share" : "shares"}
              </span>
            </div>
          </div>

          <Separator className="mb-2 dark:bg-gray-400" />

          <div className="flex justify-between mb-2">
            <Button
              variant="ghost"
              className={`flex-1 ${
                isLiked ? "text-blue-500 dark:text-blue-400" : ""
              } dark:hover:bg-gray-600`}
              onClick={handleLikeToggle}
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> {isLiked ? "Liked" : "Like"}
            </Button>
            <Button
              variant="ghost"
              className="flex-1 dark:hover:bg-gray-600"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Comment
            </Button>

            <Dialog
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex-1 dark:hover:bg-gray-500"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share This Post</DialogTitle>
                  <DialogDescription>
                    Choose where you want to share this post
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-4">
                  <Button
                    onClick={() => {
                      const url = encodeURIComponent(generateSharedLink());
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                        "_blank"
                      );
                      handleShare("facebook");
                      setIsShareDialogOpen(false);
                    }}
                  >
                    Share on Facebook
                  </Button>
                  <Button
                    onClick={() => {
                      const url = encodeURIComponent(generateSharedLink());
                      const text = encodeURIComponent(
                        post?.content || "Check out this post!"
                      );
                      window.open(
                        `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
                        "_blank"
                      );
                      handleShare("twitter");
                      setIsShareDialogOpen(false);
                    }}
                  >
                    Share on Twitter
                  </Button>
                  <Button
                    onClick={() => {
                      const url = encodeURIComponent(generateSharedLink());
                      window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
                        "_blank"
                      );
                      handleShare("linkedin");
                      setIsShareDialogOpen(false);
                    }}
                  >
                    Share on LinkedIn
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(generateSharedLink());
                      showSuccessToast("Link copied to clipboard!");
                      handleShare("copy");
                      setIsShareDialogOpen(false);
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Separator className="mb-2 dark:bg-gray-400" />

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
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
                        ref={commentInputRef}
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={isSubmitting}
                        className="pr-10 dark:border-gray-400"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
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

                  <ScrollArea className="h-[300px] pr-4">
                    <MediaComments comments={post?.comments} />
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MediaCard;
