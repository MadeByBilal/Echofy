export function formatLastMessageTime(date) {
  if (!date) return "";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Now";

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const time = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return time;

  if (isYesterday) {
    return `Yesterday, ${time}`;
  }

  const datePart = d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  const yearPart =
    d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : "";

  return `${datePart}${yearPart}, ${time}`;
}

export function formatLastSeen(date) {
  if (!date) return "Away";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Away";

  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Active now";
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Last seen yesterday";
  if (diffDays < 7) return `Last seen ${diffDays}d ago`;

  return `Last seen ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export function formatMessageTime(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDateSeparator(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const datePart = d.toLocaleDateString([], { month: "short", day: "numeric" });

  if (isToday) return `Today, ${datePart}`;
  if (isYesterday) return `Yesterday, ${datePart}`;

  return d.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function groupMessagesWithDates(messages) {
  const items = [];
  let lastDateKey = null;

  messages.forEach((message) => {
    const d = new Date(message.createdAt);
    const dateKey = Number.isNaN(d.getTime())
      ? "unknown"
      : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    if (dateKey !== lastDateKey) {
      items.push({
        type: "separator",
        date: message.createdAt,
        key: `sep-${dateKey}`,
      });
      lastDateKey = dateKey;
    }

    items.push({ type: "message", message, key: message._id });
  });

  return items;
}
