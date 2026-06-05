"use client";

import { useEffect, useRef } from "react";
import socket from "@/lib/socket";
import useAuthStore from "@/store/authStore";
import axiosInstance from "@/lib/axiosInstance";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const userRef = useRef(user);
  userRef.current = user;

  // ── Request Notification permission ──
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Register Service Worker + Subscribe to Push ──
  useEffect(() => {
    if (!user?._id) return;
    if (!("serviceWorker" in navigator)) return;
    if (!VAPID_PUBLIC_KEY) return;

    let cancelled = false;
    let sub = null;

    const setup = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        if (cancelled) return;
        if (Notification.permission !== "granted") return;

        // Check if already subscribed
        const existingSub = await registration.pushManager.getSubscription();

        if (existingSub) {
          // Keep it — already subscribed in this browser
          return;
        }

        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        await axiosInstance.post("/notifications/subscribe", sub.toJSON());
      } catch (e) {
        console.log("Push setup error:", e);
      }
    };

    setup();

    return () => {
      cancelled = true;
      // Don't unsubscribe on unmount — keep subscription across page navigations
    };
  }, [user?._id]);

  // ── Listen for socket messages → in-app toast ──
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

      // In-app toast
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
