"use client";

/**
 * MediaComments Component
 *
 * A component for displaying comments on media posts.
 * This is a wrapper around the EnhancedCommentSystem component.
 */

import React from "react";
import EnhancedCommentSystem from "@/components/shared/EnhancedCommentSystem";

/**
 * MediaComments Component
 * @param {Object} props - Component props
 * @param {Array} props.comments - Comments data
 * @param {string} props.postId - Post ID
 * @returns {React.ReactElement}
 */
const MediaComments = ({ comments, postId }) => {
  // Create a post object with the comments and postId
  const post = {
    _id: postId,
    comments: comments || [],
  };

  // Simply render the EnhancedCommentSystem component
  return <EnhancedCommentSystem post={post} />;
};

export default MediaComments;
