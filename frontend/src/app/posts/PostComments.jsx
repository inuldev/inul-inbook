"use client";

/**
 * PostComments Component
 *
 * A component for displaying comments on posts.
 * This is a wrapper around the EnhancedCommentSystem component.
 */

import React from "react";
import EnhancedCommentSystem from "@/components/shared/EnhancedCommentSystem";

/**
 * PostComments Component
 * @param {Object} props - Component props
 * @param {Object} props.post - Post data
 * @returns {React.ReactElement}
 */
const PostComments = ({ post }) => {
  // Simply render the EnhancedCommentSystem component
  return <EnhancedCommentSystem post={post} />;
};

export default PostComments;
