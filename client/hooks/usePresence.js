"use client";

import { useEffect, useRef } from "react";
import socket from "@/lib/socket";
import usePresenceStore from "@/store/presenceStore";

export default function usePresence() {
  const setPresence = usePresenceStore((s) => s.setPresence);
  const batchRef = useRef({});
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const flushBatch = () => {
      const batch = batchRef.current;
      batchRef.current = {};
      timerRef.current = null;
      const store = usePresenceStore.getState();
      const merged = { ...store.presence, ...batch };
      usePresenceStore.setState({ presence: merged });
    };

    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      batchRef.current[userId] = {
        isOnline,
        lastSeen: lastSeen ? new Date(lastSeen) : null,
      };
      if (!timerRef.current) {
        timerRef.current = requestAnimationFrame(flushBatch);
      }
    };

    const handleOnlineUsers = (list) => {
      const batch = {};
      list.forEach((id) => { batch[id] = { isOnline: true, lastSeen: null }; });
      batchRef.current = { ...batchRef.current, ...batch };
      if (!timerRef.current) {
        timerRef.current = requestAnimationFrame(flushBatch);
      }
    };

    socket.on("user_status", handleUserStatus);
    socket.on("online_users", handleOnlineUsers);

    return () => {
      socket.off("user_status", handleUserStatus);
      socket.off("online_users", handleOnlineUsers);
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [setPresence]);
}
