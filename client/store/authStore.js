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
      set({ user: res.data.user, isLoading: false });
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

      // connect socket immediately after login
      socket.connect();
      socket.emit("user_online", user._id);

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

      // reconnect socket on page refresh
      if (!socket.connected) {
        socket.connect();
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
}));

export default useAuthStore;
