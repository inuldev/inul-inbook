import { create } from "zustand";

const useCommentStore = create((set, get) => ({
  // State
  activeCommentPostId: null,
  showComments: false,

  // Actions
  setActiveCommentPostId: (postId) => {
    set({ activeCommentPostId: postId, showComments: true });
  },

  hideComments: () => {
    set({ showComments: false });
  },

  toggleComments: (postId) => {
    const state = get();

    if (state.activeCommentPostId === postId && state.showComments) {
      // If already showing comments for this post, hide them
      set({ showComments: false });
    } else {
      // Otherwise, show comments for this post
      set({ activeCommentPostId: postId, showComments: true });
    }
  },

  // Debug function
  getState: () => {
    const state = get();
    console.log("Current comment store state:", state);
    return state;
  },
}));

export default useCommentStore;
