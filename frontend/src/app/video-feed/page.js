"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MediaCard from "@/components/shared/MediaCard";
import EditPostForm from "../posts/EditPostForm";
import usePostStore from "@/store/postStore";

export default function VideoFeedPage() {
  const { posts, loading, error, fetchVideoPosts } = usePostStore();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [videoPosts, setVideoPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Load video posts on mount
  useEffect(() => {
    const loadVideoPosts = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await fetchVideoPosts(1, 20);
        if (result && result.error) {
          setLoadError(result.error);
        }
      } catch (error) {
        console.error("Error loading video posts:", error);
        setLoadError(error.message || "Failed to load video posts");
      } finally {
        setIsLoading(false);
      }
    };

    loadVideoPosts();
  }, [fetchVideoPosts]);

  // Filter video posts from the store whenever posts change
  useEffect(() => {
    if (posts && posts.length > 0) {
      // Filter for video posts only
      const videoOnlyPosts = posts.filter((post) => post.mediaType === "video");

      // Sort by newest first
      const sortedPosts = [...videoOnlyPosts].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setVideoPosts(sortedPosts);
    } else {
      setVideoPosts([]);
    }
  }, [posts]);

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
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : videoPosts.length > 0 ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {videoPosts.map((post) => (
            <MediaCard
              key={post?._id}
              post={post}
              isVideoFeed={true}
              onEdit={() => {
                setEditingPost(post);
                setIsEditFormOpen(true);
              }}
            />
          ))}

          {/* Edit Post Form */}
          {isEditFormOpen && editingPost && (
            <EditPostForm
              isOpen={isEditFormOpen}
              onClose={() => {
                setIsEditFormOpen(false);
                setEditingPost(null);
              }}
              post={editingPost}
            />
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">
              No video posts available.
            </p>
            <Button className="mt-4" onClick={() => fetchVideoPosts(1, 20)}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
