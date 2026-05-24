"use client";

import { formatMessageTime } from "@/lib/formatTime";

function MessageTicks({ status }) {
  const ticks =
    status === "seen" ? "✓✓" : status === "delivered" ? "✓✓" : "✓";

  return (
    <span
      className={`text-[11px] leading-none ${
        status === "seen" ? "text-blue-400" : "opacity-70"
      }`}
    >
      {ticks}
    </span>
  );
}

export default function ChatBubble({ message, isMe, onReply }) {
  const timeLabel = formatMessageTime(message.createdAt);

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

        <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
          <p className="min-w-0 break-words text-body-md whitespace-pre-wrap [overflow-wrap:anywhere]">
            {message.text}
          </p>

          <span
            className={`ml-auto flex shrink-0 items-center gap-1 text-[11px] leading-none ${
              isMe ? "text-on-primary/65" : "text-on-surface-variant"
            }`}
          >
            <span>{timeLabel}</span>
            {isMe && <MessageTicks status={message.status} />}
          </span>
        </div>
      </div>
    </div>
  );
}
