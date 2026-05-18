"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/lib/axiosInstance";
import useAuthStore from "@/store/authStore";
import useMessages from "@/hooks/useMessages";
import useSocket from "@/hooks/useSocket";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatConversationPage({ params }) {
  const { userId } = params;
  const router = useRouter();
  const { user, getMe } = useAuthStore();
  const [friend, setFriend] = useState(null);
  const [loadingFriend, setLoadingFriend] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [pageError, setPageError] = useState("");

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    setMessages,
    refresh,
  } = useMessages(userId);

  useSocket(
    useCallback(
      (message) => {
        if (!message) return;
        if (message.senderId === userId || message.receiverId === userId) {
          setMessages((prev) => [...prev, message]);
        }
      },
      [setMessages, userId],
    ),
  );

  useEffect(() => {
    const loadAuthAndFriend = async () => {
      setPageError("");
      try {
        await getMe();
        const res = await axiosInstance.get("/friends");
        const friendRecord = (res.data.friends || []).find(
          (friendItem) => friendItem._id === userId,
        );
        setFriend(friendRecord || null);
      } catch (err) {
        setPageError(
          err.response?.data?.message || "Unable to load chat history.",
        );
      } finally {
        setLoadingFriend(false);
        setAuthChecked(true);
      }
    };

    loadAuthAndFriend();
  }, [getMe, userId]);

  useEffect(() => {
    if (authChecked && !user) {
      router.push("/login");
    }
  }, [authChecked, user, router]);

  const handleSend = async (text) => {
    const result = await sendMessage(text);
    if (result) {
      setMessages((prev) => [...prev, result]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/40">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Chat</h1>
            <p className="mt-2 text-slate-400">
              Send messages and see live updates from your friend.
            </p>
          </div>
          <Link
            href="/chat"
            className="rounded-full bg-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
          >
            Back to chat list
          </Link>
        </div>

        {pageError ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {pageError}
          </div>
        ) : (
          <ChatWindow
            friend={friend}
            messages={messages}
            loading={messagesLoading || loadingFriend}
            error={messagesError}
            onSend={handleSend}
            myId={user?.id}
          />
        )}
      </div>
    </div>
  );
}
