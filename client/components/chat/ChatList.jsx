"use client";

import Link from "next/link";

export default function ChatList({ friends }) {
  return (
    <div className="grid gap-4">
      {friends.map((friend) => (
        <Link
          key={friend._id}
          href={`/chat/${friend._id}`}
          className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-4 transition hover:border-blue-500 hover:bg-slate-900"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-lg font-semibold uppercase text-white shadow-sm shadow-blue-500/20">
              {friend.profilePic ? friend.profilePic[0] : (friend.username || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-100">
                {friend.name || friend.username}
              </p>
              <p className="text-sm text-slate-400">{friend.phone || "No phone available"}</p>
            </div>
          </div>

          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${friend.isOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
            {friend.isOnline ? "Online" : "Offline"}
          </span>
        </Link>
      ))}
    </div>
  );
}
