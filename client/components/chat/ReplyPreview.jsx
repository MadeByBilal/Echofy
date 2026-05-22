"use client";

export default function ReplyPreview({ replyAuthor, text, onCancel }) {
  return (
    <div className="reply-box">
      <div className="reply-box-header">
        <span className="reply-box-label">Replying to {replyAuthor}</span>
        <button className="reply-cancel" onClick={onCancel}>
          ×
        </button>
      </div>
      <p className="reply-box-text">{text}</p>
    </div>
  );
}
