"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import ReplyPreview from "./ReplyPreview";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊",
  "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗",
  "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭",
  "🤔", "🤐", "😐", "😑", "😶", "😏", "😒", "🙄",
  "😬", "😮", "😯", "😲", "😳", "🥺", "😢", "😭",
  "😤", "😡", "🤬", "😈", "👿", "💀", "☠️", "💩",
  "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌",
  "🤲", "🤝", "🙏", "✌️", "🤟", "🤘", "👌", "❤️",
  "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎",
  "💔", "💕", "💞", "💗", "💖", "✨", "🔥", "⭐",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIN_RECORD_MS = 1000;

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatTimer(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  return `${min}:${String(sec % 60).padStart(2, "0")}`;
}

export default function ChatInput({
  text, onTextChange, onSend, onKeyDown, disabled,
  replyTo, replyAuthor, onCancelReply,
  selectedFile, onFileSelect, onFileClear, isUploading,
  onTyping, onVoiceSend,
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const emojiRef = useRef(null);
  const actionsRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const recordTimer = useRef(null);
  const recordStart = useRef(0);
  const streamRef = useRef(null);
  const micRef = useRef(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    function handleClick(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setShowActions(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const insertEmoji = (emoji) => {
    onTextChange(text + emoji);
    setShowEmoji(false);
  };

  const handleTextInput = (value) => {
    onTextChange(value);
    onTyping?.();
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { alert("File must be under 10MB"); e.target.value = ""; return; }
    onFileSelect(file);
    setShowActions(false);
    e.target.value = "";
  };

  // ─── VOICE RECORDING ────────────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        const duration = Date.now() - recordStart.current;
        const wasCancelled = cancelRef.current;
        cancelRef.current = false;
        stream.getTracks().forEach((t) => t.stop());

        if (duration < MIN_RECORD_MS || wasCancelled) return;

        const blob = new Blob(audioChunks.current, { type: recorder.mimeType });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: recorder.mimeType });
        onVoiceSend?.(file);
      };

      recorder.start();
      recordStart.current = Date.now();
      setRecording(true);
      cancelRef.current = false;

      recordTimer.current = setInterval(() => {
        setRecordingTime(Date.now() - recordStart.current);
      }, 100);
    } catch (e) {
      console.log("Mic error:", e);
      alert("Microphone access denied");
    }
  }, [onVoiceSend]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorder.current || mediaRecorder.current.state === "inactive") return;
    setRecording(false);
    clearInterval(recordTimer.current);
    mediaRecorder.current.stop();
    mediaRecorder.current = null;
  }, []);

  const handleMicClick = useCallback(() => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [recording, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(recordTimer.current);
      if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
        mediaRecorder.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const isImage = selectedFile?.type?.startsWith("image/");
  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : null;
  const canSend = text.trim() || selectedFile;
  const showMic = !text.trim() && !selectedFile && !replyTo;

  return (
    <footer className="safe-bottom w-full shrink-0 bg-background px-inset-container pb-inset-container pt-2">
      {replyTo && <ReplyPreview replyAuthor={replyAuthor} text={replyTo.text} onCancel={onCancelReply} />}

      {selectedFile && (
        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-surface-variant bg-surface-container-low p-3">
          {isImage ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              <img src={previewUrl} alt={selectedFile.name} className="h-full w-full object-cover" />
            </div>
          ) : selectedFile.type?.startsWith("audio/") ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/20">
              <MaterialIcon name="mic" className="text-xl text-primary" />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
              <MaterialIcon name="description" className="text-2xl text-outline" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-md text-on-surface">{selectedFile.name}</p>
            <p className="text-label-sm text-outline">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button type="button" onClick={onFileClear} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface" aria-label="Remove file"><MaterialIcon name="close" /></button>
        </div>
      )}

      <div className="relative flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Text Input + Attach */}
        <div className="group flex min-w-0 flex-1 items-center rounded-full border border-surface-variant bg-surface-container-low px-3 py-2 transition-colors focus-within:border-outline">
          <button type="button" onClick={() => setShowEmoji(v => !v)} className="p-1 text-outline transition-colors hover:text-on-surface" aria-label="Emoji"><MaterialIcon name="mood" /></button>

          <input type="text" className="min-w-0 flex-1 border-none bg-transparent px-2 text-body-md text-on-surface outline-none placeholder:text-outline-variant focus:ring-0" placeholder="Type a message.." value={text} onChange={(e) => handleTextInput(e.target.value)} onKeyDown={onKeyDown} disabled={disabled} />

          <div className="flex items-center gap-1 relative" ref={actionsRef}>
            <button type="button" onClick={() => setShowActions(v => !v)} className="p-1 text-outline transition-colors hover:text-on-surface" aria-label="Attach"><MaterialIcon name="attach_file" /></button>

            {showActions && (
              <div className="absolute bottom-full right-0 z-50 mb-2 w-48 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high py-1 shadow-2xl">
                <button type="button" onClick={() => { fileInputRef.current?.click(); setShowActions(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-body-md text-on-surface transition-colors hover:bg-surface-container"><MaterialIcon name="image" className="text-outline" /> Photo or Video</button>
                <button type="button" onClick={() => { audioInputRef.current?.click(); setShowActions(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-body-md text-on-surface transition-colors hover:bg-surface-container"><MaterialIcon name="music_note" className="text-outline" /> Audio File</button>
                <button type="button" onClick={() => { fileInputRef.current?.click(); setShowActions(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-body-md text-on-surface transition-colors hover:bg-surface-container"><MaterialIcon name="description" className="text-outline" /> Document</button>
              </div>
            )}

            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePick} />
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFilePick} />
          </div>
        </div>

        {/* Right button: Send, Mic, or Recording */}
        {recording ? (
          <button
            type="button"
            onClick={handleMicClick}
            className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-error pl-3 pr-4 shadow-lg transition-all active:scale-95"
            aria-label="Stop recording"
          >
            <span className="flex h-3 w-3 rounded-full bg-white animate-pulse" />
            <span className="text-label-sm font-semibold text-white">{formatTimer(recordingTime)}</span>
            <MaterialIcon name="stop" className="text-xl text-white" />
          </button>
        ) : showMic && !disabled ? (
          <button
            ref={micRef}
            type="button"
            onClick={handleMicClick}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-white/5 transition-all duration-200 active:scale-95"
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {isUploading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <MaterialIcon name="mic" filled className="text-2xl" />
            )}
          </button>
        ) : (
          <button type="button" onClick={onSend} disabled={disabled || !canSend || isUploading} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-white/5 transition-all duration-200 active:scale-95 disabled:opacity-50" aria-label="Send">
            {isUploading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12hz" />
              </svg>
            ) : <MaterialIcon name="send" filled className="text-2xl" />}
          </button>
        )}

        {showEmoji && (
          <div className="absolute bottom-full left-0 z-50 mb-2 grid max-h-52 w-full grid-cols-8 gap-1 overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3 shadow-xl">
            {EMOJIS.map((emoji) => (
              <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="flex aspect-square items-center justify-center rounded-lg text-xl transition-colors hover:bg-surface-container-high">{emoji}</button>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
