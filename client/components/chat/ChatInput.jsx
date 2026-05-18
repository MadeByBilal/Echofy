"use client";

import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const result = await onSend(trimmed);
    if (result !== false) {
      setText("");
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled}
          className="inline-flex shrink-0 items-center justify-center rounded-3xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}
