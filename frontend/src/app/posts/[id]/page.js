"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MediaCard from "@/components/shared/MediaCard";
import Loader from "@/components/ui/loader";
import { showErrorToast } from "@/lib/toastUtils";
import config from "@/lib/config";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${config.backendUrl}/api/posts/${id}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.medium,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to load post");
        }

        setPost(data.data);
      } catch (error) {
        console.error("Error loading post:", error);
        setError(error.message || "Failed to load post");
        showErrorToast("Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

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
        <MediaCard post={post} />
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
