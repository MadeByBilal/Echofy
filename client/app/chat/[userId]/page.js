"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import useAuthStore from "@/store/authStore";
import socket from "@/lib/socket";
import Image from "next/image";
import "../chat.css";

export default function ChatWindow() {
  const { userId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    const fetchFriend = async () => {
      try {
        const res = await axiosInstance.get("/friends");
        const found = res.data.friends.find((f) => f._id === userId);
        setFriend(found);
      } catch (err) {
        console.log("Error fetching friend:", err);
      }
    };

    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get(`/messages/${userId}`);
        setMessages(res.data.messages);

        // Emit messages_seen event
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
    // Tell server this user is online
    if (user?._id) {
      socket.emit("user_online", user._id);
    }

    // Listen for incoming messages
    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for delivery confirmation
    socket.on("messages_delivered", ({ receiverId, messageIds }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds && messageIds.includes(msg._id)
            ? { ...msg, status: "delivered" }
            : msg,
        ),
      );
    });

    // Listen for seen confirmation
    socket.on("messages_seen", ({ senderId, receiverId }) => {
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
    if (!text.trim() || isSending) return;
    setIsSending(true);

    try {
      const res = await axiosInstance.post("/messages/send", {
        receiverId: userId,
        text: text.trim(),
      });
      // add to messages immediately
      setMessages((prev) => [...prev, res.data.message]);
      setText("");
    } catch (err) {
      console.log("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-page">
      <div className="chat-window">
        {/* HEADER */}
        <div className="chat-window-header">
          <button className="back-btn" onClick={() => router.push("/chat")}>
            ←
          </button>

          <div className="chat-avatar">
            <div className="avatar-circle">
              {friend?.profilePic ? (
                <Image src={friend.profilePic} alt="avatar" />
              ) : (
                friend?.username?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <span
              className={`status-dot ${friend?.isOnline ? "online" : "offline"}`}
            />
          </div>

          <div>
            <p className="header-name">
              {friend?.name || friend?.username || "Loading..."}
            </p>
            <p className="header-status">
              {friend?.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="messages-area">
          {isLoading && <p className="messages-loading">Loading messages...</p>}

          {!isLoading && messages.length === 0 && (
            <p className="messages-loading">No messages yet. Say hi! 👋</p>
          )}

          {messages.map((msg) => {
            const isSent =
              msg.senderId === user?._id || msg.senderId?._id === user?._id;

            return (
              <div
                key={msg._id}
                className={`message-wrapper ${isSent ? "sent" : "received"}`}
              >
                <div
                  className={`message-bubble ${isSent ? "sent" : "received"}`}
                >
                  {msg.text}
                  <div className="message-footer">
                    <span className="message-time">
                      {formatTime(msg.createdAt)}
                    </span>
                    {isSent && (
                      <span className={`message-ticks ${msg.status}`}>
                        {msg.status === "sent" && "✓"}
                        {msg.status === "delivered" && "✓✓"}
                        {msg.status === "seen" && "✓✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="chat-input-area">
          <textarea
            className="chat-input"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={isSending || !text.trim()}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
