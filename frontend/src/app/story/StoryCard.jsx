"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Play, X } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import useStoryStore from "@/store/storyStore";

const StoryCard = ({ story }) => {
  const router = useRouter();
  const { viewStory } = useStoryStore();
  const [isOpen, setIsOpen] = useState(false);
  const videoRef = useRef(null);

  const handleStoryClick = () => {
    setIsOpen(true);
    viewStory(story._id);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Pause video when dialog is closed
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Handle escape key to close dialog
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isOpen]);

  return (
    <>
      {/* Story Card Thumbnail */}
      <Card
        className="w-[110px] h-[200px] relative overflow-hidden group cursor-pointer rounded-xl"
        onClick={handleStoryClick}
      >
        <CardContent className="p-0 h-full">
          <div className="absolute inset-0 bg-black bg-opacity-20 z-10"></div>
          {story?.mediaType === "image" ? (
            <div className="relative w-full h-full">
              {story?.mediaUrl ? (
                <Image
                  src={story.mediaUrl}
                  alt={story?.user?.username || "Story"}
                  fill
                  sizes="110px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    No image
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full">
              <div className="w-full h-full bg-gradient-to-b from-blue-900 to-purple-900">
                {/* Video thumbnail with fallback */}
                <div className="relative w-full h-full">
                  {story?.mediaUrl ? (
                    <Image
                      src={
                        story.mediaUrl.replace(/\.(mp4|mov)$/i, ".jpg") ||
                        story.mediaUrl
                      }
                      alt={story?.user?.username || "Story"}
                      fill
                      sizes="110px"
                      className="object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/110x200/333/white?text=Video";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      <span className="text-xs text-gray-300">No video</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 rounded-full p-2">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )}
          <div className="absolute top-2 left-2 ring-2 ring-blue-500 rounded-full z-20">
            <Avatar
              className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-white transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation(); // Prevent opening the story
                router.push(`/user-profile/${story?.user?._id}`);
              }}
            >
              <AvatarImage
                key={`story-avatar-${story?.user?._id}-${Date.now()}`}
                src={story?.user?.profilePicture || ""}
              />
              <AvatarFallback className="dark:bg-gray-600">
                {story?.user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div
            className="absolute bottom-2 left-2 right-2 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening the story
              router.push(`/user-profile/${story?.user?._id}`);
            }}
          >
            <p className="text-white text-xs font-semibold truncate drop-shadow-md hover:underline">
              {story?.user?.username || "User"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Story Viewer Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl w-[90vw] h-[90vh] p-0 overflow-hidden bg-black group">
          {/* Header with user info */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black to-transparent">
            <DialogTitle className="text-white flex items-center">
              <Avatar
                className="h-8 w-8 mr-2 cursor-pointer hover:ring-2 hover:ring-white transition-all duration-200"
                onClick={() => {
                  handleClose();
                  router.push(`/user-profile/${story?.user?._id}`);
                }}
              >
                <AvatarImage
                  key={`story-dialog-avatar-${story?.user?._id}-${Date.now()}`}
                  src={story?.user?.profilePicture}
                />
                <AvatarFallback className="bg-gray-600">
                  {story?.user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span
                className="cursor-pointer hover:underline"
                onClick={() => {
                  handleClose();
                  router.push(`/user-profile/${story?.user?._id}`);
                }}
              >
                {story?.user?.username || "User"}
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only"></DialogDescription>
          </DialogHeader>

          {/* Close button - only visible on hover */}
          <Button
            className="absolute top-4 right-4 z-30 h-8 w-8 rounded-full p-0 bg-black bg-opacity-30 hover:bg-opacity-70 transition-opacity opacity-0 group-hover:opacity-100"
            onClick={handleClose}
            aria-label="Close story"
          >
            <X className="h-4 w-4 text-white" />
          </Button>

          {/* Media container */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            {story?.mediaType === "image" ? (
              <div className="flex items-center justify-center w-full h-full">
                <img
                  src={story?.mediaUrl}
                  alt={story?.user?.username || "Story"}
                  className="max-h-[80vh] max-w-[90%] object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <video
                  ref={videoRef}
                  src={story?.mediaUrl}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-[90%] object-contain"
                />
              </div>
            )}
          </div>

          {/* Caption */}
          {story?.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent z-30">
              <p className="text-white">{story.caption}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StoryCard;
