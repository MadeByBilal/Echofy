"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import Image from "next/image";
import "./chat.css";

export default function ChatPage() {
  const router = useRouter();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await axiosInstance.get("/friends");
      setFriends(res.data.friends);
    } catch (err) {
      console.log("Error fetching friends:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openChat = (friendId) => {
    router.push(`/chat/${friendId}`);
  };

  return (
    <div className="chat-page">
      {/* SIDEBAR */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Messages</h1>
        </div>

        <div className="chat-list">
          {isLoading && <p className="empty-state">Loading...</p>}

          {!isLoading && friends.length === 0 && (
            <p className="empty-state">
              No friends yet. Go to Friends page to add some.
            </p>
          )}

          {friends.map((friend) => (
            <div
              key={friend._id}
              className="chat-item"
              onClick={() => openChat(friend._id)}
            >
              <div className="chat-avatar">
                <div className="avatar-circle">
                  {friend.profilePic ? (
                    <Image src={friend.profilePic} alt="avatar" />
                  ) : (
                    friend.username[0].toUpperCase()
                  )}
                </div>
                <span
                  className={`status-dot ${friend.isOnline ? "online" : "offline"}`}
                />
              </div>

              <div className="chat-info">
                <p className="chat-name">{friend.name || friend.username}</p>
                <p className="chat-status">
                  {friend.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN AREA - desktop only */}
      <div className="chat-main">
        <div className="chat-placeholder">
          <h2>Welcome to Echofy</h2>
          <p>Select a friend to start chatting</p>
        </div>
      </div>
    </div>
  );
}
