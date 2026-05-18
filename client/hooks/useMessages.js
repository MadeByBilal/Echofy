"use client";

import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

export default function useMessages(friendId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMessages = useCallback(async () => {
    if (!friendId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.get(`/messages/${friendId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch messages.");
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  const sendMessage = useCallback(
    async (text) => {
      if (!friendId || !text?.trim()) return false;

      try {
        const res = await axiosInstance.post("/messages/send", {
          receiverId: friendId,
          text: text.trim(),
        });
        return res.data.message;
      } catch (err) {
        setError(err.response?.data?.message || "Unable to send message.");
        return false;
      }
    },
    [friendId],
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    setMessages,
    loading,
    error,
    sendMessage,
    refresh: fetchMessages,
  };
}
