"use client";

/**
 * EnhancedCommentSystem Component
 *
 * A comprehensive component for displaying and interacting with comments on posts.
 * Features include:
 * - Adding comments
 * - Liking comments
 * - Editing comments
 * - Deleting comments
 * - Replying to comments
 * - Hierarchical display of comment replies
 */

import React, { useState, useRef, useEffect } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  const [commentLikeCounts, setCommentLikeCounts] = useState({});
  
  const commentInputRef = useRef(null);
  const replyInputRef = useRef(null);
  const editInputRef = useRef(null);

  // Focus input when component mounts
  useEffect(() => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, []);
  
  // Initialize comment likes state
  useEffect(() => {
    if (post?.comments?.length > 0) {
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
  }, [post?.comments, user?._id]);

  // Handle comment submission
  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      // Use the standardized helper function
      await addPostComment(
        post._id,
        commentText,
        setCommentText,
        (count) => {
          if (onCommentAdded) onCommentAdded(count);
        },
        setIsSubmitting
      );
      
      // Clear input after submission
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
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
      // Call the API
      await toggleCommentLike(
        commentId,
        isLiked,
        (newLikedState) => {
          setCommentLikes((prev) => ({
            ...prev,
            [commentId]: newLikedState,
          }));
        },
        (newCount) => {
          setCommentLikeCounts((prev) => ({
            ...prev,
            [commentId]: newCount,
          }));
        }
      );
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
  const handleSaveEdit = async (commentId) => {
    if (!editText.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      await updateComment(commentId, post._id, editText, () => {
        // Reset editing state
        setEditingComment(null);
        setEditText("");
      });
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText("");
  };
  
  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId, post._id, () => {
        // Comment deletion is handled by the post store
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
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
  const handleSaveReply = async (commentId) => {
    if (!replyText.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      await replyToComment(commentId, post._id, replyText, () => {
        // Reset replying state
        setReplyingTo(null);
        setReplyText("");
        
        // Expand replies for this comment
        setExpandedReplies((prev) => ({
          ...prev,
          [commentId]: true,
        }));
      });
    } catch (error) {
      console.error("Error replying to comment:", error);
    } finally {
      setIsSubmitting(false);
    }
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
  };

  // Render a single comment
  const renderComment = (comment, isReply = false) => {
    const isLiked = commentLikes[comment._id] || false;
    const likeCount = commentLikeCounts[comment._id] || 0;
    const isExpanded = expandedReplies[comment._id] || false;
    const hasReplies = comment.replies && comment.replies.length > 0;
    
    return (
      <div key={comment._id} className={`flex items-start space-x-2 ${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment?.user?.profilePicture} />
          <AvatarFallback className="dark:bg-gray-400">
            {comment?.user?.username?.substring(0, 2).toUpperCase() || "??"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          {/* Comment content */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-sm">
                    {comment?.user?.username || "Unknown User"}
                  </p>
                  
                  {/* Edit/Delete dropdown for own comments */}
                  {user?._id === comment?.user?._id && editingComment !== comment._id && (
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
                          onClick={() => handleEditComment(comment._id, comment.text)}
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
                        disabled={isSubmitting}
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
                        disabled={!editText.trim() || isSubmitting}
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
                  <p className="text-sm">{comment.text}</p>
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
              className={`h-6 px-2 ${isLiked ? 'text-blue-500 dark:text-blue-400' : ''}`}
              onClick={() => handleLikeComment(comment._id)}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              {likeCount > 0 && <span>{likeCount}</span>}
            </Button>
            
            {/* Reply button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => handleReplyToComment(comment._id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
            
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
                    Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
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
                  disabled={isSubmitting}
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
                  disabled={!replyText.trim() || isSubmitting}
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
              {comment.replies.map(reply => renderComment(reply, true))}
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
            disabled={isSubmitting}
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
            disabled={!commentText.trim() || isSubmitting}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <ScrollArea className="h-[300px] w-full rounded-md border p-4">
        {post?.comments && post.comments.length > 0 ? (
          <div className="space-y-4">
            {post.comments
              .filter(comment => !comment.parentComment) // Only show top-level comments
              .map(comment => renderComment(comment))}
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
