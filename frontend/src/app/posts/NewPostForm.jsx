import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { ImageIcon, Video, Laugh, X, AlertCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
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

const NewPostForm = ({ isPostFormOpen, setIsPostFormOpen }) => {
  const { user } = userStore();
  const { createPost, loading } = usePostStore();

  const [postContent, setPostContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [privacy, setPrivacy] = useState("public");
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [mediaData, setMediaData] = useState(null);
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

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      setPostError("Please enter some content for your post");
      return;
    }

    try {
      setPostError(null);

      if (mediaData) {
        // Create post with already uploaded media URL
        await fetch(`${config.backendUrl}/api/posts/direct`, {
          method: "POST",
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
              throw new Error(data.message || "Failed to create post");
            }

            // Update posts in store
            usePostStore.getState().addPost(data.data);
          });
      } else {
        // Create post without media
        await createPost({
          content: postContent,
          privacy,
        });
      }

      // Reset form
      setPostContent("");
      setMediaData(null);
      setShowMediaUploader(false);
      setIsPostFormOpen(false);
    } catch (error) {
      setPostError(error.message);
    }
  };

  const handleRemoveMedia = () => {
    setMediaData(null);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex space-x-4">
          <Avatar>
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback className="dark:bg-gray-400">
              {user?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
            <DialogTrigger asChild>
              <div className="w-full">
                <Input
                  placeholder={`What's on your mind, ${
                    user?.username || "there"
                  }?`}
                  readOnly
                  className="cursor-pointer rounded-full h-12 dark:bg-[rgb(58,59,60)] placeholder:text-gray-500 dark:placeholder:text-gray-400 w-full"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-center">Create Post</DialogTitle>
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
                  </div>
                </div>
                <Select value={privacy} onValueChange={setPrivacy}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Privacy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder={`What's on your mind, ${
                  user?.username || "there"
                }?`}
                className="min-h-[100px] text-md"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />

              {postError && (
                <div className="mt-2 text-red-500 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{postError}</span>
                </div>
              )}

              {/* {!showMediaUploader && !mediaData && (
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setShowMediaUploader(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Photos/Videos
                </Button>
              )} */}

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
                  <CloudinaryUploader
                    onUploadComplete={handleMediaUploadComplete}
                    onUploadError={handleMediaUploadError}
                    uploadType="post"
                  />
                </div>
              )}

              {mediaData && (
                <div className="mt-4 relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {mediaData.type === "image" ? (
                    <div className="relative w-full h-[300px]">
                      <Image
                        src={mediaData.url}
                        alt="Uploaded media"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <video
                      src={mediaData.url}
                      controls
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveMedia}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-4">
                <p className="font-semibold mb-2">Add to Your Post</p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setShowMediaUploader(true);
                      setMediaData(null);
                    }}
                  >
                    <ImageIcon className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setShowMediaUploader(true);
                      setMediaData(null);
                    }}
                  >
                    <Video className="h-4 w-4 text-red-500" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Laugh className="h-4 w-4 text-orange-500" />
                  </Button>
                </div>
              </div>

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
                <Button
                  className="bg-blue-500 text-white hover:bg-blue-600"
                  onClick={handleCreatePost}
                  disabled={loading || !postContent.trim()}
                >
                  {loading ? "Posting..." : "Post"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewPostForm;
