import { create } from "zustand";
import axiosInstance from "@/lib/axiosInstance";

const CACHE_TTL = 30000;

const useFriendStore = create((set, get) => ({
  friends: [],
  incomingRequests: [],
  lastFetched: 0,
  isRequestsLoading: false,

  fetchFriends: async (force = false) => {
    const state = get();
    if (!force && Date.now() - state.lastFetched < CACHE_TTL) return;

    try {
      const res = await axiosInstance.get("/friends");
      set({
        friends: res.data.friends || [],
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.log("Error fetching friends:", err);
    }
  },

  fetchIncomingRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ incomingRequests: res.data.requests || [] });
    } catch (err) {
      console.log("Error fetching requests:", err);
    }
  },

  removeIncomingRequest: (requestId) => {
    set((state) => ({
      incomingRequests: state.incomingRequests.filter((r) => r._id !== requestId),
    }));
  },
}));

export default useFriendStore;
