"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { ImageIcon, Video, Laugh, Plus, X, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import usePostStore from "@/store/postStore";
import userStore from "@/store/userStore";
import CloudinaryUploader from "../components/CloudinaryUploader";
import config from "@/lib/config";

const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const EditPostForm = ({ isOpen, onClose, post }) => {
  const { user } = userStore();
  const { updatePost, loading } = usePostStore();

  const [postContent, setPostContent] = useState(post?.content || "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [privacy, setPrivacy] = useState(post?.privacy || "public");
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [mediaData, setMediaData] = useState(
    post?.mediaUrl
      ? {
          url: post.mediaUrl,
          type: post.mediaType,
        }
      : null
  );
  const [postError, setPostError] = useState(null);

  const handleEmojiClick = (emojiObject) => {
    setPostContent((prev) => prev + emojiObject.emoji);
  };

  const handleMediaUploadComplete = (data) => {
    setMediaData(data);
    setShowMediaUploader(false);
  };

  const handleMediaUploadError = (errorMessage) => {
    setPostError(errorMessage);
  };

  const handleUpdatePost = async () => {
    if (!postContent.trim()) {
      setPostError("Please enter some content for your post");
      return;
    }

    try {
      setPostError(null);

      // Check if media has changed or if we're using the original media
      const isMediaChanged = mediaData && mediaData.url !== post?.mediaUrl;

      // If media has changed or we're adding new media, use the direct upload endpoint
      if (isMediaChanged || (mediaData && !post?.mediaUrl)) {
        await fetch(`${config.backendUrl}/api/posts/${post._id}/direct`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: postContent,
            privacy,
            mediaUrl: mediaData.url,
            mediaType: mediaData.type,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (!data.success) {
              throw new Error(data.message || "Failed to update post");
            }

            // Update post in store
            usePostStore.getState().updatePostInStore(data.data);
          });
      } else {
        // Regular update without media changes
        await updatePost(post._id, {
          content: postContent,
          privacy,
        });
      }

      // Close form
      onClose();
    } catch (error) {
      setPostError(error.message);
    }
  };

  const handleRemoveMedia = () => {
    setMediaData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Edit Post</DialogTitle>
          <DialogDescription className="sr-only"></DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profilePicture} />
              <AvatarFallback className="dark:bg-gray-400">
                {user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.username || "User"}</p>
              <Select value={privacy} onValueChange={setPrivacy}>
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder="Privacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Textarea
          placeholder={`What's on your mind, ${user?.username || "there"}?`}
          className="min-h-[120px] resize-none"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
        />

        {postError && (
          <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md flex items-center space-x-2 mt-2">
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-300" />
            <p className="text-sm text-red-500 dark:text-red-300">
              {postError}
            </p>
          </div>
        )}

        {mediaData && (
          <div className="mt-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full z-10"
              onClick={handleRemoveMedia}
            >
              <X className="h-4 w-4 text-white" />
            </Button>
            {mediaData.type === "image" ? (
              <img
                src={mediaData.url}
                alt="Post image"
                className="w-full h-auto rounded-md max-h-[300px] object-contain"
              />
            ) : (
              <video
                src={mediaData.url}
                controls
                className="w-full h-auto rounded-md max-h-[300px] object-contain"
              />
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 border border-gray-200 dark:border-gray-700 rounded-md p-2">
          <p className="text-sm font-medium">Add to your post</p>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => {
                setShowMediaUploader(true);
                setShowEmojiPicker(false);
              }}
            >
              <ImageIcon className="h-5 w-5 text-green-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowMediaUploader(false);
              }}
            >
              <Laugh className="h-5 w-5 text-yellow-500" />
            </Button>
          </div>
        </div>

        {showMediaUploader && !mediaData && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Upload Media</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMediaUploader(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Upload a photo (max 10MB) or video (max 100MB) for your post
            </p>
            <CloudinaryUploader
              onUploadComplete={handleMediaUploadComplete}
              onUploadError={handleMediaUploadError}
              uploadType="post"
            />
          </div>
        )}

        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setShowEmojiPicker(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Picker onEmojiClick={handleEmojiClick} />
          </motion.div>
        )}
        <div className="flex justify-end mt-4">
          <Button variant="outline" className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleUpdatePost}
            disabled={loading || !postContent.trim()}
          >
            {loading ? "Updating..." : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostForm;
