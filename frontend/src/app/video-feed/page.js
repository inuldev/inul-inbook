"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import VideoCard from "./VideoCard";
import usePostStore from "@/store/postStore";

export default function VideoFeedPage() {
  const { loading } = usePostStore();
  const [videoPosts, setVideoPosts] = useState([]);

  useEffect(() => {
    const loadVideoPosts = async () => {
      try {
        // In a real implementation, you would fetch video posts from your API
        // For now, we'll use sample data
        setVideoPosts([
          {
            _id: 1,
            mediaUrl:
              "https://videos.pexels.com/video-files/31169800/13316077_360_640_60fps.mp4",
            mediaType: "video",
            user: {
              _id: 1,
              username: "johndoe",
              profilePicture: "",
            },
            content: "Sample video post",
            createdAt: new Date().toISOString(),
            comments: [
              {
                _id: 1,
                user: {
                  _id: 1,
                  username: "johndoe",
                  profilePicture: "",
                },
                text: "This is a sample comment.",
                createdAt: new Date().toISOString(),
              },
              {
                _id: 2,
                user: {
                  _id: 2,
                  username: "janedoe",
                  profilePicture: "",
                },
                text: "This is another sample comment.",
                createdAt: new Date().toISOString(),
              },
            ],
          },
        ]);
      } catch (error) {
        console.error("Error loading video posts:", error);
      }
    };

    loadVideoPosts();
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => window.history.back()}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to feed
      </Button>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : videoPosts.length > 0 ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {videoPosts.map((post) => (
            <VideoCard key={post?._id} post={post} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">
              No video posts available.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
