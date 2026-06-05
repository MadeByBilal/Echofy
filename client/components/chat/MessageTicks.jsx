"use client";

export default function MessageTicks({ status }) {
  const color =
    status === "seen"
      ? "text-blue-400"
      : "text-white/40";

  return (
    <span className={`inline-flex ${color}`}>
      <svg
        viewBox="0 0 16 15"
        className="h-3.5 w-3.5"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512z" />
      </svg>
    </span>
  );
}
