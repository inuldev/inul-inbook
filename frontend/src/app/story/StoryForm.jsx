"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, AlertCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import userStore from "@/store/userStore";
import useStoryStore from "@/store/storyStore";
import CloudinaryUploader from "../components/CloudinaryUploader";
import config from "@/lib/config";

const StoryForm = () => {
  const { user } = userStore();
  const { createStory, loading, error } = useStoryStore();

  const [isOpen, setIsOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [mediaData, setMediaData] = useState(null);
  const [storyError, setStoryError] = useState(null);
  const [showMediaUploader, setShowMediaUploader] = useState(true);

  const handleMediaUploadComplete = (data) => {
    setMediaData(data);
    setShowMediaUploader(false);
  };

  const handleMediaUploadError = (errorMessage) => {
    setStoryError(errorMessage);
  };

  const handleCreateStory = async () => {
    if (!mediaData) {
      setStoryError("Please upload an image or video for your story");
      return;
    }

    try {
      setStoryError(null);

      // Create story with already uploaded media URL
      await fetch(`${config.backendUrl}/api/stories/direct`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption,
          mediaUrl: mediaData.url,
          mediaType: mediaData.type,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.success) {
            throw new Error(data.message || "Failed to create story");
          }

          // Update stories in store
          useStoryStore.getState().addStory(data.data);
        });

      // Reset form
      setCaption("");
      setMediaData(null);
      setShowMediaUploader(true);
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating story:", error);
      setStoryError(error.message);
    }
  };

  const handleRemoveMedia = () => {
    setMediaData(null);
    setShowMediaUploader(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative cursor-pointer group">
          <div className="w-[110px] h-[200px] rounded-xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mb-2">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-center">Create Story</p>
              <div className="absolute bottom-4 w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-gray-800">
                <Avatar className="h-full w-full">
                  <AvatarImage src={user?.profilePicture || ""} />
                  <AvatarFallback className="dark:bg-gray-600">
                    {user?.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Create Story</DialogTitle>
          <DialogDescription className="sr-only"></DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {storyError && (
            <div className="text-red-500 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>{storyError}</span>
            </div>
          )}

          {showMediaUploader && !mediaData && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Upload a photo or video for your story (max 5MB)
              </p>
              <CloudinaryUploader
                onUploadComplete={handleMediaUploadComplete}
                onUploadError={handleMediaUploadError}
                maxSize={5}
                uploadType="story"
              />
            </div>
          )}

          {mediaData && (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {mediaData.type === "image" ? (
                <img
                  src={mediaData.url}
                  alt="Story preview"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
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

          <Textarea
            placeholder="Add a caption to your story..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none"
          />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateStory}
              disabled={loading || !mediaData}
            >
              {loading ? "Creating..." : "Create Story"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryForm;
