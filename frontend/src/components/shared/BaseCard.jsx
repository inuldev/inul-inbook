"use client";

/**
 * BaseCard Component
 *
 * A base component for displaying content cards (posts, videos, stories)
 * with consistent styling and behavior.
 *
 * This component handles:
 * - User information display
 * - Content rendering
 * - Media rendering (images, videos)
 * - Interaction buttons (like, comment, share)
 * - Action menu (edit, delete)
 */

// import { format } from "date-fns";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { formatDate } from "@/lib/utils";
import userStore from "@/store/userStore";
import usePostStore from "@/store/postStore";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import {
  togglePostLike,
  addPostComment,
  sharePost,
  generateSharedLink,
} from "@/lib/postInteractionHelpers";

/**
 * BaseCard Component
 * @param {Object} props - Component props
 * @param {Object} props.post - Post data
 * @param {boolean} props.isVideoFeed - Whether this card is in video feed
 * @param {Object} props.customHandlers - Custom handlers for interactions
 * @param {boolean} props.initialLiked - Initial like state
 * @param {React.ReactNode} props.commentsComponent - Custom comments component
 * @param {Function} props.onDelete - Callback when post is deleted
 * @param {Function} props.onEdit - Callback when post is edited
 * @returns {React.ReactElement}
 */

const BaseCard = ({
  post,
  isVideoFeed = false,
  customHandlers = null,
  initialLiked = undefined,
  commentsComponent = null,
  onDelete = null,
  onEdit = null,
}) => {
  // Get user from store
  const { user } = userStore();
  const { deletePost } = usePostStore();

  // Local state
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

  // Refs
  const commentInputRef = useRef(null);

  // Check if the current user is the owner of the post
  const isOwner = user?._id === post?.user?._id;

  // Initialize post data
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
      console.log(`Post ${post._id} using isLiked property:`, post.isLiked);
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

      // Log for debugging
      console.log(`Post ${post._id} like state initialized from likes array:`, {
        userLiked,
        likes: post.likes,
      });
    } else {
      // Default to not liked if no likes array exists
      setIsLiked(false);
      console.log(`Post ${post._id} defaulting to not liked`);
    }
  }, [post, user, initialLiked]);

  /**
   * Handle like button click
   */
  const handleLikeToggle = async () => {
    try {
      // If custom handler is provided, use it
      if (customHandlers?.handleLikeToggle) {
        customHandlers.handleLikeToggle();
        return;
      }

      // Use the standardized helper function
      // Note: We don't do optimistic update here because the helper function already does it
      await togglePostLike(post._id, isLiked, setIsLiked, setLikeCount);
    } catch (error) {
      console.error("Error toggling like:", error);
      showErrorToast("Failed to update like status");
    }
  };

  /**
   * Handle comment button click
   */
  const toggleComments = async () => {
    // If custom handler is provided, use it
    if (customHandlers?.toggleComments) {
      customHandlers.toggleComments();
      return;
    }

    // If comments are already shown, just hide them
    if (showComments) {
      setShowComments(false);
      return;
    }

    // If comments are not loaded yet, fetch them
    if (!post.comments || post.comments.length === 0) {
      try {
        setIsSubmitting(true);

        // Fetch post with comments
        const postStore = usePostStore.getState();
        const processedPost = await postStore.fetchPost(post._id);

        // Update comment count
        if (processedPost.comments) {
          setCommentCount(
            processedPost.comments.length || processedPost.commentCount || 0
          );
        }
      } catch (error) {
        console.error("Error fetching post comments:", error);
        showErrorToast("Failed to load comments");
      } finally {
        setIsSubmitting(false);
      }
    }

    // Show comments
    setShowComments(true);
  };

  /**
   * Handle comment submission
   */
  const handleAddComment = async () => {
    // If custom handler is provided, use it
    if (customHandlers?.handleAddComment) {
      customHandlers.handleAddComment(commentText);
      setCommentText("");
      return;
    }

    // Use the standardized helper function
    await addPostComment(
      post._id,
      commentText,
      setCommentText,
      setCommentCount,
      setIsSubmitting,
      (newComment) => {
        // Make sure comments are visible after adding a comment
        setShowComments(true);
      }
    );
  };

  /**
   * Handle share button click
   */
  const handleShare = async (platform) => {
    // If custom handler is provided, use it
    if (customHandlers?.handleShare) {
      customHandlers.handleShare(platform);
      showSuccessToast(`Post shared on ${platform}`);
      return;
    }

    // Use the standardized helper function
    await sharePost(post._id, platform, setShareCount, setIsShareDialogOpen);
  };

  /**
   * Handle delete button click
   */
  const handleDelete = async () => {
    // If custom handler is provided, use it
    if (customHandlers?.handleDelete) {
      customHandlers.handleDelete();
      return;
    }

    try {
      setIsDeleting(true);

      // Delete the post
      const postStore = usePostStore.getState();
      await postStore.deletePost(post._id);

      // Call the callback if provided
      if (onDelete) {
        onDelete(post._id);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle edit button click
   */
  const handleEdit = () => {
    // If custom handler is provided, use it
    if (customHandlers?.handleEdit) {
      customHandlers.handleEdit();
      return;
    }

    // Open edit form
    setIsEditFormOpen(true);

    // Call the callback if provided
    if (onEdit) {
      onEdit(post);
    }
  };

  // Render the component
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
          {/* Header with user info and actions */}
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
                      ? formatDate(post.createdAt)
                      : "Tanggal tidak diketahui"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action menu (edit, delete) */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 dark:text-gray-300"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Post content */}
          {post?.content && (
            <p className="mb-4 text-gray-800 dark:text-gray-200">
              {post?.content}
            </p>
          )}

          {/* Post media (image or video) */}
          {post?.mediaUrl && (
            <div className="relative rounded-lg overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
              {post.mediaType === "image" ? (
                <div className="flex items-center justify-center relative w-full h-[500px]">
                  <Image
                    src={`${post?.mediaUrl}?_=${Date.now()}`}
                    alt="post_image"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain"
                    priority={false}
                    onError={(e) => {
                      console.error("Image loading error:", e);
                      // Fallback to original URL without cache busting
                      const imgElement = e.target;
                      if (imgElement.src !== post?.mediaUrl) {
                        imgElement.src = post?.mediaUrl;
                      }
                    }}
                  />
                </div>
              ) : (
                post.mediaType === "video" && (
                  <div className="flex items-center justify-center">
                    <video
                      controls
                      className="w-full object-contain max-h-[500px]"
                      preload="metadata"
                      src={`${post?.mediaUrl}?_=${Date.now()}`}
                      type="video/mp4"
                      onError={(e) => {
                        console.error("Video loading error:", e);
                        e.target.src = post?.mediaUrl; // Try without cache busting
                      }}
                    >
                      Your browser does not support the video tag
                    </video>
                  </div>
                )
              )}
            </div>
          )}

          {/* Post stats (likes, comments, shares) */}
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

          {/* Action buttons (like, comment, share) */}
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
            <Button
              variant="ghost"
              className="flex-1 dark:hover:bg-gray-600"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>

            {/* Share dialog */}
            <Dialog
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Post</DialogTitle>
                  <DialogDescription>
                    Choose a platform to share this post
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <Button
                    onClick={() => handleShare("facebook")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Share on Facebook
                  </Button>
                  <Button
                    onClick={() => handleShare("twitter")}
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    Share on Twitter
                  </Button>
                  <Button
                    onClick={() => handleShare("linkedin")}
                    className="bg-blue-800 hover:bg-blue-900"
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

          {/* Comments section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Comment input */}
                <div className="flex items-center mt-4 mb-4">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={user?.profilePicture} />
                    <AvatarFallback className="dark:bg-gray-400">
                      {user?.username?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex">
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
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || isSubmitting}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Comments list */}
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  {commentsComponent ? (
                    commentsComponent
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No comments yet. Be the first to comment!
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BaseCard;
