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

  // State for refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to force refresh posts
  const refreshPosts = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    // If user is logged in, fetch feed posts, otherwise fetch public posts
    // Only force refresh when refreshTrigger changes
    const forceRefresh = refreshTrigger > 0;
    fetchPosts(1, 10, forceRefresh);
  }, [fetchPosts, user, refreshTrigger]);

  return (
    <>
      <StorySection />
      <div className="mt-4">
        <NewPostForm
          isPostFormOpen={isPostFormOpen}
          setIsPostFormOpen={setIsPostFormOpen}
        />
      </div>

      {/* Subtle refresh indicator at the top of posts */}
      <div className="flex justify-center mt-4">
        <button
          onClick={refreshPosts}
          className="text-xs text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh feed
        </button>
      </div>

      {error && (
        // Show error message if there is one
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-6 mb-4">
        {posts.length > 0 ? (
          // Always show posts if we have them, even while loading more
          <>
            {posts.map((post) => (
              <MediaCard key={post?._id} post={post} />
            ))}
            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            )}
          </>
        ) : loading ? (
          // Only show loading indicator if we have no posts yet
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          // Show a message if there are no posts
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
