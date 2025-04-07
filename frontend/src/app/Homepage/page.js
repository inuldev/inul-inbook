"use client";

import React, { useState, useEffect } from "react";

import PostCard from "../posts/PostCard";
import NewPostForm from "../posts/NewPostForm";
import StorySection from "../story/StorySection";
import LeftSideBar from "../components/LeftSideBar";
import RightSideBar from "../components/RightSideBar";

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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex flex-1 pt-16">
        <LeftSideBar />
        <div className="flex-1 px-4 py-6 md:ml-64 lg:mr-64 lg:max-w-2xl xl:max-w-3xl mx-auto">
          <div className="lg:ml-2 xl:ml-28">
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
                posts.map((post) => <PostCard key={post?._id} post={post} />)
              ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <p>No posts to display.</p>
                  <p className="mt-2">
                    Create a post or follow more users to see their posts here!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:w-64 xl:w-80 fixed right-0 top-16 bottom-0 overflow-y-auto p-4">
          <RightSideBar />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
