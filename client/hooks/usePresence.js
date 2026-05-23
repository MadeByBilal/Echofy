"use client";

import { useEffect } from "react";
import socket from "@/lib/socket";
import usePresenceStore from "@/store/presenceStore";

export default function usePresence() {
  const setPresence = usePresenceStore((s) => s.setPresence);

  useEffect(() => {
    if (!socket) return;

    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      setPresence(userId, {
        isOnline,
        lastSeen: lastSeen ? new Date(lastSeen) : null,
      });
    };

    const handleOnlineUsers = (list) => {
      list.forEach((id) => setPresence(id, { isOnline: true, lastSeen: null }));
    };

    socket.on("user_status", handleUserStatus);
    socket.on("online_users", handleOnlineUsers);

    return () => {
      socket.off("user_status", handleUserStatus);
      socket.off("online_users", handleOnlineUsers);
    };
  }, [setPresence]);
}
