"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, MessageCircle, Share2, ThumbsUp, Send } from "lucide-react";
import usePostStore from "@/store/postStore";
import userStore from "@/store/userStore";
import { format } from "date-fns";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "@/lib/toastUtils";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import VideoComments from "./VideoComments";

const VideoCard = ({ post }) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post?.commentCount || 0);
  const [shareCount, setShareCount] = useState(post?.shareCount || 0);
  const { user } = userStore();
  const commentInputRef = useRef(null);

  // Check if the current user has liked this post
  useEffect(() => {
    if (post?.likes && user?._id) {
      setIsLiked(post.likes.includes(user._id));
    }

    // Update counts from post data
    setLikeCount(post?.likeCount || 0);
    setCommentCount(post?.commentCount || 0);
    setShareCount(post?.shareCount || 0);
  }, [post, user]);

  const generateSharedLink = () => {
    return `${
      process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin
    }/posts/${post?._id}`;
  };

  const handleLikeToggle = async () => {
    try {
      const postStore = usePostStore.getState();

      if (isLiked) {
        await postStore.unlikePost(post._id);
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        showInfoToast("Post unliked");
      } else {
        await postStore.likePost(post._id);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        showSuccessToast("Post liked");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      showErrorToast("Failed to update like status");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const postStore = usePostStore.getState();
      const newComment = await postStore.addComment(post._id, commentText);

      // Update the local post object with the new comment
      if (!post.comments) {
        post.comments = [];
      }

      post.comments = [newComment, ...post.comments];
      setCommentCount((prev) => prev + 1);

      // Clear the input
      setCommentText("");

      // Focus back on the input for easy commenting
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
      showSuccessToast("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      showErrorToast("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = (platform) => {
    showSuccessToast(`Post shared on ${platform}`);
  };

  return (
    <motion.div
      key={post?._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-[rgb(36,37,38)] rounded-lg shadow-lg overflow-hidden mb-4"
    >
      <div>
        <div className="flex items-center justify-between mb-4 px-4 mt-2">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 rounded-full mr-3">
              <AvatarImage src={post?.user?.profilePicture} />
              <AvatarFallback className="dark:bg-gray-400">
                {post?.user?.username?.substring(0, 2).toUpperCase() || "ID"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold dark:text-white">
                {post?.user?.username || "Unknown User"}
              </p>
            </div>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">
              {post?.createdAt
                ? format(new Date(post.createdAt), "MMM dd, yyyy")
                : "Unknown date"}
            </span>
          </div>
        </div>
        {post?.content && (
          <div className="px-4 mb-4">
            <p className="text-gray-800 dark:text-gray-200">{post?.content}</p>
          </div>
        )}

        <div className="relative bg-black mb-4 rounded-lg overflow-hidden">
          {post?.mediaUrl && (
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
          )}
        </div>

        <div className="md:flex justify-between px-2 mb-2 items-center">
          <div className="flex space-x-4">
            <Button
              variant="ghost"
              className={`flex dark:hover:bg-gray-600 items-center ${
                isLiked ? "text-blue-500 dark:text-blue-400" : ""
              }`}
              onClick={handleLikeToggle}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              <span>{isLiked ? "Liked" : "Like"}</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex dark:hover:bg-gray-600 items-center`}
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              <span>Comment</span>
            </Button>

            <Dialog
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center dark:hover:bg-gray-500"
                  onClick={() => {
                    // Increment share count when dialog is opened
                    if (!isShareDialogOpen) {
                      setShareCount((prev) => prev + 1);
                    }
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Share</span>
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
                    }}
                  >
                    Share on Facebook
                  </Button>
                  <Button
                    onClick={() => {
                      const url = encodeURIComponent(generateSharedLink());
                      const tweetText = encodeURIComponent(
                        post?.content || "Check out this video!"
                      );
                      window.open(
                        `https://twitter.com/intent/tweet?text=${tweetText}&url=${url}`,
                        "_blank"
                      );
                      handleShare("twitter");
                    }}
                  >
                    Share on Twitter
                  </Button>
                  <Button
                    onClick={() => {
                      const url = encodeURIComponent(generateSharedLink());
                      // LinkedIn only needs the URL for sharing
                      window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
                        "_blank"
                      );
                      handleShare("linkedin");
                    }}
                  >
                    Share on Linkedin
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(generateSharedLink());
                      showSuccessToast("Link copied to clipboard!");
                      handleShare("copy");
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex space-x-4 ml-2 text-sm text-gray-500 dark:text-gray-400">
            <Button variant="ghost" size="sm" onClick={handleLikeToggle}>
              {likeCount} {likeCount === 1 ? "like" : "likes"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShareDialogOpen(true)}
            >
              {shareCount} {shareCount === 1 ? "share" : "shares"}
            </Button>
          </div>
        </div>
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <VideoComments
                  key={post?.comments?._id}
                  comments={post?.comments}
                />
              </ScrollArea>
              <div className="flex items-center mt-4 p-2">
                <Avatar className="h-10 w-10 rounded mr-3">
                  <AvatarImage src={user?.profilePicture} />
                  <AvatarFallback className="dark:bg-gray-400">
                    {user?.username?.substring(0, 2).toUpperCase() || "ID"}
                  </AvatarFallback>
                </Avatar>
                <Input
                  ref={commentInputRef}
                  className="flex-1 mr-2 dark:border-gray-400"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default VideoCard;
