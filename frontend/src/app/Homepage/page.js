"use client";

import React, { useState, useEffect } from "react";

import MediaCard from "@/components/shared/MediaCard";
import NewPostForm from "../posts/NewPostForm";
import StorySection from "../story/StorySection";

import usePostStore from "@/store/postStore";
import userStore from "@/store/userStore";

const HomePage = () => {
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const { posts, fetchPosts, loading, error } = usePostStore();
  const { user } = userStore();

  useEffect(() => {
    // If user is logged in, fetch feed posts, otherwise fetch public posts
    if (user) {
      fetchPosts();
    } else {
      fetchPosts();
    }
  }, [fetchPosts, user]);

  return (
    <>
      <StorySection />
      <NewPostForm
        isPostFormOpen={isPostFormOpen}
        setIsPostFormOpen={setIsPostFormOpen}
      />

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-6 mb-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => <MediaCard key={post?._id} post={post} />)
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p>No posts to display.</p>
            <p className="mt-2">
              Create a post or follow more users to see their posts here!
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;
