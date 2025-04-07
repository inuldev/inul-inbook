"use client";

import React, { useState, useEffect } from "react";

import { FriendCardSkeleton, NoFriendsMessage } from "@/lib/Skeleton";
import { Card, CardContent } from "@/components/ui/card";
import LeftSideBar from "../components/LeftSideBar";
import FriendRequest from "./FriendRequest";
import FriendsSuggestion from "./FriendsSuggestion";
import userStore from "@/store/userStore";

export default function FriendsListPage() {
  const { user } = userStore();
  const [loading, setLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setLoading(true);
      try {
        // In a real implementation, you would fetch data from your API
        // For now, we'll just simulate a delay and use empty data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Sample data - replace with actual API calls in the future
        setFriendRequests([{}]);
        setFriendSuggestions([{}]);
      } catch (error) {
        console.error("Error loading friend data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex flex-1 pt-16">
        <LeftSideBar />
        <div className="flex-1 px-4 py-6 md:ml-64 lg:mr-64 lg:max-w-2xl xl:max-w-3xl mx-auto">
          <div className="lg:ml-2 xl:ml-28">
            <h1 className="text-2xl font-bold mb-6">Friend Requests</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {loading ? (
                <FriendCardSkeleton />
              ) : friendRequests.length === 0 ? (
                <Card className="col-span-2">
                  <CardContent className="p-6">
                    <NoFriendsMessage
                      text="No Friend Requests"
                      description="Looks like you are all caught up! Why not explore and connect with new people?"
                    />
                  </CardContent>
                </Card>
              ) : (
                friendRequests.map((friend) => (
                  <FriendRequest key={friend._id || "temp"} friend={friend} />
                ))
              )}
            </div>

            <h1 className="text-2xl font-bold mb-6">People You May Know</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <FriendCardSkeleton />
              ) : friendSuggestions.length === 0 ? (
                <Card className="col-span-2">
                  <CardContent className="p-6">
                    <NoFriendsMessage
                      text="No Friend Suggestions"
                      description="Looks like you are all caught up! Why not explore and connect with new people?"
                    />
                  </CardContent>
                </Card>
              ) : (
                friendSuggestions.map((friend) => (
                  <FriendsSuggestion
                    key={friend._id || "temp"}
                    friend={friend}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
