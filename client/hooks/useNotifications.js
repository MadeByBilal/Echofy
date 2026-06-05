"use client";

import { useEffect, useRef } from "react";
import socket from "@/lib/socket";
import useAuthStore from "@/store/authStore";

export default function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    const handleMessage = (message) => {
      const currentUser = userRef.current;
      if (!currentUser?._id) return;

      const senderId =
        typeof message.senderId === "object"
          ? message.senderId._id
          : message.senderId;

      if (senderId === currentUser._id) return;

      const path = window.location.pathname;
      if (path === `/chat/${senderId}`) return;

      const name = message.senderName || "Someone";
      const body =
        message.text ||
        (message.fileType === "image"
          ? "Sent an image"
          : message.fileUrl
            ? "Sent a file"
            : "New message");

      // ── Browser Notification (works when tab is in background) ──
      if (Notification.permission === "granted") {
        try {
          const notification = new Notification(name, {
            body,
            icon: "/favicon.ico",
          });
          notification.onclick = () => {
            window.focus();
            window.location.href = `/chat/${senderId}`;
          };
        } catch (e) {
          console.log("Notification error:", e);
        }
      }

      // ── In-app toast event (works on all pages, all devices) ──
      window.dispatchEvent(
        new CustomEvent("app:message", {
          detail: { name, body, senderId },
        }),
      );
    };

    socket.on("receive_message", handleMessage);
    return () => socket.off("receive_message", handleMessage);
  }, [user?._id]);
}
