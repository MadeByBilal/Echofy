"use client";

export default function ReplyPreview({ replyAuthor, text, onCancel }) {
  return (
    <div className="mb-3 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-label-sm text-on-surface-variant">
          Replying to {replyAuthor}
        </span>
        <button
          type="button"
          className="text-on-surface-variant transition-colors hover:text-on-surface"
          onClick={onCancel}
          aria-label="Cancel reply"
        >
          ×
        </button>
      </div>
      <p className="truncate text-body-md text-on-surface">{text}</p>
    </div>
  );
}
