"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import useAuthStore from "@/store/authStore";
import usePresenceStore from "@/store/presenceStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default function CreateGroupPage() {
  return <ProtectedRoute><CreateGroupContent /></ProtectedRoute>;
}

function CreateGroupContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const presence = usePresenceStore((s) => s.presence);

  const [friends, setFriends] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosInstance.get("/friends").then((res) => setFriends(res.data.friends || [])).catch(console.log);
  }, []);

  const toggle = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const create = async () => {
    if (!name.trim()) { setError("Group name is required"); return; }
    if (selectedIds.length === 0) { setError("Select at least one friend"); return; }
    setError("");
    setIsCreating(true);
    try {
      const res = await axiosInstance.post("/groups/create", { name: name.trim(), description: description.trim(), memberIds: selectedIds });
      router.push(`/group/${res.data.group._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally { setIsCreating(false); }
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-4 bg-background px-margin-page">
        <button type="button" onClick={() => router.back()} className="text-on-surface" aria-label="Back"><MaterialIcon name="arrow_back" /></button>
        <h1 className="text-headline-lg-mobile font-semibold text-on-surface">New Group</h1>
        <button type="button" onClick={create} disabled={isCreating || !name.trim() || selectedIds.length === 0} className="ml-auto rounded-full bg-primary px-5 py-2 text-label-sm font-semibold text-on-primary transition-opacity disabled:opacity-40">Create</button>
      </header>

      <main className="flex-1 overflow-y-auto px-margin-page">
        {error && <p className="mt-4 rounded-xl bg-error-container/20 px-4 py-3 text-body-md text-error">{error}</p>}

        <div className="mt-4 space-y-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="w-full rounded-xl border border-surface-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface outline-none placeholder:text-outline-variant focus:border-outline" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Group description (optional)" rows={2} className="w-full rounded-xl border border-surface-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface outline-none placeholder:text-outline-variant focus:border-outline resize-none" />
        </div>

        <p className="mt-6 mb-3 text-label-sm uppercase tracking-wider text-outline-variant">Add members</p>

        {friends.length === 0 && <p className="py-10 text-center text-body-md text-outline">No friends to add.</p>}

        <div className="space-y-1 pb-8">
          {friends.map((friend) => {
            const fid = friend._id?.toString?.() || friend._id;
            const online = presence[fid]?.isOnline ?? false;
            const selected = selectedIds.includes(fid);
            return (
              <div key={fid} onClick={() => toggle(fid)} className={`flex cursor-pointer items-center gap-4 rounded-2xl p-3 transition-colors ${selected ? "bg-primary/10" : "hover:bg-surface-container-low"}`}>
                <div className="relative h-12 w-12 shrink-0">
                  {friend.profilePic ? <img src={friend.profilePic} alt={friend.name} className="h-full w-full rounded-full object-cover" /> : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-container-high text-base font-semibold text-on-surface">{(friend.name || friend.username || "?")[0].toUpperCase()}</div>
                  )}
                  {online && <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body-md font-semibold text-on-surface">{friend.name || friend.username}</p>
                  <p className="text-label-sm text-outline">{friend.bio || "No bio"}</p>
                </div>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected ? "border-primary bg-primary" : "border-outline-variant"}`}>
                  {selected && <MaterialIcon name="check" className="text-[14px] text-on-primary" />}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
