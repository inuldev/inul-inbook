"use client";

/**
 * EnhancedCommentSystem Component (Optimistic UI)
 *
 * A comprehensive component for displaying and interacting with comments on posts.
 * Features include:
 * - Adding comments
 * - Liking comments
 * - Editing comments
 * - Deleting comments
 * - Replying to comments
 * - Hierarchical display of comment replies
 *
 * Implementation details:
 * - Uses optimistic UI updates for better user experience
 * - Handles temporary comments while waiting for server response
 * - Prevents duplicate comments from appearing
 * - Disables interactions on temporary comments
 * - Shows loading indicator for comments being sent
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  ThumbsUp,
  MoreHorizontal,
  Reply,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { formatDate } from "@/lib/utils";
import userStore from "@/store/userStore";
import usePostStore from "@/store/postStore";
import { addPostComment } from "@/lib/postInteractionHelpers";
import {
  toggleCommentLike,
  deleteComment,
  replyToComment,
  updateComment,
} from "@/lib/commentInteractionHelpers";

const EnhancedCommentSystem = ({ post, onCommentAdded }) => {
  const { user } = userStore();
  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  const [commentLikeCounts, setCommentLikeCounts] = useState({});
  // State for forcing re-render when comments are updated
  // This helps ensure temporary comments are properly replaced with real ones
  const [, forceUpdate] = useState({});

  // State for show more/less comments
  const [visibleCommentCount, setVisibleCommentCount] = useState(3);
  const [showAllComments, setShowAllComments] = useState(false);

  // State for tracking visible replies per comment
  const [visibleRepliesCount, setVisibleRepliesCount] = useState({});

  const editInputRef = useRef(null);
  const replyInputRef = useRef(null);
  const commentInputRef = useRef(null);

  // Focus input when component mounts
  useEffect(() => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, []);

  // Initialize comment likes state and clean up temporary comments
  useEffect(() => {
    if (post?.comments?.length > 0) {
      // Clean up any temporary comments if we have real ones
      const tempComments = post.comments.filter((c) => c.isTemp);
      if (tempComments.length > 0) {
        // For each temp comment, check if we have a real one with the same text and user
        tempComments.forEach((tempComment) => {
          const hasRealComment = post.comments.some(
            (c) =>
              !c.isTemp &&
              c.text === tempComment.text &&
              c.user?._id === tempComment.user?._id
          );

          // If we have a real comment, remove the temp one
          if (hasRealComment) {
            post.comments = post.comments.filter(
              (c) => c._id !== tempComment._id
            );
            // Force update to reflect changes
            forceUpdate({});
          }
        });
      }

      // Also clean up temporary replies in comments
      post.comments.forEach((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          const tempReplies = comment.replies.filter((r) => r.isTemp);
          if (tempReplies.length > 0) {
            // For each temp reply, check if we have a real one with the same text and user
            tempReplies.forEach((tempReply) => {
              const hasRealReply = comment.replies.some(
                (r) =>
                  !r.isTemp &&
                  r.text === tempReply.text &&
                  r.user?._id === tempReply.user?._id
              );

              // If we have a real reply, remove the temp one
              if (hasRealReply) {
                comment.replies = comment.replies.filter(
                  (r) => r._id !== tempReply._id
                );
                // Force update to reflect changes
                forceUpdate({});
              }
            });
          }
        }
      });

      const initialLikes = {};
      const initialLikeCounts = {};

      post.comments.forEach((comment) => {
        // Check if current user has liked this comment
        const isLiked = comment.likes?.some((like) => {
          if (typeof like === "string") {
            return like === user?._id;
          } else if (like && typeof like === "object") {
            return like._id === user?._id;
          }
          return false;
        });

        initialLikes[comment._id] = isLiked;
        initialLikeCounts[comment._id] =
          comment.likeCount || comment.likes?.length || 0;

        // Also initialize for replies if they exist
        if (comment.replies?.length > 0) {
          comment.replies.forEach((reply) => {
            const isReplyLiked = reply.likes?.some((like) => {
              if (typeof like === "string") {
                return like === user?._id;
              } else if (like && typeof like === "object") {
                return like._id === user?._id;
              }
              return false;
            });

            initialLikes[reply._id] = isReplyLiked;
            initialLikeCounts[reply._id] =
              reply.likeCount || reply.likes?.length || 0;
          });
        }
      });

      setCommentLikes(initialLikes);
      setCommentLikeCounts(initialLikeCounts);
    }
  }, [post?.comments, user?._id, forceUpdate]);

  // Handle comment submission
  // This function creates a temporary comment for immediate display
  // and then sends the actual comment to the server in the background
  // It also handles duplicate prevention and error handling
  const handleAddComment = () => {
    if (!commentText.trim()) return;

    // Store the comment text before clearing input
    const commentToSend = commentText.trim();

    // Clear input immediately for better UX
    setCommentText("");

    // Create a temporary comment for immediate display
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const tempComment = {
      _id: tempId,
      text: commentToSend,
      user: user,
      createdAt: new Date().toISOString(),
      likes: [],
      likeCount: 0,
      replies: [],
      replyCount: 0,
      isTemp: true, // Mark as temporary
    };

    // Add temporary comment to UI immediately
    const updatedComments = [tempComment, ...(post.comments || [])];
    post.comments = updatedComments;

    // Use the standardized helper function without waiting
    // But don't call onCommentAdded since we've already added the temp comment
    addPostComment(
      post._id,
      commentToSend,
      setCommentText,
      (count) => {
        // Only update the count, not add another comment
        if (onCommentAdded) onCommentAdded(count);
      },
      null, // Don't add another temporary comment
      (newComment) => {
        // Replace temporary comment with real one if needed
        if (post.comments) {
          // Find and remove any duplicates of this comment (by text and user)
          const duplicates = post.comments.filter(
            (c) =>
              c._id !== tempId && // Not our temp comment
              c.text === commentToSend && // Same text
              c.user?._id === user?._id && // Same user
              !c.isTemp // Not another temp comment
          );

          // Remove duplicates
          if (duplicates.length > 0) {
            post.comments = post.comments.filter(
              (comment) => !duplicates.some((dup) => dup._id === comment._id)
            );
          }

          // Replace our temp comment with the real one
          const index = post.comments.findIndex(
            (c) => c.isTemp && c._id === tempId
          );
          if (index !== -1 && newComment) {
            // Completely replace the temporary comment with the real one
            // Make sure not to include isTemp property at all
            post.comments[index] = newComment;

            // Force a re-render by creating a new array
            post.comments = [...post.comments];

            // Force component re-render
            forceUpdate({});
          }
        }
      }
    ).catch((error) => {
      console.error("Error adding comment:", error);
      // Remove temporary comment on error
      if (post.comments) {
        post.comments = post.comments.filter(
          (c) => !c.isTemp || c._id !== tempId
        );
      }
    });
  };

  // Handle comment like toggle
  const handleLikeComment = async (commentId) => {
    const isLiked = commentLikes[commentId] || false;
    const currentCount = commentLikeCounts[commentId] || 0;

    // Update state optimistically
    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: !isLiked,
    }));

    setCommentLikeCounts((prev) => ({
      ...prev,
      [commentId]: !isLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
    }));

    try {
      // Create updater functions for the like state and count
      const updateLikeState = (newLikedState) => {
        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: newLikedState,
        }));
      };

      const updateLikeCount = (newCount) => {
        setCommentLikeCounts((prev) => ({
          ...prev,
          [commentId]: newCount,
        }));
      };

      // Call the API with post ID to ensure store is updated
      await toggleCommentLike(
        commentId,
        post._id, // Pass the post ID
        isLiked,
        updateLikeState,
        updateLikeCount
      );

      // After the API call, refresh the comments from the post store
      const postStore = usePostStore.getState();
      const updatedPost = postStore.posts.find((p) => p._id === post._id);

      if (updatedPost && updatedPost.comments) {
        // Find the updated comment
        const updatedComment = updatedPost.comments.find(
          (c) => c._id === commentId
        );

        if (updatedComment) {
          // Update the like state and count with the latest data from the server
          setCommentLikes((prev) => ({
            ...prev,
            [commentId]: updatedComment.isLiked || false,
          }));

          setCommentLikeCounts((prev) => ({
            ...prev,
            [commentId]: updatedComment.likeCount || 0,
          }));
        }
      }
    } catch (error) {
      // Revert on error
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: isLiked,
      }));

      setCommentLikeCounts((prev) => ({
        ...prev,
        [commentId]: currentCount,
      }));

      console.error("Error toggling comment like:", error);
    }
  };

  // Handle edit comment
  const handleEditComment = (commentId, text) => {
    // Store the original comment text in a data attribute for potential rollback
    const commentElement = document.querySelector(
      `[data-comment-id="${commentId}"]`
    );
    if (commentElement) {
      commentElement.dataset.originalText = text;
    }

    setEditingComment(commentId);
    setEditText(text);

    // Focus the edit input after a short delay to allow rendering
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 50);
  };

  // Handle save edited comment
  const handleSaveEdit = (commentId) => {
    if (!editText.trim()) return;

    // Find the comment to update - could be a top-level comment or a reply
    let foundComment = null;

    // First check if it's a top-level comment
    foundComment = post.comments.find((c) => c._id === commentId);

    // If not found, check if it's a reply
    if (!foundComment) {
      // Search through all comments' replies
      for (const comment of post.comments) {
        if (comment.replies && comment.replies.length > 0) {
          const reply = comment.replies.find((r) => r._id === commentId);
          if (reply) {
            foundComment = reply;
            break;
          }
        }
      }
    }

    if (!foundComment) {
      console.error("Comment or reply not found");
      return;
    }

    // Update the comment text immediately in UI
    foundComment.text = editText.trim();
    foundComment.updatedAt = new Date().toISOString();

    // Reset editing state immediately
    setEditingComment(null);
    setEditText("");

    // Store original text for potential rollback
    const originalText = foundComment.text;

    // Find parent comment ID if it's a reply
    let parentCommentId = null;
    if (!post.comments.find((c) => c._id === commentId)) {
      // It's a reply, find the parent comment
      for (const comment of post.comments) {
        if (
          comment.replies &&
          comment.replies.some((r) => r._id === commentId)
        ) {
          parentCommentId = comment._id;
          break;
        }
      }
    }

    // Call the API in the background
    updateComment(commentId, post._id, editText, null, parentCommentId).catch(
      (error) => {
        console.error("Error updating comment:", error);
        // Revert the comment text on error
        if (foundComment) {
          // Revert to original text
          foundComment.text = originalText;
          delete foundComment.updatedAt;

          // Also try to refresh the post data in the background
          const postStore = usePostStore.getState();
          postStore.fetchPost(post._id, true, true).catch((err) => {
            console.warn(
              `Error refreshing post after failed edit: ${err.message}`
            );
          });
        }
      }
    );
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText("");
  };

  // Handle delete comment
  const handleDeleteComment = (commentId) => {
    // Check if it's a top-level comment or a reply
    const isTopLevelComment = post.comments.some((c) => c._id === commentId);
    let deletedComment;
    let parentComment;

    if (isTopLevelComment) {
      // It's a top-level comment
      const commentIndex = post.comments.findIndex((c) => c._id === commentId);
      if (commentIndex === -1) {
        console.error("Comment not found");
        return;
      }

      // Remove the comment from UI immediately
      deletedComment = post.comments[commentIndex];
      post.comments.splice(commentIndex, 1);
    } else {
      // It's a reply, find the parent comment and the reply
      for (const comment of post.comments) {
        if (comment.replies && comment.replies.length > 0) {
          const replyIndex = comment.replies.findIndex(
            (r) => r._id === commentId
          );
          if (replyIndex !== -1) {
            parentComment = comment;
            deletedComment = comment.replies[replyIndex];
            comment.replies.splice(replyIndex, 1);
            break;
          }
        }
      }

      if (!deletedComment) {
        console.error("Reply not found");
        return;
      }
    }

    // Also update the commentLikes and commentLikeCounts state
    setCommentLikes((prev) => {
      const newState = { ...prev };
      delete newState[commentId];

      // Also remove likes for replies if this was a parent comment
      if (deletedComment.replies && deletedComment.replies.length > 0) {
        deletedComment.replies.forEach((reply) => {
          delete newState[reply._id];
        });
      }

      return newState;
    });

    setCommentLikeCounts((prev) => {
      const newState = { ...prev };
      delete newState[commentId];

      // Also remove like counts for replies if this was a parent comment
      if (deletedComment.replies && deletedComment.replies.length > 0) {
        deletedComment.replies.forEach((reply) => {
          delete newState[reply._id];
        });
      }

      return newState;
    });

    // Call the API in the background
    deleteComment(commentId, post._id, parentComment?._id).catch((error) => {
      console.error("Error deleting comment:", error);
      // Restore the comment on error if needed
      if (isTopLevelComment) {
        // Find the index again in case the array has changed
        const index = post.comments.findIndex(
          (c) => c._id === deletedComment._id
        );
        if (index === -1) {
          // If not found, add it back
          post.comments.unshift(deletedComment);
        }
      } else if (parentComment) {
        // Add the reply back to the parent comment
        if (!parentComment.replies.some((r) => r._id === deletedComment._id)) {
          parentComment.replies.push(deletedComment);
        }
      }

      // Restore the likes state
      if (deletedComment._id) {
        setCommentLikes((prev) => ({
          ...prev,
          [deletedComment._id]: deletedComment.isLiked || false,
        }));

        setCommentLikeCounts((prev) => ({
          ...prev,
          [deletedComment._id]: deletedComment.likeCount || 0,
        }));

        // Restore likes for replies too
        if (deletedComment.replies && deletedComment.replies.length > 0) {
          const updatedLikes = { ...commentLikes };
          const updatedLikeCounts = { ...commentLikeCounts };

          deletedComment.replies.forEach((reply) => {
            if (reply._id) {
              updatedLikes[reply._id] = reply.isLiked || false;
              updatedLikeCounts[reply._id] = reply.likeCount || 0;
            }
          });

          setCommentLikes(updatedLikes);
          setCommentLikeCounts(updatedLikeCounts);
        }
      }
    });
  };

  // Handle reply to comment
  const handleReplyToComment = (commentId) => {
    setReplyingTo(commentId);
    setReplyText("");

    // Focus the reply input after a short delay to allow rendering
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 50);
  };

  // Handle save reply
  const handleSaveReply = (commentId) => {
    if (!replyText.trim()) return;

    // Find the parent comment
    const parentComment = post.comments.find((c) => c._id === commentId);
    if (!parentComment) {
      console.error("Parent comment not found");
      return;
    }

    // Create a temporary reply for immediate display
    const tempReplyId = `temp-reply-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const tempReply = {
      _id: tempReplyId,
      text: replyText.trim(),
      user: user,
      createdAt: new Date().toISOString(),
      likes: [],
      likeCount: 0,
      parentComment: commentId,
      isTemp: true, // Mark as temporary
    };

    // Add temporary reply to UI immediately
    if (!parentComment.replies) parentComment.replies = [];
    parentComment.replies.push(tempReply);
    parentComment.replyCount = (parentComment.replyCount || 0) + 1;

    // Clear input immediately for better UX
    const replyToSend = replyText.trim();
    setReplyText("");

    // Reset replying state immediately
    setReplyingTo(null);

    // Expand replies for this comment
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: true,
    }));

    // Call the API in the background
    replyToComment(commentId, post._id, replyToSend)
      .then((newReply) => {
        // If we got a reply from the server, replace the temporary one
        if (newReply && parentComment.replies) {
          // Find and remove any duplicates of this reply (by text and user)
          const duplicates = parentComment.replies.filter(
            (r) =>
              r._id !== tempReplyId && // Not our temp reply
              r.text === replyToSend && // Same text
              r.user?._id === user?._id && // Same user
              !r.isTemp // Not another temp reply
          );

          // Remove duplicates
          if (duplicates.length > 0) {
            parentComment.replies = parentComment.replies.filter(
              (reply) => !duplicates.some((dup) => dup._id === reply._id)
            );
          }

          // Replace our temp reply with the real one
          const index = parentComment.replies.findIndex(
            (r) => r.isTemp && r._id === tempReplyId
          );
          if (index !== -1) {
            // Completely replace the temporary reply with the real one
            parentComment.replies[index] = newReply;

            // Force a re-render
            parentComment.replies = [...parentComment.replies];
            forceUpdate({});
          }
        }
      })
      .catch((error) => {
        console.error("Error replying to comment:", error);
        // Remove temporary reply on error
        const parentComment = post.comments.find((c) => c._id === commentId);
        if (parentComment && parentComment.replies) {
          parentComment.replies = parentComment.replies.filter(
            (r) => !r.isTemp
          );
          parentComment.replyCount = parentComment.replies.length;
          forceUpdate({});
        }
      });
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  // Toggle expanded replies
  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));

    // Reset visible replies count when collapsing
    if (expandedReplies[commentId]) {
      setVisibleRepliesCount((prev) => ({
        ...prev,
        [commentId]: 3, // Reset to initial count
      }));
    }
  };

  // Show more replies for a comment
  const showMoreReplies = (commentId) => {
    const comment = post.comments.find((c) => c._id === commentId);
    if (!comment || !comment.replies) return;

    const currentVisible = visibleRepliesCount[commentId] || 3;
    const newVisible = Math.min(currentVisible + 3, comment.replies.length);

    setVisibleRepliesCount((prev) => ({
      ...prev,
      [commentId]: newVisible,
    }));
  };

  // Show less replies for a comment
  const showLessReplies = (commentId) => {
    setVisibleRepliesCount((prev) => ({
      ...prev,
      [commentId]: 3, // Reset to initial count
    }));
  };

  // Toggle show all comments
  const toggleShowAllComments = () => {
    const newShowAllState = !showAllComments;
    setShowAllComments(newShowAllState);

    // If we're hiding comments, reset the visible count to default
    if (!newShowAllState) {
      setVisibleCommentCount(3);
    }
  };

  // Render a single comment
  const renderComment = (comment, isReply = false) => {
    const isLiked = commentLikes[comment._id] || false;
    const likeCount = commentLikeCounts[comment._id] || 0;
    const isExpanded = expandedReplies[comment._id] || false;
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <div
        className={`flex items-start space-x-2 ${
          isReply ? "ml-8 mt-2" : "mb-4"
        }`}
      >
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment?.user?.profilePicture} />
          <AvatarFallback className="dark:bg-gray-400">
            {comment?.user?.username?.substring(0, 2).toUpperCase() || "??"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {/* Comment content */}
          <div
            className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2"
            data-comment-id={comment._id}
          >
            <div className="flex justify-between items-start">
              <div className="w-full">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-sm">
                    {comment?.user?.username || "Unknown User"}
                  </p>

                  {/* Edit/Delete dropdown for own comments */}
                  {user?._id === comment?.user?._id &&
                    editingComment !== comment._id &&
                    !comment.isTemp && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-6 w-6 p-0 dark:text-gray-300 ml-2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleEditComment(comment._id, comment.text)
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </div>

                {/* Comment text or edit form */}
                {editingComment === comment._id ? (
                  <div className="mt-1">
                    <div className="flex items-center">
                      <Input
                        ref={editInputRef}
                        className="flex-1 mr-2 text-sm"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit(comment._id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSaveEdit(comment._id)}
                        disabled={!editText.trim()}
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">
                    {comment.text}
                    {comment.isTemp && (
                      <span className="text-xs text-gray-400 ml-2">
                        (Mengirim...)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Comment metadata and actions */}
          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="mr-2">{formatDate(comment.createdAt)}</span>

            {/* Like button */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 px-2 ${
                isLiked ? "text-blue-500 dark:text-blue-400" : ""
              } ${comment.isTemp ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !comment.isTemp && handleLikeComment(comment._id)}
              disabled={comment.isTemp}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              {likeCount > 0 && <span>{likeCount}</span>}
            </Button>

            {/* Reply button - only show for top-level comments */}
            {!isReply && !comment.isTemp && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => handleReplyToComment(comment._id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {/* Show/hide replies button */}
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => toggleReplies(comment._id)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Reply input */}
          {replyingTo === comment._id && (
            <div className="mt-2 flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={user?.profilePicture} />
                <AvatarFallback className="dark:bg-gray-400">
                  {user?.username?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex">
                <Input
                  ref={replyInputRef}
                  className="flex-1 mr-2 h-8 text-sm"
                  placeholder={`Reply to ${comment?.user?.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={false}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveReply(comment._id);
                    } else if (e.key === "Escape") {
                      handleCancelReply();
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => handleSaveReply(comment._id)}
                  disabled={!replyText.trim()}
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 ml-1"
                  onClick={handleCancelReply}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {hasReplies && isExpanded && (
            <div className="mt-2">
              {/* Show limited replies with show more/less */}
              {comment.replies
                .filter(
                  (reply) =>
                    reply._id && // Must have valid ID
                    (!reply.isTemp || reply._id.startsWith("temp-reply-")) // Either not temporary or our own temp reply
                )
                .slice(0, visibleRepliesCount[comment._id] || 3) // Limit visible replies
                .map((reply) => (
                  <div key={reply._id || `fallback-reply-${Math.random()}`}>
                    {renderComment(reply, true)}
                  </div>
                ))}

              {/* Show more/less replies buttons */}
              {comment.replies.filter(
                (reply) =>
                  reply._id && // Must have valid ID
                  (!reply.isTemp || reply._id.startsWith("temp-reply-")) // Either not temporary or our own temp reply
              ).length > (visibleRepliesCount[comment._id] || 3) && (
                <div className="flex justify-end mt-1">
                  <button
                    onClick={() => showMoreReplies(comment._id)}
                    className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Show more replies
                  </button>
                </div>
              )}

              {(visibleRepliesCount[comment._id] || 3) > 3 &&
                comment.replies.filter(
                  (reply) =>
                    reply._id && // Must have valid ID
                    (!reply.isTemp || reply._id.startsWith("temp-reply-")) // Either not temporary or our own temp reply
                ).length > 3 && (
                  <div className="flex justify-end mt-1">
                    <button
                      onClick={() => showLessReplies(comment._id)}
                      className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Show less replies
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 border-t pt-4">
      {/* Comment input */}
      <div className="flex items-center mt-4 mb-4">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={user?.profilePicture} />
          <AvatarFallback className="dark:bg-gray-400">
            {user?.username?.substring(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex">
          <Input
            ref={commentInputRef}
            className="flex-1 mr-2 dark:border-gray-400"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={false}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={!commentText.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <ScrollArea className="h-[300px] w-full rounded-md border p-4">
        {post?.comments && post.comments.length > 0 ? (
          <div className="space-y-4">
            {/* Filter and limit top-level comments */}
            {/*
              Filter conditions:
              1. Only show top-level comments (not replies)
              2. Only show comments with valid IDs
              3. For temporary comments, only show our own temp comments (with temp- prefix)
                 This prevents duplicate comments from appearing
            */}
            {post.comments
              .filter(
                (comment) =>
                  !comment.parentComment && // Only top-level comments
                  comment._id && // Must have valid ID
                  (!comment.isTemp || comment._id.startsWith("temp-")) // Either not temporary or our own temp comment
              )
              .slice(0, showAllComments ? undefined : visibleCommentCount) // Limit visible comments
              .map((comment) => (
                <div key={comment._id || `fallback-${Math.random()}`}>
                  {renderComment(comment)}
                </div>
              ))}

            {/* Show more/less comments button */}
            {post.comments.filter(
              (comment) =>
                !comment.parentComment &&
                comment._id &&
                (!comment.isTemp || comment._id.startsWith("temp-"))
            ).length > visibleCommentCount && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={toggleShowAllComments}
                  className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  {showAllComments
                    ? "Show less comments"
                    : "Show more comments"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            No comments yet. Be the first to comment!
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default EnhancedCommentSystem;
