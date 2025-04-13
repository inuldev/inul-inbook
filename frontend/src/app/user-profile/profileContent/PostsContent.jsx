import React from "react";
import MediaCard from "@/components/shared/MediaCard";

const PostsContent = ({
  post,
  isLiked,
  onShare,
  onComment,
  onLike,
  onEdit,
}) => {
  // Create custom handlers for the profile page
  const customHandlers = {
    handleLikeToggle: () => onLike(),
    handleAddComment: (text) => onComment({ text }),
    handleShare: () => onShare(),
    handleEdit: () => {
      if (onEdit) onEdit(post);
    },
  };

  return (
    <MediaCard
      post={post}
      initialLiked={isLiked}
      customHandlers={customHandlers}
    />
  );
};

export default PostsContent;
