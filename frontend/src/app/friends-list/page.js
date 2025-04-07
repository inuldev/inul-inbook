"use client";

import React, { useState, useEffect } from "react";

import { FriendCardSkeleton, NoFriendsMessage } from "@/lib/Skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
    <>
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
            <FriendsSuggestion key={friend._id || "temp"} friend={friend} />
          ))
        )}
      </div>
    </>
  );
}
