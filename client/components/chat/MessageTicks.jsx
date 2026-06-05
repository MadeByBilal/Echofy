"use client";

export default function MessageTicks({ status }) {
  const single = status === "sent";

  const color =
    status === "seen"
      ? "text-blue-400"
      : "text-white/50";

  return (
    <span className={`inline-flex items-center ${color}`}>
      <svg
        viewBox="0 0 16 15"
        className="h-4 w-4"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512z" />
        {!single && (
          <path d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
        )}
      </svg>
    </span>
  );
}
