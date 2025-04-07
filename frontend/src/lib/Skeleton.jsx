import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const FriendCardSkeleton = () => {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="col-span-1 mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-4"></div>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse mb-4"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export const NoFriendsMessage = ({ text, description }) => {
  return (
    <div className="text-center py-10">
      <h3 className="text-xl font-semibold mb-2">{text}</h3>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
};
