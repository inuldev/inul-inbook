"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MediaCard from "@/components/shared/MediaCard";
import usePostStore from "@/store/postStore";

export default function VideoFeedPage() {
  const { loading, error } = usePostStore();
  const [videoPosts, setVideoPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const loadVideoPosts = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const postStore = usePostStore.getState();
        const result = await postStore.fetchVideoPosts(1, 20);
        setVideoPosts(result.posts);
      } catch (error) {
        console.error("Error loading video posts:", error);
        setLoadError(error.message || "Failed to load video posts");
      } finally {
        setIsLoading(false);
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

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : loadError ? (
        <Card>
          <CardContent className="p-6 text-center py-10">
            <p className="text-red-500 dark:text-red-400">Error: {loadError}</p>
          </CardContent>
        </Card>
      ) : videoPosts.length > 0 ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {videoPosts.map((post) => (
            <MediaCard key={post?._id} post={post} isVideoFeed={true} />
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
