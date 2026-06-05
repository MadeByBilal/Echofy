"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import MaterialIcon from "./MaterialIcon";

export default function NotificationToast() {
  const router = useRouter();
  const [toast, setToast] = useState(null);

  const show = useCallback(({ name, body, senderId }) => {
    setToast({ name, body, senderId });
  }, []);

  useEffect(() => {
    const handler = (e) => show(e.detail);
    window.addEventListener("app:message", handler);
    return () => window.removeEventListener("app:message", handler);
  }, [show]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[9999] flex justify-center px-4 pt-4">
      <button
        onClick={() => {
          window.focus();
          router.push(`/chat/${toast.senderId}`);
          setToast(null);
        }}
        className="animate-slide-down flex w-full max-w-md items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-high p-4 text-left shadow-2xl backdrop-blur-xl"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <MaterialIcon name="notifications" className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-md font-semibold text-on-surface">
            {toast.name}
          </p>
          <p className="truncate text-body-sm text-outline">{toast.body}</p>
        </div>
        <MaterialIcon
          name="close"
          className="shrink-0 text-outline-variant"
          onClick={(e) => {
            e.stopPropagation();
            setToast(null);
          }}
        />
      </button>
    </div>
  );
}
