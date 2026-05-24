"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MaterialIcon from "./MaterialIcon";

const tabs = [
  {
    href: "/chat",
    label: "Chat",
    icon: "chat_bubble",
    match: (path) => path.startsWith("/chat"),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: "group",
    match: (path) => path.startsWith("/friends"),
  },
  {
    href: "/setup",
    label: "Profile",
    icon: "person",
    match: (path) => path.startsWith("/setup"),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around bg-surface-container px-6">
      {tabs.map((tab) => {
        const isActive = tab.match(pathname);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-1 transition-opacity active:scale-95 ${
              isActive ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            <MaterialIcon name={tab.icon} filled={isActive} />
            <span className="text-label-sm font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
