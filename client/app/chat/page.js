"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import usePresenceStore from "@/store/presenceStore";
import BottomNav from "@/components/ui/BottomNav";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { formatLastMessageTime } from "@/lib/formatTime";

function FriendAvatar({ friend }) {
  const initial = (friend.name || friend.username || "?")[0].toUpperCase();

  if (friend.profilePic) {
    return (
      <img
        src={friend.profilePic}
        alt={friend.name || friend.username}
        className="h-14 w-14 rounded-full border border-outline-variant/30 object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-high text-lg font-semibold text-on-surface">
      {initial}
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const presence = usePresenceStore((s) => s.presence);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await axiosInstance.get("/friends");
      setFriends(res.data.friends || []);
    } catch (err) {
      console.log("Error fetching friends:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const aTime = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const bTime = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return bTime - aTime;
    });
  }, [friends]);

  const filteredFriends = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedFriends;

    return sortedFriends.filter((friend) => {
      const name = (friend.name || friend.username || "").toLowerCase();
      const bio = (friend.bio || "").toLowerCase();
      return name.includes(query) || bio.includes(query);
    });
  }, [sortedFriends, searchQuery]);

  const openChat = (friendId) => {
    router.push(`/chat/${friendId}`);
  };

  return (
    <div className="bg-background pb-24">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-background px-margin-page">
        <h1 className="text-headline-lg-mobile font-semibold text-on-surface">
          Messages
        </h1>
        <button
          type="button"
          onClick={() => router.push("/friends")}
          className="rounded-full p-2 text-on-surface transition-all hover:bg-surface-container-high active:scale-95"
          aria-label="New conversation"
        >
          <MaterialIcon name="edit_square" />
        </button>
      </header>

      <main className="px-margin-page pt-16">
        <div className="relative mt-4">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-full border-none bg-surface-container-low py-3 pl-12 pr-4 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:ring-1 focus:ring-outline"
          />
        </div>

        <div className="mt-6 space-y-1">
          {isLoading && (
            <p className="py-10 text-center text-body-md text-outline">
              Loading...
            </p>
          )}

          {!isLoading && friends.length === 0 && (
            <p className="py-10 text-center text-body-md text-outline">
              No friends yet. Go to Friends to add some.
            </p>
          )}

          {!isLoading && friends.length > 0 && filteredFriends.length === 0 && (
            <p className="py-10 text-center text-body-md text-outline">
              No conversations match your search.
            </p>
          )}

          {filteredFriends.map((friend) => {
            const friendId = friend._id?.toString?.() || friend._id;
            const friendPresence = presence[friendId];
            const isOnline =
              friendPresence?.isOnline ?? friend.isOnline ?? false;
            const lastMessageTime = friend.lastMessage?.createdAt;
            const isRecent =
              lastMessageTime &&
              Date.now() - new Date(lastMessageTime).getTime() < 60000;

            return (
              <div
                key={friend._id}
                className="message-row flex cursor-pointer items-center gap-4 rounded-2xl p-3 transition-all hover:bg-surface-container-low"
                onClick={() => openChat(friend._id)}
              >
                <div className="relative shrink-0">
                  <FriendAvatar friend={friend} />
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background bg-green-500" />
                  )}
                </div>

                <div className="min-w-0 flex-grow">
                  <div className="mb-0.5 flex items-baseline justify-between">
                    <h3 className="truncate text-title-md font-semibold text-on-surface">
                      {friend.name || friend.username}
                    </h3>
                    {lastMessageTime && (
                      <span
                        className={`ml-2 shrink-0 text-label-sm ${
                          isRecent
                            ? "text-primary"
                            : "text-on-tertiary-container"
                        }`}
                      >
                        {formatLastMessageTime(lastMessageTime)}
                      </span>
                    )}
                  </div>

                  <p className="truncate text-body-md text-on-surface-variant">
                    {friend.bio || "No bio yet"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <button
        type="button"
        onClick={() => router.push("/friends")}
        className="fixed bottom-24 right-margin-page z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-light text-on-primary shadow-xl transition-transform active:scale-90"
        aria-label="New conversation"
      >
        <MaterialIcon name="add" filled className="text-2xl" />
      </button>

      <BottomNav />
    </div>
  );
}
