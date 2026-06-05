"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import useAuthStore from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import socket from "@/lib/socket";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return <ProtectedRoute><ChatContent /></ProtectedRoute>;
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
  const [isTyping, setIsTyping] = useState(false);
  const [editingText, setEditingText] = useState(null);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // ─── FETCH FRIEND + MESSAGES ─────────────────────────────────
  useEffect(() => {
    const fetchFriend = async () => {
      try {
        const res = await axiosInstance.get("/friends");
        setFriend(res.data.friends.find((f) => f._id === userId));
      } catch (err) { console.log(err); }
    };
    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get(`/messages/${userId}`);
        setMessages((res.data.messages || []).filter((m) => !m.isDeleted));
        if (user?._id) socket.emit("messages_seen", { senderId: userId, receiverId: user._id });
      } catch (err) { console.log(err); }
      finally { setIsLoading(false); }
    };
    if (userId) { fetchFriend(); fetchMessages(); }
  }, [userId, user?._id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ─── SOCKET EVENTS ───────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;
    socket.emit("user_online", user._id);

    const onMsg = (message) => {
      if (message.isDeleted) return;
      setMessages((prev) => [...prev, message]);
      if (message.senderId !== user?._id) {
        socket.emit("messages_seen", { senderId: message.senderId, receiverId: user._id });
      }
    };

    const onDelivered = ({ messageIds }) => setMessages((prev) => prev.map((m) => messageIds?.includes(m._id) ? { ...m, status: "delivered" } : m));
    const onSeen = ({ senderId }) => setMessages((prev) => prev.map((m) => m.senderId === senderId ? { ...m, status: "seen" } : m));
    const onDeleted = ({ messageId }) => setMessages((prev) => prev.filter((m) => m._id !== messageId));
    const onEdited = ({ messageId, text: newText, isEdited }) => setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, text: newText, isEdited } : m));
    const onReaction = ({ messageId, reactions }) => setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, reactions } : m));
    const onTyping = ({ senderId: sid }) => { if (sid === userId) setIsTyping(true); };
    const onStopTyping = ({ senderId: sid }) => { if (sid === userId) setIsTyping(false); };

    socket.on("receive_message", onMsg);
    socket.on("messages_delivered", onDelivered);
    socket.on("messages_seen", onSeen);
    socket.on("message_deleted", onDeleted);
    socket.on("message_edited", onEdited);
    socket.on("reaction_updated", onReaction);
    socket.on("typing", onTyping);
    socket.on("stop_typing", onStopTyping);

    return () => {
      socket.off("receive_message", onMsg);
      socket.off("messages_delivered", onDelivered);
      socket.off("messages_seen", onSeen);
      socket.off("message_deleted", onDeleted);
      socket.off("message_edited", onEdited);
      socket.off("reaction_updated", onReaction);
      socket.off("typing", onTyping);
      socket.off("stop_typing", onStopTyping);
    };
  }, [user?._id, userId]);

  // ─── HANDLERS ────────────────────────────────────────────────

  const handleTyping = useCallback(() => {
    socket.emit("typing", { receiverId: userId, senderId: user?._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { receiverId: userId, senderId: user?._id });
    }, 1500);
  }, [userId, user?._id]);

  const handleReact = useCallback(async (message, emoji) => {
    socket.emit("message_reaction", { messageId: message._id, emoji, userId: user?._id, action: "add" });
  }, [user?._id]);

  const handleEdit = useCallback((message) => {
    setEditingText({ _id: message._id, text: message.text });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingText?.text?.trim()) return;
    try {
      await axiosInstance.patch("/messages/edit", { messageId: editingText._id, text: editingText.text.trim() });
      setEditingText(null);
    } catch (err) { console.log(err); }
  }, [editingText]);

  const handleCancelEdit = useCallback(() => setEditingText(null), []);

  const handleDelete = useCallback(async (messageId) => {
    try {
      await axiosInstance.delete("/messages/delete", { data: { messageId } });
    } catch (err) { console.log(err); }
  }, []);

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || isSending || isUploading) return;
    clearTimeout(typingTimeout.current);
    socket.emit("stop_typing", { receiverId: userId, senderId: user?._id });

    if (selectedFile) {
      setIsUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", selectedFile);
        const up = await axiosInstance.post("/messages/upload", fd);
        const { url, fileType, fileName, fileSize } = up.data;
        const payload = { receiverId: userId, text: text.trim(), fileUrl: url, fileType, fileName, fileSize, ...(replyTo && { replyTo: replyTo._id }) };
        setIsSending(true);
        const res = await axiosInstance.post("/messages/send", payload);
        const m = res.data.message;
        if (replyTo) m.replyTo = replyTo;
        setMessages((prev) => [...prev, m]);
        setText(""); setSelectedFile(null); setReplyTo(null);
      } catch (err) { console.log(err); }
      finally { setIsSending(false); setIsUploading(false); }
      return;
    }

    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      const payload = { receiverId: userId, text: trimmed, ...(replyTo && { replyTo: replyTo._id }) };
      const res = await axiosInstance.post("/messages/send", payload);
      const m = res.data.message;
      if (replyTo) m.replyTo = replyTo;
      setMessages((prev) => [...prev, m]);
      setText(""); setReplyTo(null);
    } catch (err) { console.log(err); }
    finally { setIsSending(false); }
  };

  return (
    <ChatWindow
      friend={friend} user={user} messages={messages} isLoading={isLoading}
      text={text} replyTo={replyTo} isSending={isSending || isUploading}
      bottomRef={bottomRef} selectedFile={selectedFile} isUploading={isUploading}
      isTyping={isTyping}
      onTextChange={setText} onSend={handleSend}
      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
      onReply={setReplyTo} onCancelReply={() => setReplyTo(null)}
      onFileSelect={setSelectedFile} onFileClear={() => setSelectedFile(null)}
      onReact={handleReact} onEdit={handleEdit} onDelete={handleDelete}
      editingText={editingText} setEditingText={setEditingText}
      onSaveEdit={handleSaveEdit} onCancelEdit={handleCancelEdit}
      onTyping={handleTyping}
      onBack={() => router.push("/chat")}
      friendId={userId}
    />
  );
}
