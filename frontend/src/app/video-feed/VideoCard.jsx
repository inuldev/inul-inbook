"use client";

/**
 * VideoCard Component
 * 
 * A component for displaying video posts in the video feed.
 * This component extends BaseCard with specific functionality for videos.
 */

import React from "react";
import BaseCard from "@/components/shared/BaseCard";
import VideoComments from "./VideoComments";

/**
 * VideoCard Component
 * @param {Object} props - Component props
 * @param {Object} props.post - Post data
 * @returns {React.ReactElement}
 */
const VideoCard = ({ post }) => {
  // Render VideoComments component for comments
  const commentsComponent = <VideoComments comments={post?.comments} />;

  return (
    <BaseCard
      post={post}
      isVideoFeed={true}
      commentsComponent={commentsComponent}
    />
  );
};

export default VideoCard;
