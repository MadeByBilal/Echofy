"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import useAuthStore from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import socket from "@/lib/socket";
import MaterialIcon from "@/components/ui/MaterialIcon";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import { formatLastSeen, formatDateSeparator, groupMessagesWithDates, formatMessageTime } from "@/lib/formatTime";

export default function GroupChatPage() {
  return <ProtectedRoute><GroupChatContent /></ProtectedRoute>;
}

function GroupChatContent() {
  const { groupId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [gRes, mRes] = await Promise.all([
          axiosInstance.get(`/groups/${groupId}`),
          axiosInstance.get(`/groups/${groupId}/messages`),
        ]);
        setGroup(gRes.data.group);
        setMessages((mRes.data.messages || []).filter((m) => !m.isDeleted));
      } catch (err) { console.log(err); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [groupId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!user?._id) return;

    const onMsg = (message) => {
      if (message.isDeleted || message.groupId !== groupId) return;
      setMessages((prev) => [...prev, message]);
    };
    const onDeleted = ({ messageId }) => setMessages((prev) => prev.filter((m) => m._id !== messageId));
    const onEdited = ({ messageId: mid, text: t, isEdited }) => setMessages((prev) => prev.map((m) => m._id === mid ? { ...m, text: t, isEdited } : m));
    const onReaction = ({ messageId: mid, reactions }) => setMessages((prev) => prev.map((m) => m._id === mid ? { ...m, reactions } : m));

    socket.on("receive_message", onMsg);
    socket.on("message_deleted", onDeleted);
    socket.on("message_edited", onEdited);
    socket.on("reaction_updated", onReaction);

    return () => {
      socket.off("receive_message", onMsg);
      socket.off("message_deleted", onDeleted);
      socket.off("message_edited", onEdited);
      socket.off("reaction_updated", onReaction);
    };
  }, [user?._id, groupId]);

  const isOwnMessage = (senderId) => senderId === user?._id || senderId?._id === user?._id;
  const getSenderName = (msg) => {
    if (typeof msg.senderId === "object" && msg.senderId) return msg.senderId.name || msg.senderId.username || "Someone";
    return msg.senderName || "Someone";
  };

  const handleReact = useCallback((message, emoji) => {
    socket.emit("message_reaction", { messageId: message._id, emoji, userId: user?._id, action: "add" });
  }, [user?._id]);

  const handleDelete = useCallback(async (messageId) => {
    try { await axiosInstance.delete("/messages/delete", { data: { messageId } }); } catch (e) { console.log(e); }
  }, []);

  const handleEdit = useCallback((message) => setEditingText({ _id: message._id, text: message.text }), []);
  const handleSaveEdit = useCallback(async () => {
    if (!editingText?.text?.trim()) return;
    try { await axiosInstance.patch("/messages/edit", { messageId: editingText._id, text: editingText.text.trim() }); setEditingText(null); } catch (e) { console.log(e); }
  }, [editingText]);
  const handleCancelEdit = useCallback(() => setEditingText(null), []);

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || isSending || isUploading) return;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const fd = new FormData(); fd.append("file", selectedFile);
        const up = await axiosInstance.post("/messages/upload", fd);
        const { url, fileType, fileName, fileSize } = up.data;
        const payload = { groupId, text: text.trim(), fileUrl: url, fileType, fileName, fileSize, ...(replyTo && { replyTo: replyTo._id }) };
        setIsSending(true);
        const res = await axiosInstance.post("/messages/send", payload);
        const m = res.data.message; if (replyTo) m.replyTo = replyTo;
        setMessages((prev) => [...prev, m]); setText(""); setSelectedFile(null); setReplyTo(null);
      } catch (err) { console.log(err); }
      finally { setIsSending(false); setIsUploading(false); }
      return;
    }

    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      const payload = { groupId, text: trimmed, ...(replyTo && { replyTo: replyTo._id }) };
      const res = await axiosInstance.post("/messages/send", payload);
      const m = res.data.message; if (replyTo) m.replyTo = replyTo;
      setMessages((prev) => [...prev, m]); setText(""); setReplyTo(null);
    } catch (err) { console.log(err); }
    finally { setIsSending(false); }
  };

  const memberCount = group?.members?.length || 0;
  const onlineCount = group?.members?.filter((m) => {
    const id = typeof m.user === "object" ? m.user?._id : m.user;
    return socket?.connected;
  }).length || 0;

  const messageItems = groupMessagesWithDates(messages);

  return (
    <div className="flex min-w-0 h-dvh flex-col overflow-hidden bg-background text-on-background">
      <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center gap-4 bg-background px-margin-page">
        <button type="button" onClick={() => router.push("/chat")} className="text-on-surface" aria-label="Back"><MaterialIcon name="arrow_back" /></button>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-surface-variant bg-primary/20 text-sm font-semibold text-primary`}>
          {(group?.name || "G")[0].toUpperCase()}
        </div>
        <div className="flex flex-col">
          <h1 className="text-headline-lg-mobile font-semibold leading-tight text-on-surface">{group?.name || "Group"}</h1>
          <span className="text-label-sm text-outline">{memberCount} members</span>
        </div>
      </header>

      <main className="no-scrollbar flex min-w-0 flex-grow flex-col gap-gutter-stack overflow-x-hidden overflow-y-auto px-margin-page pt-6">
        {isLoading && <p className="py-10 text-center text-body-md text-outline">Loading...</p>}
        {!isLoading && messages.length === 0 && <p className="py-10 text-center text-body-md text-outline">No messages yet. Say hi!</p>}

        {messageItems.map((item) => {
          if (item.type === "separator") return (
            <div key={item.key} className="my-4 flex justify-center">
              <span className="rounded-full bg-surface-container-low px-4 py-1 text-label-sm uppercase tracking-widest text-outline-variant">{formatDateSeparator(item.date)}</span>
            </div>
          );
          const msg = item.message;
          const showSender = !isOwnMessage(msg.senderId);
          return (
            <div key={item.key} className={`w-fit max-w-[min(calc(100vw-3rem),20rem)] sm:max-w-[min(75%,24rem)] ${isOwnMessage(msg.senderId) ? "self-end" : "self-start"}`}>
              {showSender && (
                <p className="mb-1 ml-1 text-label-sm font-medium text-primary">
                  {getSenderName(msg)}
                </p>
              )}
              <ChatBubble
                message={msg} isMe={isOwnMessage(msg.senderId)}
                onReply={setReplyTo} onReact={handleReact} onDelete={handleDelete}
                onStartEdit={handleEdit} editingText={editingText} setEditingText={setEditingText} onSaveEdit={handleSaveEdit} onCancelEdit={handleCancelEdit}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      <ChatInput
        text={text} onTextChange={setText} onSend={handleSend}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        disabled={isSending} replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
        selectedFile={selectedFile} isUploading={isUploading} onFileSelect={setSelectedFile} onFileClear={() => setSelectedFile(null)}
      />
    </div>
  );
}
