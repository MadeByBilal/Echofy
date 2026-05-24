import { create } from "zustand";
import axiosInstance from "@/lib/axiosInstance";
import socket from "@/lib/socket";

const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post("/auth/register", data);
      const user = res.data.user;

      // normalize backend id shape (some endpoints return `id` instead of `_id`)
      if (user && !user._id && user.id) user._id = user.id;

      socket.connect();
      socket.once("connect", () => {
        if (user && (user._id || user.id)) {
          socket.emit("user_online", user._id || user.id);
        }
      });

      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  login: async (data) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      const user = res.data.user;

      if (user && !user._id && user.id) user._id = user.id;

      socket.connect();
      socket.once("connect", () => {
        if (user && (user._id || user.id)) {
          socket.emit("user_online", user._id || user.id);
        }
      });

      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  getMe: async () => {
    try {
      const res = await axiosInstance.get("/auth/me");
      const user = res.data.user;

      if (user && !user._id && user.id) user._id = user.id;

      if (!socket.connected) {
        socket.connect();
        // ✅ wait for connection THEN emit
        socket.once("connect", () => {
          socket.emit("user_online", user._id);
        });
      } else {
        // already connected (edge case), just emit
        socket.emit("user_online", user._id);
      }

      set({ user });
    } catch (error) {
      set({ user: null });
      console.log(error);
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      socket.disconnect();
      set({ user: null });
    } catch (error) {
      socket.disconnect();
      set({ user: null });
      console.log(error);
    }
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
