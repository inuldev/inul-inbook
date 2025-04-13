"use client";

/**
 * VideoCard Component
 *
 * A component for displaying video posts in the video feed.
 * This component extends BaseCard with specific functionality for videos.
 */

import React from "react";
import BaseCard from "@/components/shared/BaseCard";

/**
 * VideoCard Component
 * @param {Object} props - Component props
 * @param {Object} props.post - Post data
 * @returns {React.ReactElement}
 */
const VideoCard = ({ post }) => {
  // No need to pass commentsComponent anymore as BaseCard now uses EnhancedCommentSystem directly

  return <BaseCard post={post} isVideoFeed={true} />;
};

export default VideoCard;
