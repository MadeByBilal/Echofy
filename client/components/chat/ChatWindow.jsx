"use client";

import Image from "next/image";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  friend,
  user,
  messages,
  isLoading,
  text,
  replyTo,
  isSending,
  bottomRef,
  onTextChange,
  onSend,
  onKeyDown,
  onReply,
  onCancelReply,
  onBack,
}) {
  const friendDisplayName = friend?.name || friend?.username || "Loading...";
  const isOwnMessage = (senderId) =>
    senderId === user?._id || senderId?._id === user?._id;

  const replyAuthor =
    replyTo &&
    (isOwnMessage(replyTo.senderId)
      ? "You"
      : friend?.name || friend?.username || "them");

  return (
    <div className="chat-page">
      <div className="chat-window">
        <div className="chat-window-header">
          <button className="back-btn" onClick={onBack}>
            ←
          </button>

          <div className="chat-avatar">
            <div className="avatar-circle">
              {friend?.profilePic ? (
                <Image
                  src={friend.profilePic}
                  alt="avatar"
                  width={40}
                  height={40}
                />
              ) : (
                friend?.username?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <span
              className={`status-dot ${friend?.isOnline ? "online" : "offline"}`}
            />
          </div>

          <div>
            <p className="header-name">{friendDisplayName}</p>
            <p className="header-status">
              {friend?.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="messages-area">
          {isLoading && <p className="messages-loading">Loading messages...</p>}

          {!isLoading && messages.length === 0 && (
            <p className="messages-loading">No messages yet. Say hi! 👋</p>
          )}

          {messages.map((msg) => (
            <ChatBubble
              key={msg._id}
              message={msg}
              isMe={isOwnMessage(msg.senderId)}
              onReply={onReply}
            />
          ))}

          <div ref={bottomRef} />
        </div>

        <ChatInput
          text={text}
          onTextChange={onTextChange}
          onSend={onSend}
          onKeyDown={onKeyDown}
          disabled={isSending}
          replyTo={replyTo}
          replyAuthor={replyAuthor}
          onCancelReply={onCancelReply}
        />
      </div>
    </div>
  );
}
