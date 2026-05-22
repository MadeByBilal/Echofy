"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import useAuthStore from "@/store/authStore";
import socket from "@/lib/socket";
import ChatWindow from "@/components/chat/ChatWindow";
import "../chat.css";

export default function ChatPage() {
  const { userId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    const fetchFriend = async () => {
      try {
        const res = await axiosInstance.get("/friends");
        setFriend(res.data.friends.find((f) => f._id === userId));
      } catch (err) {
        console.log("Error fetching friend:", err);
      }
    };

    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get(`/messages/${userId}`);
        setMessages(res.data.messages || []);

        if (user?._id) {
          socket.emit("messages_seen", {
            senderId: userId,
            receiverId: user._id,
          });
        }
      } catch (err) {
        console.log("Error fetching messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchFriend();
      fetchMessages();
    }
  }, [userId, user?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user?._id) return;

    socket.emit("user_online", user._id);

    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("messages_delivered", ({ messageIds }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds?.includes(msg._id)
            ? { ...msg, status: "delivered" }
            : msg,
        ),
      );
    });

    socket.on("messages_seen", ({ senderId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === senderId ? { ...msg, status: "seen" } : msg,
        ),
      );
    });

    return () => {
      socket.off("receive_message");
      socket.off("messages_delivered");
      socket.off("messages_seen");
    };
  }, [user?._id]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);

    try {
      const payload = {
        receiverId: userId,
        text: trimmed,
        ...(replyTo && { replyTo: replyTo._id }),
      };

      const res = await axiosInstance.post("/messages/send", payload);
      const sentMessage = res.data.message;

      if (replyTo) sentMessage.replyTo = replyTo;

      setMessages((prev) => [...prev, sentMessage]);
      setText("");
      setReplyTo(null);
    } catch (err) {
      console.log("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (message) => setReplyTo(message);
  const cancelReply = () => setReplyTo(null);
  const handleTextChange = (value) => setText(value);

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    handleSend();
  };

  return (
    <ChatWindow
      friend={friend}
      user={user}
      messages={messages}
      isLoading={isLoading}
      text={text}
      replyTo={replyTo}
      isSending={isSending}
      bottomRef={bottomRef}
      onTextChange={handleTextChange}
      onSend={handleSend}
      onKeyDown={handleKeyDown}
      onReply={handleReply}
      onCancelReply={cancelReply}
      onBack={() => router.push("/chat")}
    />
  );
}
