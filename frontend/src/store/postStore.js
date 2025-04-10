import { create } from "zustand";
import config from "@/lib/config";
import userStore from "@/store/userStore";

const usePostStore = create((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },

  // Fetch all posts
  fetchPosts: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.medium,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      set({
        posts: data.data,
        pagination: data.pagination,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch feed posts
  fetchFeedPosts: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/feed/timeline?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.medium,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      set({
        posts: data.data,
        pagination: data.pagination,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Create a post
  createPost: async (postData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("content", postData.content);
      if (postData.privacy) formData.append("privacy", postData.privacy);
      if (postData.media) formData.append("media", postData.media);

      const response = await fetch(`${config.backendUrl}/api/posts`, {
        method: "POST",
        credentials: "include",
        body: formData,
        timeout: config.apiTimeouts.upload,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      set((state) => ({
        posts: [data.data, ...state.posts],
        loading: false,
      }));

      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Create a post with direct upload to Cloudinary
  createPostWithDirectUpload: async (postData) => {
    set({ loading: true, error: null });
    try {
      // First, get upload signature
      const publicId = `post_${Date.now()}`;
      const signatureResponse = await fetch(
        `${config.backendUrl}/api/posts/upload-signature`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publicId }),
          timeout: config.apiTimeouts.short,
        }
      );

      const signatureData = await signatureResponse.json();

      if (!signatureData.success) {
        throw new Error(signatureData.message);
      }

      // Upload to Cloudinary directly
      const formData = new FormData();
      formData.append("file", postData.media);
      formData.append("api_key", signatureData.data.apiKey);
      formData.append("timestamp", signatureData.data.timestamp);
      formData.append("signature", signatureData.data.signature);
      formData.append("public_id", publicId);
      formData.append("folder", "social-media-app/posts");

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.data.cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
          timeout: config.apiTimeouts.upload,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (cloudinaryData.error) {
        throw new Error(cloudinaryData.error.message);
      }

      // Create post with the uploaded media URL
      const postResponse = await fetch(`${config.backendUrl}/api/posts`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: postData.content,
          privacy: postData.privacy || "public",
          mediaUrl: cloudinaryData.secure_url,
          mediaType:
            cloudinaryData.resource_type === "image" ? "image" : "video",
        }),
        timeout: config.apiTimeouts.medium,
      });

      const postResponseData = await postResponse.json();

      if (!postResponseData.success) {
        throw new Error(postResponseData.message);
      }

      set((state) => ({
        posts: [postResponseData.data, ...state.posts],
        loading: false,
      }));

      return postResponseData.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Like a post
  likePost: async (postId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/like`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.short,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? { ...post, likeCount: post.likeCount + 1, isLiked: true }
            : post
        ),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Unlike a post
  unlikePost: async (postId) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/unlike`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.short,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? { ...post, likeCount: post.likeCount - 1, isLiked: false }
            : post
        ),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Update a post
  updatePost: async (postId, postData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${config.backendUrl}/api/posts/${postId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
        timeout: config.apiTimeouts.medium,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Update the post in the store
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? data.data : post
        ),
        loading: false,
      }));

      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId) => {
    try {
      const response = await fetch(`${config.backendUrl}/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: config.apiTimeouts.medium,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Get user posts
  getUserPosts: async (userId, page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/user/${userId}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      set({
        posts: data.data,
        pagination: data.pagination,
        loading: false,
      });

      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Add a post to the store
  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
    })),

  // Fetch video posts
  fetchVideoPosts: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      // Get current user for like status
      const currentUser = userStore.getState().user;

      // First, get all posts
      const response = await fetch(
        `${config.backendUrl}/api/posts?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.medium,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch video posts");
      }

      // Filter only video posts
      const videoPosts = data.data.filter((post) => post.mediaType === "video");

      // For each video post, fetch its full details including comments
      const detailedPosts = await Promise.all(
        videoPosts.map(async (post) => {
          try {
            // Fetch detailed post data including comments
            const detailResponse = await fetch(
              `${config.backendUrl}/api/posts/${post._id}`,
              {
                method: "GET",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                timeout: config.apiTimeouts.medium,
              }
            );

            const detailData = await detailResponse.json();

            if (!detailData.success) {
              console.warn(
                `Failed to fetch details for post ${post._id}:`,
                detailData.message
              );
              return get().processPost(post, currentUser);
            }

            return get().processPost(detailData.data, currentUser);
          } catch (error) {
            console.warn(`Error fetching details for post ${post._id}:`, error);
            return get().processPost(post, currentUser);
          }
        })
      );

      // Update all posts in the store
      set({
        posts: detailedPosts,
        pagination: data.pagination,
        loading: false,
      });

      return {
        posts: detailedPosts,
        pagination: {
          ...data.pagination,
          total: detailedPosts.length,
        },
      };
    } catch (error) {
      console.error("Error fetching video posts:", error);
      set({
        error: error.message || "Failed to fetch video posts",
        loading: false,
      });
      return {
        posts: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
        error: error.message || "Failed to fetch video posts",
      };
    } finally {
      set({ loading: false });
    }
  },

  // Helper function to process a post and add necessary fields
  processPost: (post, currentUser) => {
    // Ensure likes is always an array
    const likes = Array.isArray(post.likes) ? post.likes : [];

    // Ensure comments is always an array
    const comments = Array.isArray(post.comments) ? post.comments : [];

    // Check if the current user has liked this post
    let isLiked = false;

    if (currentUser && currentUser._id) {
      isLiked = likes.some((like) => {
        if (typeof like === "string") {
          return like === currentUser._id;
        } else if (like && typeof like === "object") {
          return like._id === currentUser._id;
        }
        return false;
      });
    }

    // Ensure counts match the arrays length
    const likeCount = Math.max(post.likeCount || 0, likes.length);
    const commentCount = Math.max(post.commentCount || 0, comments.length);
    const shareCount = post.shareCount || 0;

    return {
      ...post,
      likes,
      comments,
      likeCount,
      commentCount,
      shareCount,
      isLiked: !!isLiked,
    };
  },

  // Helper function to update a post in the store
  updatePostInStore: (updatedPost) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      ),
    }));
  },

  // Like a post
  likePost: async (postId) => {
    try {
      // Get current user
      const currentUser = userStore.getState().user;
      if (!currentUser || !currentUser._id) {
        throw new Error("User not authenticated");
      }

      // Find the post in our store
      const state = get();
      const existingPost = state.posts.find((p) => p._id === postId);

      if (!existingPost) {
        console.warn(`Post ${postId} not found in store, fetching from API`);
        // If post not in store, fetch it first
        try {
          const response = await fetch(
            `${config.backendUrl}/api/posts/${postId}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              timeout: config.apiTimeouts.medium,
            }
          );

          const data = await response.json();
          if (data.success) {
            const processedPost = get().processPost(data.data, currentUser);
            set((state) => ({
              posts: [...state.posts, processedPost],
            }));
          }
        } catch (error) {
          console.error(`Error fetching post ${postId}:`, error);
        }
      }

      // Check if already liked in our local state
      let alreadyLiked = false;

      if (existingPost) {
        // Ensure likes is always an array
        const likes = Array.isArray(existingPost.likes)
          ? existingPost.likes
          : [];

        // Check if user ID is in likes array (could be string ID or object with _id)
        alreadyLiked = likes.some((like) =>
          typeof like === "string"
            ? like === currentUser._id
            : like._id === currentUser._id
        );
      }

      // If already liked, update the store to ensure consistency and return success
      if (alreadyLiked) {
        // Update the store to ensure the post is marked as liked
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post._id === postId) {
              // Make sure likes includes the current user
              const updatedLikes = Array.isArray(post.likes)
                ? [...post.likes]
                : [];

              // Only add if not already in the array
              const userIdExists = updatedLikes.some((like) =>
                typeof like === "string"
                  ? like === currentUser._id
                  : like._id === currentUser._id
              );

              if (!userIdExists) {
                updatedLikes.push(currentUser._id);
              }

              return {
                ...post,
                likes: updatedLikes,
                likeCount: Math.max(post.likeCount || 0, updatedLikes.length),
                isLiked: true,
              };
            }
            return post;
          }),
        }));

        return {
          success: true,
          message: "Post already liked",
          alreadyLiked: true,
        };
      }

      // Make the API call to like the post
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/like`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.short,
        }
      );

      const data = await response.json();

      // If the post is already liked according to the backend
      if (!data.success && data.message === "Post already liked") {
        // Update our local state to match the backend
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post._id === postId) {
              // Make sure the post is marked as liked
              const updatedLikes = post.likes || [];
              if (!updatedLikes.includes(currentUser._id)) {
                updatedLikes.push(currentUser._id);
              }

              return {
                ...post,
                likes: updatedLikes,
                likeCount: Math.max(post.likeCount || 0, updatedLikes.length),
              };
            }
            return post;
          }),
        }));

        return {
          success: true,
          message: "Post already liked",
          alreadyLiked: true,
        };
      }

      // If there was some other error
      if (!data.success) {
        throw new Error(data.message || "Failed to like post");
      }

      // After successful like, fetch the updated post to ensure we have the correct state
      try {
        const detailResponse = await fetch(
          `${config.backendUrl}/api/posts/${postId}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            timeout: config.apiTimeouts.medium,
          }
        );

        const detailData = await detailResponse.json();

        if (detailData.success) {
          // Process the updated post
          const processedPost = get().processPost(detailData.data, currentUser);

          // Update the post in the store
          set((state) => ({
            posts: state.posts.map((post) =>
              post._id === postId ? processedPost : post
            ),
          }));

          // Return early since we've updated the store with the latest data
          return {
            success: true,
            message: "Post liked successfully",
            alreadyLiked: false,
            post: processedPost,
          };
        }
      } catch (error) {
        console.warn(
          `Error fetching updated post after like: ${error.message}`
        );
        // Continue with the fallback update below if fetching the updated post fails
      }

      // Fallback: Update our local state if fetching the updated post failed
      set((state) => ({
        posts: state.posts.map((post) => {
          if (post._id === postId) {
            // Create a new likes array with the current user added
            const updatedLikes = Array.isArray(post.likes)
              ? [...post.likes]
              : [];

            // Only add if not already in the array
            const userIdExists = updatedLikes.some((like) =>
              typeof like === "string"
                ? like === currentUser._id
                : like._id === currentUser._id
            );

            if (!userIdExists) {
              updatedLikes.push(currentUser._id);
            }

            return {
              ...post,
              likes: updatedLikes,
              likeCount: Math.max(
                (post.likeCount || 0) + 1,
                updatedLikes.length
              ),
              isLiked: true,
            };
          }
          return post;
        }),
      }));

      return {
        success: true,
        message: "Post liked successfully",
        alreadyLiked: false,
      };
    } catch (error) {
      console.error("Error liking post:", error);
      return {
        success: false,
        message: error.message || "Failed to like post",
        error,
      };
    }
  },

  // Unlike a post
  unlikePost: async (postId) => {
    try {
      // Get current user
      const currentUser = userStore.getState().user;
      if (!currentUser || !currentUser._id) {
        throw new Error("User not authenticated");
      }

      // Find the post in our store
      const state = get();
      const existingPost = state.posts.find((p) => p._id === postId);

      if (!existingPost) {
        console.warn(`Post ${postId} not found in store, fetching from API`);
        // If post not in store, fetch it first
        try {
          const response = await fetch(
            `${config.backendUrl}/api/posts/${postId}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              timeout: config.apiTimeouts.medium,
            }
          );

          const data = await response.json();
          if (data.success) {
            const processedPost = get().processPost(data.data, currentUser);
            set((state) => ({
              posts: [...state.posts, processedPost],
            }));
          }
        } catch (error) {
          console.error(`Error fetching post ${postId}:`, error);
        }
      }

      // Check if already unliked in our local state
      let alreadyUnliked = true; // Default to true if post not found

      if (existingPost) {
        // Ensure likes is always an array
        const likes = Array.isArray(existingPost.likes)
          ? existingPost.likes
          : [];

        // Check if user ID is NOT in likes array (could be string ID or object with _id)
        const isLiked = likes.some((like) =>
          typeof like === "string"
            ? like === currentUser._id
            : like._id === currentUser._id
        );

        alreadyUnliked = !isLiked;
      }

      // If already unliked, update the store to ensure consistency and return success
      if (alreadyUnliked) {
        // Update the store to ensure the post is marked as unliked
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post._id === postId) {
              // Make sure likes doesn't include the current user
              const updatedLikes = Array.isArray(post.likes)
                ? post.likes.filter((like) => {
                    if (typeof like === "string") {
                      return like !== currentUser._id;
                    } else {
                      return like._id !== currentUser._id;
                    }
                  })
                : [];

              return {
                ...post,
                likes: updatedLikes,
                likeCount: Math.max(0, updatedLikes.length),
                isLiked: false,
              };
            }
            return post;
          }),
        }));

        return {
          success: true,
          message: "Post already unliked",
          alreadyUnliked: true,
        };
      }

      // Make the API call to unlike the post
      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/unlike`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.short,
        }
      );

      const data = await response.json();

      // If the post is already unliked according to the backend
      if (
        !data.success &&
        (data.message === "Post not liked" ||
          data.message === "Post not liked yet")
      ) {
        // Update our local state to match the backend
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post._id === postId) {
              // Make sure the post is marked as unliked
              const updatedLikes = (post.likes || []).filter(
                (id) => id !== currentUser._id
              );

              return {
                ...post,
                likes: updatedLikes,
                likeCount: Math.max(0, post.likeCount || updatedLikes.length),
              };
            }
            return post;
          }),
        }));

        return {
          success: true,
          message: "Post already unliked",
          alreadyUnliked: true,
        };
      }

      // If there was some other error
      if (!data.success) {
        throw new Error(data.message || "Failed to unlike post");
      }

      // Success! Update our local state
      set((state) => ({
        posts: state.posts.map((post) => {
          if (post._id === postId) {
            // Create a new likes array with the current user removed
            const updatedLikes = Array.isArray(post.likes)
              ? post.likes.filter((like) => {
                  if (typeof like === "string") {
                    return like !== currentUser._id;
                  } else {
                    return like._id !== currentUser._id;
                  }
                })
              : [];

            return {
              ...post,
              likes: updatedLikes,
              likeCount: Math.max(0, (post.likeCount || 1) - 1),
              isLiked: false,
            };
          }
          return post;
        }),
      }));

      return {
        success: true,
        message: "Post unliked successfully",
        alreadyUnliked: false,
      };
    } catch (error) {
      console.error("Error unliking post:", error);
      return {
        success: false,
        message: error.message || "Failed to unlike post",
        error,
      };
    }
  },

  // Add a comment to a post
  addComment: async (postId, text) => {
    try {
      // Get current user for comment attribution
      const currentUser = userStore.getState().user;
      if (!currentUser || !currentUser._id) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/comment`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
          timeout: config.apiTimeouts.medium,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to add comment");
      }

      // Update the post in the store
      set((state) => {
        const newPosts = state.posts.map((post) => {
          if (post._id === postId) {
            // Create a new comments array with the new comment added
            const updatedComments = Array.isArray(post.comments)
              ? [data.data, ...post.comments]
              : [data.data];

            // Update comment count
            const updatedCommentCount = (post.commentCount || 0) + 1;

            return {
              ...post,
              comments: updatedComments,
              commentCount: updatedCommentCount,
            };
          }
          return post;
        });

        return { posts: newPosts };
      });

      // After adding a comment, fetch the updated post to ensure we have all comments
      try {
        const detailResponse = await fetch(
          `${config.backendUrl}/api/posts/${postId}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            timeout: config.apiTimeouts.medium,
          }
        );

        const detailData = await detailResponse.json();

        if (detailData.success) {
          const currentUser = userStore.getState().user;
          const processedPost = get().processPost(detailData.data, currentUser);

          // Update the post in the store with the latest data
          set((state) => ({
            posts: state.posts.map((post) =>
              post._id === postId ? processedPost : post
            ),
          }));
        }
      } catch (error) {
        console.warn(
          `Error fetching updated post after comment: ${error.message}`
        );
        // Continue even if this fails, as we've already updated the store with the new comment
      }

      return data.data;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  // Update a post in the store
  updatePostInStore: (updatedPost) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      ),
    })),

  // Share a post
  sharePost: async (postId) => {
    try {
      // Get current user for share attribution
      const currentUser = userStore.getState().user;
      if (!currentUser || !currentUser._id) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `${config.backendUrl}/api/posts/${postId}/share`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.apiTimeouts.short,
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to share post");
      }

      // Update the post in the store with the new share count
      set((state) => {
        const newPosts = state.posts.map((post) => {
          if (post._id === postId) {
            // Get the updated share count from the response
            const updatedShareCount =
              data.data.shareCount || (post.shareCount || 0) + 1;

            return {
              ...post,
              shareCount: updatedShareCount,
            };
          }
          return post;
        });

        return { posts: newPosts };
      });

      // After sharing, fetch the updated post to ensure we have the latest data
      try {
        const detailResponse = await fetch(
          `${config.backendUrl}/api/posts/${postId}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            timeout: config.apiTimeouts.medium,
          }
        );

        const detailData = await detailResponse.json();

        if (detailData.success) {
          const currentUser = userStore.getState().user;
          const processedPost = get().processPost(detailData.data, currentUser);

          // Update the post in the store with the latest data
          set((state) => ({
            posts: state.posts.map((post) =>
              post._id === postId ? processedPost : post
            ),
          }));
        }
      } catch (error) {
        console.warn(
          `Error fetching updated post after share: ${error.message}`
        );
        // Continue even if this fails, as we've already updated the store with the new share count
      }

      return {
        success: true,
        message: "Post shared successfully",
        data: data.data,
      };
    } catch (error) {
      console.error("Error sharing post:", error);
      return {
        success: false,
        message: error.message || "Failed to share post",
        error,
      };
    }
  },

  // Clear posts
  clearPosts: () => {
    set({
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
    });
  },
}));

export default usePostStore;
