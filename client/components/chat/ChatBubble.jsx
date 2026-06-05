"use client";

import { formatMessageTime } from "@/lib/formatTime";
import MessageTicks from "./MessageTicks";
import MaterialIcon from "@/components/ui/MaterialIcon";

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function FilePreview({ message, isMe }) {
  const isImage = message.fileType === "image" || message.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  if (isImage) {
    return (
      <div className="mb-2 -mx-1 overflow-hidden rounded-xl">
        <img
          src={message.fileUrl}
          alt={message.fileName || "Image"}
          className="max-h-80 w-full cursor-pointer object-contain transition-transform hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <a
      href={message.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`mb-2 flex items-center gap-3 rounded-xl p-3 transition-colors ${
        isMe
          ? "bg-white/10 hover:bg-white/15"
          : "bg-surface-variant/30 hover:bg-surface-variant/50"
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
        isMe ? "bg-white/15" : "bg-surface-container-high"
      }`}>
        <MaterialIcon name="description" className="text-xl" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-md font-medium">
          {message.fileName || "File"}
        </p>
        {message.fileSize && (
          <p className="text-label-sm opacity-70">
            {formatFileSize(message.fileSize)}
          </p>
        )}
      </div>
      <MaterialIcon name="open_in_new" className="shrink-0 text-lg opacity-60" />
    </a>
  );
}

export default function ChatBubble({ message, isMe, onReply }) {
  const timeLabel = formatMessageTime(message.createdAt);
  const hasFile = !!message.fileUrl;

  return (
    <div
      className={`w-fit max-w-[min(calc(100vw-3rem),20rem)] sm:max-w-[min(75%,24rem)] ${
        isMe ? "self-end" : "self-start"
      }`}
    >
      <div
        className={`inline-block w-fit max-w-full rounded-2xl px-3 py-2 shadow-sm ${
          isMe
            ? "message-bubble-outgoing bg-primary text-on-primary shadow-md"
            : "message-bubble-incoming bg-surface-container-high text-on-surface"
        }`}
        onClick={() => onReply?.(message)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onReply?.(message)}
      >
        {message.replyTo?.text && (
          <div className="mb-2 max-w-full border-l-2 border-outline-variant/40 pl-3 opacity-90">
            <span className="text-label-sm text-on-surface-variant">
              Replying to
            </span>
            <p className="break-words text-body-md [overflow-wrap:anywhere]">
              {message.replyTo.text}
            </p>
          </div>
        )}

        {hasFile && <FilePreview message={message} isMe={isMe} />}

        {message.text && (
          <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
            <p className="min-w-0 break-words text-body-md whitespace-pre-wrap [overflow-wrap:anywhere]">
              {message.text}
            </p>
          </div>
        )}

        <div className={`mt-1 flex items-center justify-end gap-1 ${
          isMe ? "text-on-primary/65" : "text-on-surface-variant"
        }`}>
          <span className="text-[11px] leading-none">{timeLabel}</span>
          {isMe && <MessageTicks status={message.status} />}
        </div>
      </div>
    </div>
  );
}
