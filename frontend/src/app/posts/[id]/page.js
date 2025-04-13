"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, Share2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import Loader from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import BaseCard from "@/components/shared/BaseCard";
import MediaCard from "@/components/shared/MediaCard";
import EditPostForm from "../EditPostForm";
import { Card, CardContent } from "@/components/ui/card";
import { showErrorToast, showSuccessToast } from "@/lib/toastUtils";
import { generateSharedLink } from "@/lib/postInteractionHelpers";

import usePostStore from "@/store/postStore";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { fetchPost } = usePostStore();

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Function to handle sharing the current post
  const handleShareCurrentPost = async () => {
    if (!post) return;

    try {
      // Copy the post URL to clipboard
      const postUrl = generateSharedLink(post._id);
      await navigator.clipboard.writeText(postUrl);

      // Update share count in backend
      await usePostStore.getState().sharePost(post._id, "copy");

      showSuccessToast("Link copied to clipboard!");
    } catch (error) {
      console.error("Error sharing post:", error);
      showErrorToast("Failed to share post");
    }
  };

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Use the fetchPost function from postStore
        // This ensures consistent post data format and handling
        const postData = await fetchPost(id);

        if (!postData) {
          throw new Error("Post not found");
        }

        setPost(postData);
      } catch (error) {
        console.error("Error loading post:", error);
        setError(error.message || "Failed to load post");
        showErrorToast("Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [id, fetchPost]);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={handleGoBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {post && (
          <Button variant="outline" onClick={handleShareCurrentPost}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6 dark:text-white">Post Details</h1>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center py-10">
            <p className="text-red-500 dark:text-red-400">Error: {error}</p>
            <Button className="mt-4" onClick={handleGoBack}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      ) : post ? (
        post.mediaType === "video" ? (
          <MediaCard
            post={post}
            onEdit={() => {
              setIsEditFormOpen(true);
            }}
          />
        ) : (
          <>
            <BaseCard
              post={post}
              onEdit={() => {
                setIsEditFormOpen(true);
              }}
            />

            {/* Edit Post Form */}
            {isEditFormOpen && (
              <EditPostForm
                isOpen={isEditFormOpen}
                onClose={() => setIsEditFormOpen(false)}
                post={post}
              />
            )}
          </>
        )
      ) : (
        <Card>
          <CardContent className="p-6 text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Post not found</p>
            <Button className="mt-4" onClick={handleGoBack}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
