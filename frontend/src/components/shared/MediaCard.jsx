"use client";

/**
 * MediaCard Component
 *
 * A component for displaying media posts (images, videos) in the feed.
 * This component extends BaseCard with specific functionality for media posts.
 */

import React from "react";
import BaseCard from "./BaseCard";

/**
 * MediaCard Component
 * @param {Object} props - Component props
 * @param {Object} props.post - Post data
 * @param {boolean} props.isVideoFeed - Whether this card is in video feed
 * @param {Object} props.customHandlers - Custom handlers for interactions
 * @param {boolean} props.initialLiked - Initial like state
 * @param {Function} props.onDelete - Callback when post is deleted
 * @param {Function} props.onEdit - Callback when post is edited
 * @returns {React.ReactElement}
 */
const MediaCard = ({
  post,
  isVideoFeed = false,
  customHandlers = null,
  initialLiked = undefined,
  onDelete = null,
  onEdit = null,
}) => {
  // No need to pass commentsComponent anymore as BaseCard now uses EnhancedCommentSystem directly

  // Render BaseCard
  return (
    <BaseCard
      post={post}
      isVideoFeed={isVideoFeed}
      customHandlers={customHandlers}
      initialLiked={initialLiked}
      onDelete={onDelete}
      onEdit={onEdit}
    />
  );
};

export default MediaCard;
