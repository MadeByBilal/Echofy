"use client";

import { useEffect } from "react";
import socket from "@/lib/socket";
import useAuthStore from "@/store/authStore";

export default function useSocket(onReceive) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("user_online", user.id);

    const handleReceive = (message) => {
      if (typeof onReceive === "function") {
        onReceive(message);
      }
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.disconnect();
    };
  }, [user, onReceive]);
}
