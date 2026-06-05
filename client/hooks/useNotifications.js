"use client";

import { useEffect } from "react";
import socket from "@/lib/socket";
import useAuthStore from "@/store/authStore";

export default function useNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    const handleMessage = (message) => {
      if (Notification.permission !== "granted") return;

      const senderId =
        typeof message.senderId === "object"
          ? message.senderId._id
          : message.senderId;

      if (senderId === user._id) return;

      const path = window.location.pathname;
      if (path === `/chat/${senderId}`) return;

      const name = message.senderName || "Someone";
      const body =
        message.text ||
        (message.fileType === "image"
          ? "Sent an image"
          : message.fileUrl
            ? "Sent a file"
            : "");

      if (!body && !name) return;

      const notification = new Notification(name, {
        body: body || "New message",
        icon: "/favicon.ico",
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = `/chat/${senderId}`;
      };
    };

    socket.on("receive_message", handleMessage);
    return () => socket.off("receive_message", handleMessage);
  }, [user?._id]);
}
