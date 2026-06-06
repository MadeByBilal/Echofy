"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import usePresenceStore from "@/store/presenceStore";
import useChatStore from "@/store/chatStore";
import useAuthStore from "@/store/authStore";
import socket from "@/lib/socket";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BottomNav from "@/components/ui/BottomNav";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { formatLastMessageTime } from "@/lib/formatTime";

function FriendAvatar({ friend }) {
  const initial = (friend.name || friend.username || "?")[0].toUpperCase();
  if (friend.profilePic) {
    return <img src={friend.profilePic} alt={friend.name || friend.username} className="h-14 w-14 rounded-full border border-outline-variant/30 object-cover" />;
  }
  return <div className="flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-high text-lg font-semibold text-on-surface">{initial}</div>;
}

function GroupAvatar({ group }) {
  const initial = (group.name || "G")[0].toUpperCase();
  if (group.profilePic) {
    return <img src={group.profilePic} alt={group.name} className="h-14 w-14 rounded-full border border-outline-variant/30 object-cover" />;
  }
  return <div className="flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant/30 bg-primary/20 text-lg font-semibold text-primary">{initial}</div>;
}

export default function ChatPage() {
  return <ProtectedRoute><ChatContent /></ProtectedRoute>;
}

function ChatContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const presence = usePresenceStore((s) => s.presence);
  const friends = useChatStore((s) => s.friends);
  const groups = useChatStore((s) => s.groups);
  const fetchChatList = useChatStore((s) => s.fetchChatList);
  const updateFriendLastMessage = useChatStore((s) => s.updateFriendLastMessage);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      fetchChatList(true).finally(() => setIsLoading(false));
      mounted.current = true;
    } else {
      fetchChatList();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user?._id || !socket) return;
    const onMsg = (message) => {
      const senderId = typeof message.senderId === "object" ? message.senderId?._id : message.senderId;
      const receiverId = typeof message.receiverId === "object" ? message.receiverId?._id : message.receiverId;
      if (!senderId || !receiverId) return;
      const otherId = senderId === user._id ? receiverId : senderId;
      const hasText = message.text || "";
      updateFriendLastMessage(otherId, {
        _id: message._id,
        text: hasText || (message.fileType === "image" ? "📷 Image" : message.fileType === "audio" ? "🎵 Audio" : "📎 File"),
        createdAt: message.createdAt,
        status: message.status,
        senderId: message.senderId,
      });
    };
    socket.on("receive_message", onMsg);
    return () => socket.off("receive_message", onMsg);
  }, [user?._id, updateFriendLastMessage]);

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [friends]);

  const filteredFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedFriends;
    return sortedFriends.filter((f) => (f.name || f.username || "").toLowerCase().includes(q) || (f.bio || "").toLowerCase().includes(q));
  }, [sortedFriends, searchQuery]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  const openChat = (friendId) => router.push(`/chat/${friendId}`);
  const openGroup = (groupId) => router.push(`/group/${groupId}`);

  return (
    <div className="bg-background pb-24">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-background px-margin-page">
        <h1 className="text-headline-lg-mobile font-semibold text-on-surface">Messages</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push("/groups/create")} className="rounded-full p-2 text-on-surface transition-all hover:bg-surface-container-high active:scale-95" aria-label="New group"><MaterialIcon name="group_add" /></button>
          <button type="button" onClick={() => router.push("/friends")} className="rounded-full p-2 text-on-surface transition-all hover:bg-surface-container-high active:scale-95" aria-label="New conversation"><MaterialIcon name="edit_square" /></button>
        </div>
      </header>

      <main className="px-margin-page pt-16">
        <div className="relative mt-4">
          <MaterialIcon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="w-full rounded-full border-none bg-surface-container-low py-3 pl-12 pr-4 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:ring-1 focus:ring-outline" />
        </div>

        <div className="mt-6 space-y-1">
          {isLoading && friends.length === 0 && groups.length === 0 && <p className="py-10 text-center text-body-md text-outline">Loading...</p>}

          {!isLoading && friends.length === 0 && groups.length === 0 && (
            <p className="py-10 text-center text-body-md text-outline">No conversations yet. Start a new one!</p>
          )}

          {filteredGroups.length > 0 && (
            <div>
              <p className="mb-2 text-label-sm uppercase tracking-wider text-outline-variant">Groups</p>
              {filteredGroups.map((group) => (
                <div key={group._id} className="message-row flex cursor-pointer items-center gap-4 rounded-2xl p-3 transition-all hover:bg-surface-container-low" onClick={() => openGroup(group._id)}>
                  <div className="relative shrink-0"><GroupAvatar group={group} /></div>
                  <div className="min-w-0 flex-grow">
                    <div className="mb-0.5 flex items-baseline justify-between">
                      <h3 className="truncate text-title-md font-semibold text-on-surface">{group.name}</h3>
                      {group.lastMessage?.createdAt && <span className="ml-2 shrink-0 text-label-sm text-on-tertiary-container">{formatLastMessageTime(group.lastMessage.createdAt)}</span>}
                    </div>
                    <p className="truncate text-body-md text-on-surface-variant">{group.description || `${group.members?.length || 0} members`}</p>
                  </div>
                </div>
              ))}
              <div className="my-4 border-t border-outline-variant/10" />
            </div>
          )}

          {filteredFriends.map((friend) => {
            const friendId = friend._id?.toString?.() || friend._id;
            const isOnline = presence[friendId]?.isOnline ?? false;
            const lastMessageTime = friend.lastMessage?.createdAt;
            const isRecent = lastMessageTime && now - new Date(lastMessageTime).getTime() < 60000;

            return (
              <div key={friend._id} className="message-row flex cursor-pointer items-center gap-4 rounded-2xl p-3 transition-all hover:bg-surface-container-low" onClick={() => openChat(friend._id)}>
                <div className="relative shrink-0">
                  <FriendAvatar friend={friend} />
                  {isOnline && <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background bg-green-500" />}
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="mb-0.5 flex items-baseline justify-between">
                    <h3 className="truncate text-title-md font-semibold text-on-surface">{friend.name || friend.username}</h3>
                    {lastMessageTime && <span className={`ml-2 shrink-0 text-label-sm ${isRecent ? "text-primary" : "text-on-tertiary-container"}`}>{formatLastMessageTime(lastMessageTime)}</span>}
                  </div>
                  <p className="truncate text-body-md text-on-surface-variant">
                    {friend.lastMessage?.text || friend.bio || "No bio yet"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <button type="button" onClick={() => router.push("/friends")} className="fixed bottom-24 right-margin-page z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-light text-on-primary shadow-xl transition-transform active:scale-90" aria-label="New conversation"><MaterialIcon name="add" filled className="text-2xl" /></button>
      <BottomNav />
    </div>
  );
}
