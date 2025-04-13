"use client";

/**
 * VideoCard Component
 *
 * A component for displaying video posts in the video feed.
 * This component extends BaseCard with specific functionality for videos.
 */

import React, { useState } from "react";
import BaseCard from "@/components/shared/BaseCard";
import EditPostForm from "../posts/EditPostForm";

/**
 * VideoCard Component
 * @param {Object} props - Component props
 * @param {Object} props.post - Post data
 * @returns {React.ReactElement}
 */
const VideoCard = ({ post }) => {
  // No need to pass commentsComponent anymore as BaseCard now uses EnhancedCommentSystem directly
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Handle edit callback
  const handleEdit = () => {
    setIsEditFormOpen(true);
  };

  return (
    <>
      <BaseCard post={post} isVideoFeed={true} onEdit={handleEdit} />

      {/* Edit Post Form */}
      {isEditFormOpen && (
        <EditPostForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          post={post}
        />
      )}
    </>
  );
};

export default VideoCard;
