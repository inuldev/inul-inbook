"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import {
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Trash2,
  Edit,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { showErrorToast, showSuccessToast } from "@/lib/toastUtils";
import {
  togglePostLike,
  sharePost,
  generateSharedLink,
} from "@/lib/postInteractionHelpers";
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

import PostComments from "./PostComments";
import EditPostForm from "./EditPostForm";
import usePostStore from "@/store/postStore";
import userStore from "@/store/userStore";

const PostCard = ({ post }) => {
  const { user } = userStore();
  const { deletePost } = usePostStore();
  const [showComments, setShowComments] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post?.commentCount || 0);
  const [shareCount, setShareCount] = useState(post?.shareCount || 0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Check if the current user has liked this post
    if (post?.likes && user?._id) {
      setIsLiked(post.likes.includes(user._id));
    }

    // Update counts from post data
    setLikeCount(post?.likeCount || 0);
    setCommentCount(post?.commentCount || 0);
    setShareCount(post?.shareCount || 0);
  }, [post, user]);

  const handleLikeToggle = async () => {
    // Use the standardized helper function
    await togglePostLike(post, isLiked, setIsLiked, setLikeCount, user);
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

  const handleShare = async (platform) => {
    // Use the standardized helper function
    await sharePost(
      post._id,
      platform,
      setShareCount,
      user,
      setIsShareDialogOpen
    );
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
      <Card>
        <CardContent className="p-6 dark:text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 cursor-pointer">
              <Avatar>
                <AvatarImage src={post?.user?.profilePicture} />
                <AvatarFallback className="dark:bg-gray-400">
                  {post?.user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold dark:text-white">
                  {post?.user?.username || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(post?.createdAt)}
                </p>
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

          <p className="mb-4">{post?.content}</p>

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
                <PostComments post={post} />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Edit Post Form */}
      {isEditFormOpen && (
        <EditPostForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          post={post}
        />
      )}
    </motion.div>
  );
};

export default PostCard;
