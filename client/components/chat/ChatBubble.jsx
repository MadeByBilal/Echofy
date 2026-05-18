"use client";

export default function ChatBubble({ message, isMe, timestamp }) {
  const timeLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-3xl px-5 py-4 text-sm leading-6 ${isMe ? "rounded-br-none bg-blue-500 text-white" : "rounded-bl-none bg-slate-800 text-slate-100"}`}>
        <p>{message}</p>
        {timeLabel && <span className="mt-2 block text-right text-[11px] text-slate-400">{timeLabel}</span>}
      </div>
    </div>
  );
}
