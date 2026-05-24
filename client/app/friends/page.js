"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import usePresenceStore from "@/store/presenceStore";
import BottomNav from "@/components/ui/BottomNav";
import socket from "@/lib/socket";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { formatLastSeen } from "@/lib/formatTime";

function UserAvatar({ user, size = "lg", online = false, dimmed = false }) {
  const initial = (user.name || user.username || "?")[0].toUpperCase();
  const sizeClass = size === "lg" ? "h-14 w-14" : "h-12 w-12";

  return (
    <div className={`relative ${sizeClass} shrink-0`}>
      {user.profilePic ? (
        <img
          src={user.profilePic}
          alt={user.name || user.username}
          className={`h-full w-full rounded-full object-cover ${
            dimmed ? "opacity-80 grayscale" : ""
          }`}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full bg-surface-container-high text-on-surface ${
            dimmed ? "opacity-80" : ""
          } ${size === "lg" ? "text-lg font-semibold" : "text-base font-semibold"}`}
        >
          {initial}
        </div>
      )}
      {online && <div className="status-dot" />}
    </div>
  );
}

function groupByLetter(friends) {
  const groups = {};

  friends.forEach((friend) => {
    const label = friend.name || friend.username || "?";
    const letter = label[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(friend);
  });

  return Object.keys(groups)
    .sort()
    .map((letter) => ({
      letter,
      friends: groups[letter].sort((a, b) =>
        (a.name || a.username).localeCompare(b.name || b.username),
      ),
    }));
}

export default function FriendsPage() {
  const router = useRouter();
  const searchRef = useRef(null);
  const presence = usePresenceStore((s) => s.presence);

  const [phone, setPhone] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);

  useEffect(() => {
    fetchIncomingRequests();
    fetchFriends();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleFriendRequest = (payload) => {
      // re-fetch incoming requests so data is populated the same way as the API
      fetchIncomingRequests();
      setSuccess("New friend request");
    };

    socket.on("friend_request", handleFriendRequest);
    return () => {
      socket.off("friend_request", handleFriendRequest);
    };
  }, []);

  const fetchIncomingRequests = async () => {
    try {
      const res = await axiosInstance.get("/friends/requests");
      setIncomingRequests(res.data.requests || []);
    } catch (err) {
      console.log("Error fetching requests:", err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await axiosInstance.get("/friends");
      setFriends(res.data.friends || []);
    } catch (err) {
      console.log("Error fetching friends:", err);
    }
  };

  const isFriendOnline = (friend) => {
    const friendId = friend._id?.toString?.() || friend._id;
    const friendPresence = presence[friendId];
    return friendPresence?.isOnline ?? friend.isOnline ?? false;
  };

  const getLastSeen = (friend) => {
    const friendId = friend._id?.toString?.() || friend._id;
    const friendPresence = presence[friendId];
    return friendPresence?.lastSeen ?? friend.lastSeen;
  };

  const { onlineFriends, offlineFriends } = useMemo(() => {
    const online = [];
    const offline = [];

    friends.forEach((friend) => {
      if (isFriendOnline(friend)) {
        online.push(friend);
      } else {
        offline.push(friend);
      }
    });

    online.sort((a, b) =>
      (a.name || a.username).localeCompare(b.name || b.username),
    );

    return { onlineFriends: online, offlineFriends: offline };
  }, [friends, presence]);

  const offlineGroups = useMemo(
    () => groupByLetter(offlineFriends),
    [offlineFriends],
  );

  const handleRespond = async (requestId, action) => {
    try {
      await axiosInstance.patch("/friends/respond", { requestId, action });
      setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
      setSuccess(action === "accepted" ? "Friend added!" : "Request rejected");
      if (action === "accepted") fetchFriends();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setIsSearching(true);
    setError("");
    setSuccess("");
    setSearchResult(null);
    setRequestSent(false);

    try {
      const res = await axiosInstance.get(
        `/users/search?phone=${encodeURIComponent(phone.trim())}`,
      );
      setSearchResult(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "User not found");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    setIsSending(true);
    setError("");

    try {
      await axiosInstance.post("/friends/request", { to: searchResult._id });
      setSuccess("Friend request sent!");
      setRequestSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  const focusSearch = () => {
    searchRef.current?.focus();
    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const openChat = (friendId) => {
    router.push(`/chat/${friendId}`);
  };

  return (
    <div className="min-h-screen scroll-hide bg-background pb-24 text-on-background">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-background px-margin-page">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="active-scale rounded-full p-1 text-on-surface"
            aria-label="Go back"
          >
            <MaterialIcon name="arrow_back" />
          </button>
          <h1 className="text-headline-lg-mobile font-semibold text-on-surface">
            Friends
          </h1>
        </div>
        <button
          type="button"
          onClick={focusSearch}
          className="active-scale rounded-full p-2 text-on-surface transition-all duration-200 hover:bg-surface-container-high"
          aria-label="Add friend"
        >
          <MaterialIcon name="edit_square" />
        </button>
      </header>

      <main className="min-h-screen px-margin-page pt-16">
        <div className="relative mt-4 mb-8">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
          />
          <input
            ref={searchRef}
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by phone number..."
            className="w-full rounded-full border-none bg-surface-container-high py-3.5 pl-12 pr-4 text-body-md text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-outline"
          />
          {phone.trim() && (
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary disabled:opacity-50"
            >
              {isSearching ? "..." : "Go"}
            </button>
          )}
        </div>

        {error && <p className="mb-4 text-body-md text-red-400">{error}</p>}
        {success && (
          <p className="mb-4 text-body-md text-green-400">{success}</p>
        )}

        {searchResult && (
          <section className="mb-10">
            <div className="mb-gutter-stack flex items-center justify-between">
              <h2 className="text-label-sm font-medium uppercase tracking-widest text-on-surface-variant">
                Search Result
              </h2>
            </div>
            <div className="active-scale flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 transition-all">
              <div className="flex items-center gap-4">
                <UserAvatar user={searchResult} size="lg" />
                <div>
                  <p className="text-title-md font-semibold text-on-surface">
                    {searchResult.name || searchResult.username}
                  </p>
                  <p className="text-body-md text-on-surface-variant">
                    {searchResult.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendRequest}
                disabled={isSending || requestSent}
                className="rounded-full bg-surface-variant px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-primary hover:text-on-primary disabled:opacity-50"
              >
                {requestSent ? "Sent" : isSending ? "Sending..." : "Add Friend"}
              </button>
            </div>
          </section>
        )}

        {incomingRequests.length > 0 && (
          <section className="mb-10">
            <div className="mb-gutter-stack flex items-center justify-between">
              <h2 className="text-label-sm font-medium uppercase tracking-widest text-on-surface-variant">
                Requests
              </h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {incomingRequests.length}
              </span>
            </div>
            <div className="space-y-4">
              {incomingRequests.map((request) => (
                <div
                  key={request._id}
                  className="active-scale flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <UserAvatar user={request.from} size="lg" />
                    <div>
                      <p className="text-title-md font-semibold text-on-surface">
                        {request.from.name || request.from.username}
                      </p>
                      <p className="text-body-md text-on-surface-variant">
                        {request.from.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRespond(request._id, "accepted")}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespond(request._id, "rejected")}
                      className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {onlineFriends.length > 0 && (
          <section className="mb-10">
            <div className="mb-gutter-stack flex items-center justify-between">
              <h2 className="text-label-sm font-medium uppercase tracking-widest text-on-surface-variant">
                Online
              </h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {onlineFriends.length}
              </span>
            </div>
            <div className="space-y-4">
              {onlineFriends.map((friend) => (
                <div
                  key={friend._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openChat(friend._id)}
                  onKeyDown={(e) => e.key === "Enter" && openChat(friend._id)}
                  className="active-scale flex cursor-pointer items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <UserAvatar user={friend} size="lg" online />
                    <div>
                      <p className="text-title-md font-semibold text-on-surface">
                        {friend.name || friend.username}
                      </p>
                      <p className="text-body-md text-on-surface-variant">
                        Active now
                      </p>
                    </div>
                  </div>
                  <MaterialIcon
                    name="chat_bubble"
                    className="text-[20px] text-on-surface-variant"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {(offlineGroups.length > 0 || friends.length === 0) && (
          <section>
            <div className="mb-gutter-stack flex items-center justify-between">
              <h2 className="text-label-sm font-medium uppercase tracking-widest text-on-surface-variant">
                All Contacts
              </h2>
            </div>

            {friends.length === 0 &&
              incomingRequests.length === 0 &&
              !searchResult && (
                <p className="py-10 text-center text-body-md text-outline">
                  No friends yet. Search by phone to add friends.
                </p>
              )}

            <div className="space-y-2">
              {offlineGroups.map(({ letter, friends: groupFriends }) => (
                <div key={letter}>
                  <div className="py-2">
                    <span className="text-label-sm font-bold text-outline">
                      {letter}
                    </span>
                  </div>
                  {groupFriends.map((friend, index) => (
                    <div
                      key={friend._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openChat(friend._id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && openChat(friend._id)
                      }
                      className={`active-scale flex cursor-pointer items-center justify-between px-2 py-3 ${
                        index < groupFriends.length - 1
                          ? "border-b border-outline-variant/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <UserAvatar user={friend} size="sm" dimmed />
                        <div>
                          <p className="text-title-md font-semibold text-on-surface">
                            {friend.name || friend.username}
                          </p>
                          <p className="text-body-md text-on-surface-variant">
                            {formatLastSeen(getLastSeen(friend))}
                          </p>
                        </div>
                      </div>
                      <MaterialIcon
                        name="chat_bubble"
                        className="text-on-surface-variant/60"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <button
        type="button"
        onClick={focusSearch}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl transition-transform active:scale-90"
        aria-label="Add friend"
      >
        <MaterialIcon name="person_add" className="text-[28px]" />
      </button>

      <BottomNav />
    </div>
  );
}
