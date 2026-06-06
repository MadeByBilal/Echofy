"use client";

import { useState, useRef, useEffect, memo } from "react";
import { formatMessageTime } from "@/lib/formatTime";
import MessageTicks from "./MessageTicks";
import MaterialIcon from "@/components/ui/MaterialIcon";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function AudioPreview({ message, isMe }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mb-1 mt-1 flex items-center gap-3">
      <button type="button" onClick={(e) => { e.stopPropagation(); toggle(); }} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isMe ? "bg-black/15 text-on-primary" : "bg-primary text-on-primary"} transition-transform active:scale-90`}>
        <MaterialIcon name={playing ? "pause" : "play_arrow"} filled className="text-xl" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="relative h-1 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: isMe ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)" }}>
          <div className="h-full rounded-full transition-all duration-200" style={{ width: `${pct}%`, backgroundColor: isMe ? "#fff" : "var(--color-primary, #3b82f6)" }} />
        </div>
        <span className="shrink-0 text-label-sm tabular-nums opacity-70">{fmt(playing ? currentTime : duration)}</span>
      </div>
      <audio ref={audioRef} src={message.fileUrl} preload="metadata"
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}

function FilePreview({ message, isMe }) {
  const isAudio = message.fileType === "audio" || message.fileUrl?.match(/\.(webm|mp3|wav|ogg|m4a)$/i);
  const isImage = message.fileType === "image" || message.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  if (isAudio) return <AudioPreview message={message} isMe={isMe} />;

  if (isImage) {
    return (
      <div className="mb-2 -mx-3 mt-1 overflow-hidden rounded-xl">
        <img src={message.fileUrl} alt={message.fileName || "Image"} className="max-h-80 w-full cursor-pointer object-contain transition-transform hover:scale-[1.02]" loading="lazy" />
      </div>
    );
  }
  return (
    <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className={`mb-2 mt-1 flex items-center gap-3 rounded-xl p-3 transition-colors ${isMe ? "bg-white/10 hover:bg-white/15" : "bg-surface-variant/30 hover:bg-surface-variant/50"}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isMe ? "bg-white/15" : "bg-surface-container-high"}`}>
        <MaterialIcon name="description" className="text-xl" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-md font-medium">{message.fileName || "File"}</p>
        {message.fileSize && <p className="text-label-sm opacity-70">{formatFileSize(message.fileSize)}</p>}
      </div>
      <MaterialIcon name="open_in_new" className="shrink-0 text-lg opacity-60" />
    </a>
  );
}

function ChatBubble({ message, isMe, onReply, onReact, onEdit, onDelete, onStartEdit, editingText, setEditingText, onSaveEdit, onCancelEdit, onRetry }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const menuRef = useRef(null);
  const bubbleRef = useRef(null);
  const reactionRef = useRef(null);

  const isFailed = message.status === "failed";
  const isTemp = message._id?.toString()?.startsWith?.("temp_");
  const isSending = isTemp && message.status !== "failed";

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && !bubbleRef.current?.contains(e.target)) setShowMenu(false);
      if (reactionRef.current && !reactionRef.current.contains(e.target)) setShowReactions(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const timeLabel = formatMessageTime(message.createdAt);
  const hasFile = !!message.fileUrl;
  const reactions = message.reactions || [];

  const grouped = {};
  reactions.forEach((r) => {
    const id = typeof r.userId === "object" ? r.userId?._id : r.userId;
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(id);
  });

  return (
    <div className={`w-fit max-w-[min(calc(100vw-3rem),22rem)] sm:max-w-[min(75%,28rem)] ${isMe ? "self-end" : "self-start"}`}>
      <div className="relative">
        <div
          ref={bubbleRef}
          onClick={() => { if (editingText?._id === message._id || isTemp) return; setShowMenu(v => !v); }}
          className={`inline-block w-fit max-w-full cursor-pointer rounded-2xl px-4 py-3 shadow-sm ${isFailed ? "ring-2 ring-error/50" : ""} ${isMe
            ? "message-bubble-outgoing bg-primary text-on-primary shadow-md"
            : "message-bubble-incoming bg-surface-container-high text-on-surface"
          } ${isSending ? "opacity-80" : ""}`}
        >
          {message.replyTo?.text && (
            <div className="mb-2 max-w-full border-l-2 border-outline-variant/40 pl-3 opacity-90">
              <span className="text-label-sm text-on-surface-variant">Replying to</span>
              <p className="break-words text-[15px] leading-relaxed [overflow-wrap:anywhere]">{message.replyTo.text}</p>
            </div>
          )}

          {hasFile && <FilePreview message={message} isMe={isMe} />}

          {onStartEdit && message._id === editingText?._id ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={editingText?.text || ""}
                onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                className="rounded-lg border border-outline-variant/40 bg-transparent px-3 py-2 text-body-md outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
              />
              <div className="flex gap-2 self-end">
                <button onClick={onCancelEdit} className="text-label-sm text-outline-variant hover:text-on-surface">Cancel</button>
                <button onClick={onSaveEdit} className="text-label-sm font-semibold text-primary hover:text-on-primary">Save</button>
              </div>
            </div>
          ) : (
            <>
              {message.text && (
                <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
                  <p className="min-w-0 break-words text-[15px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {message.text}
                    {message.isEdited && <span className="ml-1 text-[10px] opacity-50">(edited)</span>}
                  </p>
                </div>
              )}

              <div className="relative mt-1 flex items-center justify-end gap-1">
                <span className={`text-[12px] leading-none ${isMe ? "text-on-primary/65" : "text-on-surface-variant"}`}>{timeLabel}</span>
                {isMe && !isFailed && <MessageTicks status={message.status} />}
                {isFailed && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRetry?.(message._id, message.text); }}
                    className="flex items-center gap-1 rounded bg-error/20 px-1.5 py-0.5 text-[11px] font-semibold text-error transition-colors hover:bg-error/30"
                  >
                    <MaterialIcon name="error_outline" className="text-sm" /> Retry
                  </button>
                )}
                {isSending && (
                  <svg className="h-3 w-3 animate-spin text-on-primary/60" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>
            </>
          )}
        </div>

        {showMenu && !isTemp && (
          <div ref={menuRef} onClick={(e) => e.stopPropagation()} className={`absolute z-50 w-44 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high py-1 shadow-2xl ${isMe ? "right-0" : "left-0"} top-full mt-2`}>
            <button type="button" onClick={() => { onReply?.(message); setShowMenu(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-body-md text-on-surface transition-colors hover:bg-surface-container">
              <MaterialIcon name="reply" className="text-outline text-lg" /> Reply
            </button>
            {reactions.length > 0 && (
              <div className="border-t border-outline-variant/10 px-4 py-2">
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(grouped).map(([emoji, users]) => (
                    <button key={emoji} type="button" onClick={() => onReact?.(message, emoji)} className="flex items-center gap-1 rounded-full bg-surface-variant/50 px-2 py-0.5 text-sm">
                      <span>{emoji}</span>
                      <span className="text-[10px] text-outline">{users.length}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-outline-variant/10" />
            <div className="flex gap-1 px-4 py-2" ref={reactionRef}>
              {REACTION_EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => { onReact?.(message, emoji); setShowMenu(false); }} className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 active:scale-90">
                  {emoji}
                </button>
              ))}
            </div>
            <div className="border-t border-outline-variant/10" />
            {isMe && (
              <>
                <button type="button" onClick={() => { onStartEdit?.(message); setShowMenu(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-body-md text-on-surface transition-colors hover:bg-surface-container">
                  <MaterialIcon name="edit" className="text-outline text-lg" /> Edit
                </button>
                <button type="button" onClick={() => { if (confirm("Delete this message?")) { onDelete?.(message._id); } setShowMenu(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-body-md text-error transition-colors hover:bg-surface-container">
                  <MaterialIcon name="delete" className="text-lg" /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {Object.keys(grouped).length > 0 && !showMenu && !isTemp && (
        <div className={`-mt-1 flex gap-1 flex-wrap ${isMe ? "justify-end" : "justify-start"} px-1`}>
          {Object.entries(grouped).map(([emoji, users]) => (
            <button key={emoji} type="button" onClick={() => onReact?.(message, emoji)} className="flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5 text-sm shadow-sm">
              <span>{emoji}</span>
              <span className="text-[10px] text-outline">{users.length}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ChatBubble);
