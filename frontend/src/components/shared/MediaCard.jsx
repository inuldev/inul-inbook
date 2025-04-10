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
  // Edit, // Will be used in the future
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import {
  togglePostLike,
  addPostComment,
  sharePost,
  generateSharedLink,
} from "@/lib/postInteractionHelpers";

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
import config from "@/lib/config";

const MediaCard = ({
  post,
  isVideoFeed = false,
  customHandlers = null,
  initialLiked = false,
}) => {
  const { user } = userStore();
  const { deletePost } = usePostStore();
  const [showComments, setShowComments] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  // We'll implement edit functionality in the future
  // const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post?.commentCount || 0);
  const [shareCount, setShareCount] = useState(post?.shareCount || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentInputRef = useRef(null);

  // Fetch fresh post data when component mounts
  useEffect(() => {
    if (post?._id && user?._id) {
      // Using an IIFE to avoid dependency issues
      (async () => {
        try {
          // Fetch the latest post data
          const response = await fetch(
            `${config.backendUrl}/api/posts/${post._id}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();

          if (data.success) {
            const freshPost = data.data;

            // Check if the current user has liked this post
            let userLiked = false;

            if (Array.isArray(freshPost.likes)) {
              userLiked = freshPost.likes.some((like) => {
                if (typeof like === "string") {
                  return like === user._id;
                } else if (like && typeof like === "object") {
                  return like._id === user._id;
                }
                return false;
              });
            }

            // Update local state
            setLikeCount(freshPost.likeCount || 0);
            setCommentCount(freshPost.commentCount || 0);
            setShareCount(freshPost.shareCount || 0);
            setIsLiked(userLiked);

            // Update the post in the store
            const postStore = usePostStore.getState();
            postStore.updatePostInStore({
              ...freshPost,
              isLiked: userLiked,
            });
          }
        } catch (error) {
          console.error("Error fetching post data:", error);
        }
      })();
    }
  }, [post?._id, user?._id]);

  useEffect(() => {
    if (!post) return;

    // Update counts from post data with safe defaults
    setLikeCount(post.likeCount || 0);
    setCommentCount(post.commentCount || 0);
    setShareCount(post.shareCount || 0);

    // If no user is logged in, we can't determine like state
    if (!user || !user._id) {
      setIsLiked(false);
      return;
    }

    // Handle like state
    if (initialLiked !== undefined) {
      // If initialLiked prop is provided, use it (for custom implementations)
      setIsLiked(initialLiked);
    } else if (post.isLiked !== undefined) {
      // If the post has an isLiked property (from the store), use it
      setIsLiked(post.isLiked);
    } else if (Array.isArray(post.likes)) {
      // Check if the current user has liked this post
      const userLiked = post.likes.some((like) => {
        if (typeof like === "string") {
          return like === user._id;
        } else if (like && typeof like === "object") {
          return like._id === user._id;
        }
        return false;
      });

      // Set the like state
      setIsLiked(userLiked);

      // Update the post in the store with the correct like status
      const postStore = usePostStore.getState();
      postStore.updatePostInStore({
        ...post,
        isLiked: userLiked,
      });
    } else {
      // Default to not liked if no likes array exists
      setIsLiked(false);
    }
  }, [
    // Dependencies
    post,
    user,
    initialLiked,
    // These specific properties trigger updates when they change
    post?._id,
    post?.likes,
    post?.isLiked,
    post?.likeCount,
    post?.commentCount,
    post?.shareCount,
    user?._id,
  ]);

  const handleLikeToggle = async () => {
    // If custom handler is provided, use it
    if (customHandlers?.handleLikeToggle) {
      customHandlers.handleLikeToggle();
      setIsLiked(!isLiked);
      setLikeCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
      return;
    }

    // Use the standardized helper function
    await togglePostLike(post, isLiked, setIsLiked, setLikeCount, user);
  };

  const handleDeletePost = async () => {
    try {
      setIsDeleting(true);
      await deletePost(post._id);
      showSuccessToast("Post deleted");
    } catch (error) {
      console.error("Error deleting post:", error);
      showErrorToast("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async () => {
    // Check if already submitting or comment is empty
    if (isSubmitting || !commentText.trim()) return;

    // Store for potential error recovery
    const tempCommentText = commentText.trim();

    // If custom handler is provided, use it
    if (customHandlers?.handleAddComment) {
      try {
        setIsSubmitting(true);
        setCommentText(""); // Clear input immediately for better UX

        await customHandlers.handleAddComment(tempCommentText);

        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
        showSuccessToast("Comment added");
      } catch (error) {
        console.error("Error adding comment:", error);
        showErrorToast("Failed to add comment");
        setCommentText(tempCommentText); // Restore on error
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Use the standardized helper function
    await addPostComment(
      post._id,
      commentText,
      setCommentText,
      (newComment) => {
        // Update comments in the post
        const postStore = usePostStore.getState();
        const updatedPost = {
          ...post,
          comments: post.comments
            ? [newComment, ...post.comments]
            : [newComment],
          commentCount: (post.commentCount || 0) + 1,
        };
        postStore.updatePostInStore(updatedPost);

        // Show comments if they're not already visible
        if (!showComments) {
          setShowComments(true);
        }

        // Focus back on the input for easy commenting
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      },
      setCommentCount,
      user,
      setIsSubmitting
    );
  };

  // Toggle comments visibility with data fetching
  const toggleComments = async () => {
    // If we're about to show comments, always fetch the latest data
    if (!showComments) {
      try {
        // Show loading state
        setIsSubmitting(true);

        const response = await fetch(
          `${config.backendUrl}/api/posts/${post._id}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            timeout: config.apiTimeouts.medium,
          }
        );

        const data = await response.json();

        if (data.success) {
          // Update the post in the store with the latest data including comments
          const postStore = usePostStore.getState();
          const processedPost = postStore.processPost(data.data, user);
          postStore.updatePostInStore(processedPost);

          // Update local state with the latest counts
          if (processedPost.comments) {
            setCommentCount(
              processedPost.comments.length || processedPost.commentCount || 0
            );
          }
          if (processedPost.likes) {
            setLikeCount(
              processedPost.likes.length || processedPost.likeCount || 0
            );

            // Update like status
            const userLiked = processedPost.likes.some((like) =>
              typeof like === "string"
                ? like === user._id
                : like._id === user._id
            );
            setIsLiked(userLiked);
          }
        }
      } catch (error) {
        console.error("Error fetching post comments:", error);
        showErrorToast("Failed to load comments");
      } finally {
        setIsSubmitting(false);
      }
    }

    setShowComments(!showComments);
  };

  const handleShare = async (platform) => {
    // If custom handler is provided, use it
    if (customHandlers?.handleShare) {
      customHandlers.handleShare(platform);
      showSuccessToast(`Post shared on ${platform}`);
      return;
    }

    // Use the standardized helper function
    await sharePost(
      post._id,
      platform,
      setShareCount,
      user,
      setIsShareDialogOpen
    );
  };

  // Helper function to format dates consistently
  // Used directly in the JSX below
  // const formatDate = (dateString) => {
  //   if (!dateString) return "";
  //   try {
  //     return format(new Date(dateString), "MMM d, yyyy");
  //   } catch (error) {
  //     return dateString;
  //   }
  // };

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
                  {/* Edit functionality will be implemented in the future */}
                  {/* <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setIsEditFormOpen(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit Post
                  </DropdownMenuItem> */}
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
            <span
              className={`text-sm hover:underline cursor-pointer ${
                isLiked
                  ? "text-blue-600 dark:text-blue-500 font-semibold"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {likeCount} {likeCount === 1 ? "like" : "likes"}
            </span>
            <div className="flex gap-3">
              <span
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
                onClick={toggleComments}
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
                isLiked ? "text-blue-600 dark:text-blue-500 font-semibold" : ""
              } dark:hover:bg-gray-600`}
              onClick={handleLikeToggle}
            >
              {isLiked ? (
                <>
                  <ThumbsUp className="mr-2 h-4 w-4 fill-blue-600 dark:fill-blue-500" />{" "}
                  Liked
                </>
              ) : (
                <>
                  <ThumbsUp className="mr-2 h-4 w-4" /> Like
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="flex-1 dark:hover:bg-gray-600"
              onClick={toggleComments}
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
                      const url = encodeURIComponent(
                        generateSharedLink(post._id)
                      );
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
                      const url = encodeURIComponent(
                        generateSharedLink(post._id)
                      );
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
                      const url = encodeURIComponent(
                        generateSharedLink(post._id)
                      );
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
                      navigator.clipboard.writeText(
                        generateSharedLink(post._id)
                      );
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
                    <MediaComments
                      comments={post?.comments}
                      postId={post?._id}
                    />
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
