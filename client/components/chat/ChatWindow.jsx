"use client";

import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";

export default function ChatWindow({ friend, messages, loading, error, onSend, myId }) {
  return (
    <div className="flex min-h-[70vh] flex-col gap-5">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-2xl font-semibold text-white">
            {friend?.profilePic ? friend.profilePic[0] : (friend?.name || friend?.username || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-semibold text-slate-100">
              {friend?.name || friend?.username || "Chat"}
            </p>
            <p className="text-sm text-slate-400">
              {friend?.isOnline ? "Online now" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center p-8 text-slate-400">Loading conversation...</div>
        ) : error ? (
          <div className="p-8 text-red-300">{error}</div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-slate-400">
            <p className="text-lg">No messages yet.</p>
            <p className="text-sm">Send the first message to start the conversation.</p>
          </div>
        ) : (
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-5">
            {messages.map((message) => (
              <ChatBubble
                key={message._id || `${message.senderId}-${message.createdAt}-${message.text}`}
                message={message.text}
                isMe={message.senderId === myId}
                timestamp={message.createdAt}
              />
            ))}
          </div>
        )}
      </div>

      <ChatInput onSend={onSend} disabled={loading} />
    </div>
  );
}
