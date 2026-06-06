import { create } from "zustand";
import axiosInstance from "@/lib/axiosInstance";

const CACHE_TTL = 30000;

const useChatStore = create((set, get) => ({
  friends: [],
  groups: [],
  lastFetched: 0,
  isLoading: false,

  fetchChatList: async (force = false) => {
    const state = get();
    if (!force && Date.now() - state.lastFetched < CACHE_TTL && !state.isLoading) return;

    set({ isLoading: true });
    try {
      const [fRes, gRes] = await Promise.all([
        axiosInstance.get("/friends"),
        axiosInstance.get("/groups/my"),
      ]);
      set({
        friends: fRes.data.friends || [],
        groups: gRes.data.groups || [],
        lastFetched: Date.now(),
        isLoading: false,
      });
    } catch (err) {
      console.log(err);
      set({ isLoading: false });
    }
  },

  updateFriendLastMessage: (friendId, message) => {
    set((state) => {
      const idx = state.friends.findIndex(
        (f) => (f._id?.toString?.() || f._id) === friendId
      );
      if (idx === -1) return state;
      const updated = [...state.friends];
      updated[idx] = { ...updated[idx], lastMessage: message };
      return { friends: updated };
    });
  },

  updateFriendFromChat: (friend) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        (f._id?.toString?.() || f._id) === (friend._id?.toString?.() || friend._id) ? friend : f
      ),
    }));
  },
}));

export default useChatStore;
