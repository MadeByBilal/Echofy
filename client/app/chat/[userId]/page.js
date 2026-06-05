"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import useAuthStore from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import socket from "@/lib/socket";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}

function ChatContent() {
  const { userId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

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
      if (message.senderId !== user?._id) {
        socket.emit("messages_seen", {
          senderId: message.senderId,
          receiverId: user._id,
        });
      }
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
    if ((!text.trim() && !selectedFile) || isSending || isUploading) return;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const fileData = new FormData();
        fileData.append("file", selectedFile);
        const uploadRes = await axiosInstance.post("/messages/upload", fileData);
        const { url, fileType, fileName, fileSize } = uploadRes.data;

        const payload = {
          receiverId: userId,
          text: text.trim(),
          fileUrl: url,
          fileType,
          fileName,
          fileSize,
          ...(replyTo && { replyTo: replyTo._id }),
        };

        setIsSending(true);
        const res = await axiosInstance.post("/messages/send", payload);
        const sentMessage = res.data.message;
        if (replyTo) sentMessage.replyTo = replyTo;

        setMessages((prev) => [...prev, sentMessage]);
        setText("");
        setSelectedFile(null);
        setReplyTo(null);
      } catch (err) {
        const msg = err.response?.data?.message || "File upload failed";
        alert(msg);
      } finally {
        setIsSending(false);
        setIsUploading(false);
      }
      return;
    }

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
  const handleFileSelect = (file) => setSelectedFile(file);
  const handleFileClear = () => setSelectedFile(null);

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
      isSending={isSending || isUploading}
      bottomRef={bottomRef}
      selectedFile={selectedFile}
      isUploading={isUploading}
      onTextChange={handleTextChange}
      onSend={handleSend}
      onKeyDown={handleKeyDown}
      onReply={handleReply}
      onCancelReply={cancelReply}
      onFileSelect={handleFileSelect}
      onFileClear={handleFileClear}
      onBack={() => router.push("/chat")}
    />
  );
}
