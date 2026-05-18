"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axiosInstance";
import useAuthStore from "@/store/authStore";
import ChatList from "@/components/chat/ChatList";
import "./chat.css";

export default function ChatPage() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { getMe } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        await getMe();
        const res = await axiosInstance.get("/friends");
        setFriends(res.data.friends || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load chat list.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [getMe]);

  return (
    <div className="chat-page">
      <div className="chat-page-container">
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <h1 className="chat-title">Chats</h1>
              <p className="chat-subtitle">
                Open a conversation with a friend or go add contacts.
              </p>
            </div>
            <Link href="/friends" className="button button-secondary">
              Manage friends
            </Link>
          </div>

          {loading ? (
            <div className="chat-info-box">Loading your chats...</div>
          ) : error ? (
            <div className="chat-error-box">{error}</div>
          ) : friends.length > 0 ? (
            <ChatList friends={friends} />
          ) : (
            <div className="chat-empty-state">
              <p>No conversations yet.</p>
              <p>Add friends first, then start a chat from the Friends page.</p>
              <Link
                href="/friends"
                className="button button-primary"
                style={{ marginTop: "18px" }}
              >
                Find friends
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
