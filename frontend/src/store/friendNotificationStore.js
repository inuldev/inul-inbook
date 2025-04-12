import { create } from "zustand";
import { getFriendRequests } from "@/service/friends.service";

const useFriendNotificationStore = create((set, get) => ({
  pendingRequestsCount: 0,
  loading: false,
  error: null,
  
  // Fetch the count of pending friend requests
  fetchPendingRequestsCount: async () => {
    set({ loading: true, error: null });
    try {
      const requests = await getFriendRequests();
      set({ 
        pendingRequestsCount: requests.length,
        loading: false 
      });
      return requests.length;
    } catch (error) {
      console.error("Error fetching pending friend requests count:", error);
      set({ 
        error: error.message,
        loading: false 
      });
      return 0;
    }
  },
  
  // Reset the count (useful after viewing requests)
  resetCount: () => set({ pendingRequestsCount: 0 }),
  
  // Manually set the count (useful when a new request comes in)
  setCount: (count) => set({ pendingRequestsCount: count }),
  
  // Increment the count (useful when a new request notification is received)
  incrementCount: () => set((state) => ({ 
    pendingRequestsCount: state.pendingRequestsCount + 1 
  })),
  
  // Decrement the count (useful when a request is accepted/declined)
  decrementCount: () => set((state) => ({ 
    pendingRequestsCount: Math.max(0, state.pendingRequestsCount - 1) 
  })),
}));

export default useFriendNotificationStore;
