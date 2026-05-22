"use client";

import ReplyPreview from "./ReplyPreview";

export default function ChatInput({
  text,
  onTextChange,
  onSend,
  onKeyDown,
  disabled,
  replyTo,
  replyAuthor,
  onCancelReply,
}) {
  return (
    <div>
      {replyTo && (
        <ReplyPreview
          replyAuthor={replyAuthor}
          text={replyTo.text}
          onCancel={onCancelReply}
        />
      )}

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={disabled}
        />
        <button
          className="send-btn"
          onClick={onSend}
          disabled={disabled || !text.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
