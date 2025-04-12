"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

import {
  FriendCardSkeleton,
  NoFriendsMessage,
} from "@/components/ui/skeleton-components";
import { Card, CardContent } from "@/components/ui/card";
import FriendRequest from "./FriendRequest";
import FriendsSuggestion from "./FriendsSuggestion";

import {
  getFriendRequests,
  getFriendSuggestions,
} from "@/service/friends.service";
import useFriendNotificationStore from "@/store/friendNotificationStore";

export default function FriendsListPage() {
  const [loading, setLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const { resetCount } = useFriendNotificationStore();

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch friend requests and suggestions
      const [requestsData, suggestionsData] = await Promise.all([
        getFriendRequests(),
        getFriendSuggestions(),
      ]);

      setFriendRequests(requestsData);
      setFriendSuggestions(suggestionsData);
    } catch (error) {
      console.error("Error loading friend data:", error);
      toast.error("Failed to load friend data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Reset the notification count when the page is visited
    resetCount();
  }, [resetCount]);

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
            <FriendRequest
              key={friend._id || "temp"}
              friend={friend}
              onRequestProcessed={loadData}
            />
          ))
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6">People You May Know</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <FriendCardSkeleton />
        ) : friendSuggestions.length === 0 ? (
          <Card className="col-span-3">
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
              onRequestSent={loadData}
            />
          ))
        )}
      </div>
    </>
  );
}
