"use client";

import React, { useState } from "react";
import { Play } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import useStoryStore from "@/store/storyStore";

const StoryCard = ({ story }) => {
  const { viewStory } = useStoryStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleStoryClick = () => {
    setIsOpen(true);
    viewStory(story._id);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Card
        className="w-[110px] h-[200px] relative overflow-hidden group cursor-pointer rounded-xl"
        onClick={handleStoryClick}
      >
        <CardContent className="p-0 h-full">
          <div className="absolute inset-0 bg-black bg-opacity-20 z-10"></div>
          {story?.mediaType === "image" ? (
            <img
              src={story?.mediaUrl}
              alt={story?.user?.username || "Story"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full">
              <img
                src={story?.mediaUrl}
                alt={story?.user?.username || "Story"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 rounded-full p-2">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )}
          <div className="absolute top-2 left-2 ring-2 ring-blue-500 rounded-full z-20">
            <Avatar className="h-8 w-8">
              <AvatarImage src={story?.user?.profilePicture} />
              <AvatarFallback className="dark:bg-gray-600">
                {story?.user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute bottom-2 left-2 right-2 z-20">
            <p className="text-white text-xs font-semibold truncate drop-shadow-md">
              {story?.user?.username || "User"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-black">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black to-transparent">
            <DialogTitle className="text-white flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={story?.user?.profilePicture} />
                <AvatarFallback className="bg-gray-600">
                  {story?.user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span>{story?.user?.username || "User"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-full w-full">
            {story?.mediaType === "image" ? (
              <img
                src={story?.mediaUrl}
                alt={story?.user?.username || "Story"}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <video
                src={story?.mediaUrl}
                controls
                autoPlay
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
          {story?.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
              <p className="text-white">{story.caption}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StoryCard;
