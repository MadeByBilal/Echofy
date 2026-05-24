"use client";

import { useMemo } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import usePresenceStore from "@/store/presenceStore";
import { formatLastSeen, formatDateSeparator, groupMessagesWithDates } from "@/lib/formatTime";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";

function FriendHeaderAvatar({ friend, online }) {
  const initial = (friend?.name || friend?.username || "?")[0].toUpperCase();

  return (
    <div className="relative h-10 w-10 shrink-0">
      {friend?.profilePic ? (
        <img
          src={friend.profilePic}
          alt={friend?.name || friend?.username}
          className="h-full w-full rounded-full border border-surface-variant object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full border border-surface-variant bg-surface-container-high text-sm font-semibold text-on-surface">
          {initial}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
      )}
    </div>
  );
}

export default function ChatWindow({
  friend,
  user,
  messages,
  isLoading,
  text,
  replyTo,
  isSending,
  bottomRef,
  onTextChange,
  onSend,
  onKeyDown,
  onReply,
  onCancelReply,
  onBack,
}) {
  const friendDisplayName = friend?.name || friend?.username || "Loading...";
  const isOwnMessage = (senderId) =>
    senderId === user?._id || senderId?._id === user?._id;

  const friendId = friend?._id?.toString?.() || friend?._id;
  const presence = usePresenceStore((s) => s.presence[friendId]);
  const isFriendOnline = presence?.isOnline ?? friend?.isOnline;
  const lastSeen = presence?.lastSeen ?? friend?.lastSeen;

  const statusLabel = isFriendOnline
    ? "Online"
    : lastSeen
      ? formatLastSeen(lastSeen)
      : "Offline";

  const replyAuthor =
    replyTo &&
    (isOwnMessage(replyTo.senderId)
      ? "You"
      : friend?.name || friend?.username || "them");

  const messageItems = useMemo(
    () => groupMessagesWithDates(messages),
    [messages],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-on-background">
      <header className="z-30 flex h-16 w-full shrink-0 items-center justify-between bg-background px-margin-page">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="text-on-surface transition-transform duration-150 active:scale-95"
            aria-label="Back"
          >
            <MaterialIcon name="arrow_back" />
          </button>

          <div className="flex items-center gap-3">
            <FriendHeaderAvatar friend={friend} online={isFriendOnline} />
            <div className="flex flex-col">
              <h1 className="text-headline-lg-mobile font-semibold leading-tight text-on-surface">
                {friendDisplayName}
              </h1>
              <span className="text-label-sm text-outline">{statusLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-high active:scale-95"
            aria-label="Video call"
          >
            <MaterialIcon name="videocam" />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container-high active:scale-95"
            aria-label="Voice call"
          >
            <MaterialIcon name="call" />
          </button>
        </div>
      </header>

      <main className="no-scrollbar flex min-w-0 flex-grow flex-col gap-gutter-stack overflow-x-hidden overflow-y-auto px-margin-page py-6">
        {isLoading && (
          <p className="py-10 text-center text-body-md text-outline">
            Loading messages...
          </p>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="py-10 text-center text-body-md text-outline">
            No messages yet. Say hi!
          </p>
        )}

        {messageItems.map((item) => {
          if (item.type === "separator") {
            return (
              <div key={item.key} className="my-4 flex justify-center">
                <span className="rounded-full bg-surface-container-low px-4 py-1 text-label-sm uppercase tracking-widest text-outline-variant">
                  {formatDateSeparator(item.date)}
                </span>
              </div>
            );
          }

          const msg = item.message;
          return (
            <ChatBubble
              key={item.key}
              message={msg}
              isMe={isOwnMessage(msg.senderId)}
              onReply={onReply}
            />
          );
        })}

        <div ref={bottomRef} />
      </main>

      <ChatInput
        text={text}
        onTextChange={onTextChange}
        onSend={onSend}
        onKeyDown={onKeyDown}
        disabled={isSending}
        replyTo={replyTo}
        replyAuthor={replyAuthor}
        onCancelReply={onCancelReply}
      />
    </div>
  );
}
