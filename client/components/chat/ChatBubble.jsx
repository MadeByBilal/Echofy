"use client";

export default function ChatBubble({ message, isMe, onReply }) {
  const timeLabel = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className={`message-wrapper ${isMe ? "sent" : "received"}`}>
      <div
        className={`message-bubble ${isMe ? "sent" : "received"}`}
        onClick={() => onReply?.(message)}
      >
        {message.replyTo?.text && (
          <div className="reply-preview">
            <span className="reply-label">Replying to</span>
            <p>{message.replyTo.text}</p>
          </div>
        )}

        <p>{message.text}</p>

        <div className="message-footer">
          <span className="message-time">{timeLabel}</span>
          {isMe && (
            <span className={`message-ticks ${message.status}`}>
              {message.status === "seen"
                ? "✓✓"
                : message.status === "delivered"
                ? "✓✓"
                : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
