"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";

export default function GuestRoute({ children }) {
  const router = useRouter();
  const { user, isAuthReady } = useAuthStore();

  useEffect(() => {
    if (isAuthReady && user) {
      router.replace("/chat");
    }
  }, [isAuthReady, user, router]);

  if (!isAuthReady) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return children;
}
