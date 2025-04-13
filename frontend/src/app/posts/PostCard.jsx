"use client";

/**
 * PostCard Component
 *
 * A component for displaying posts in the posts page.
 * This component extends BaseCard with specific functionality for posts.
 */
import React, { useState } from "react";

import EditPostForm from "./EditPostForm";
import BaseCard from "@/components/shared/BaseCard";

/**
 * PostCard Component
 * @param {Object} props - Component props
 * @param {Object} props.post - Post data
 * @returns {React.ReactElement}
 */
const PostCard = ({ post }) => {
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Handle edit callback
  const handleEdit = () => {
    setIsEditFormOpen(true);
  };

  return (
    <>
      <BaseCard post={post} onEdit={handleEdit} />

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

export default PostCard;
