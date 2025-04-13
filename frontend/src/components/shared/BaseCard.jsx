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
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import {
  Clock,
  MessageCircle,
  Share2,
  ThumbsUp,
  MoreHorizontal,
  Trash2,
  Edit,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import useCommentStore from "@/store/commentStore";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import EnhancedCommentSystem from "./EnhancedCommentSystem";
import {
  togglePostLike,
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
 * @removed props.commentsComponent - Custom comments component (replaced with EnhancedCommentSystem)
 * @param {Function} props.onDelete - Callback when post is deleted
 * @param {Function} props.onEdit - Callback when post is edited
 * @returns {React.ReactElement}
 */

const BaseCard = ({
  post,
  isVideoFeed = false,
  customHandlers = null,
  initialLiked = undefined,

  onDelete = null,
  onEdit = null,
}) => {
  // Get user from store
  const userState = userStore();
  const { user } = userState;

  // Get comment store
  const commentStore = useCommentStore();
  const { activeCommentPostId, showComments: showCommentsGlobal } =
    commentStore;
  const isActiveCommentPost = activeCommentPostId === post?._id;

  // Get post store for post operations
  usePostStore();

  // Local state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post?.commentCount || 0);
  const [shareCount, setShareCount] = useState(post?.shareCount || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // If comments are not loaded yet, fetch them
    if (!post.comments || post.comments.length === 0) {
      try {
        setIsSubmitting(true);

        // Fetch post with comments
        const postStore = usePostStore.getState();
        const processedPost = await postStore.fetchPost(post._id);

        // Update comment count
        if (processedPost.comments) {
          const newCommentCount =
            processedPost.comments.length || processedPost.commentCount || 0;
          setCommentCount(newCommentCount);
        }
      } catch (error) {
        console.error("Error fetching post comments:", error);
        showErrorToast("Failed to load comments");
      } finally {
        setIsSubmitting(false);
      }
    }

    // Toggle comments using the global store
    commentStore.toggleComments(post._id);
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

    try {
      // Use the standardized helper function
      await sharePost(post._id, platform, setShareCount, setIsShareDialogOpen);

      // Show appropriate success message based on platform
      if (platform === "copy") {
        showSuccessToast("Link copied to clipboard!");
      } else {
        showSuccessToast(`Post shared on ${platform}`);
      }
    } catch (error) {
      console.error(`Error sharing post on ${platform}:`, error);
      showErrorToast(`Failed to share post on ${platform}`);
    }
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

    // Call the callback to open edit form

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
                    onClick={() => {
                      // Generate post URL
                      const postUrl = generateSharedLink(post._id);
                      // Open Facebook share dialog
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                          postUrl
                        )}`,
                        "_blank",
                        "width=600,height=400"
                      );
                      // Update share count in backend
                      handleShare("facebook");
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Share on Facebook
                  </Button>
                  <Button
                    onClick={() => {
                      // Generate post URL
                      const postUrl = generateSharedLink(post._id);
                      const text = post.text
                        ? post.text.substring(0, 100)
                        : "Check out this post";
                      // Open Twitter share dialog
                      window.open(
                        `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                          postUrl
                        )}&text=${encodeURIComponent(text)}`,
                        "_blank",
                        "width=600,height=400"
                      );
                      // Update share count in backend
                      handleShare("twitter");
                    }}
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    Share on Twitter
                  </Button>
                  <Button
                    onClick={() => {
                      // Generate post URL
                      const postUrl = generateSharedLink(post._id);
                      // Open LinkedIn share dialog
                      window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                          postUrl
                        )}`,
                        "_blank",
                        "width=600,height=400"
                      );
                      // Update share count in backend
                      handleShare("linkedin");
                    }}
                    className="bg-blue-800 hover:bg-blue-900"
                  >
                    Share on LinkedIn
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        // Copy link to clipboard
                        await navigator.clipboard.writeText(
                          generateSharedLink(post._id)
                        );

                        // Call handleShare to update share count in backend
                        await handleShare("copy");

                        // Close dialog
                        setIsShareDialogOpen(false);
                      } catch (error) {
                        console.error("Error copying link:", error);
                        showErrorToast("Failed to copy link");
                      }
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Comments section */}
          {showCommentsGlobal && isActiveCommentPost && user && (
            <EnhancedCommentSystem
              post={post}
              onCommentAdded={(newCount) => {
                setCommentCount(newCount);
              }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BaseCard;
