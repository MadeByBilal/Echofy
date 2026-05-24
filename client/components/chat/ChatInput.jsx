"use client";

import MaterialIcon from "@/components/ui/MaterialIcon";
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
    <footer className="safe-bottom shrink-0 bg-background p-inset-container">
      {replyTo && (
        <ReplyPreview
          replyAuthor={replyAuthor}
          text={replyTo.text}
          onCancel={onCancelReply}
        />
      )}

      <div className="flex items-center gap-3">
        <div className="group flex flex-grow items-center rounded-full border border-surface-variant bg-surface-container-low px-4 py-2 transition-colors focus-within:border-outline">
          <button
            type="button"
            className="p-1 text-outline transition-colors hover:text-on-surface"
            aria-label="Emoji"
          >
            <MaterialIcon name="mood" />
          </button>

          <input
            type="text"
            className="flex-grow border-none bg-transparent px-3 text-body-md text-on-surface outline-none placeholder:text-outline-variant focus:ring-0"
            placeholder="Type.."
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
          />

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 text-outline transition-colors hover:text-on-surface"
              aria-label="Attach file"
            >
              <MaterialIcon name="attach_file" />
            </button>
            <button
              type="button"
              className="p-1 text-outline transition-colors hover:text-on-surface"
              aria-label="Camera"
            >
              <MaterialIcon name="photo_camera" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !text.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-white/5 transition-all duration-200 active:scale-95 disabled:opacity-50"
          aria-label="Send message"
        >
          <MaterialIcon name="send" filled className="text-2xl" />
        </button>
      </div>
    </footer>
  );
}
