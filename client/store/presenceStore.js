import { create } from "zustand";

const usePresenceStore = create((set) => ({
  // presence: { [userId]: { isOnline: boolean, lastSeen: Date|null } }
  presence: {},
  setPresence: (userId, presence) =>
    set((state) => ({ presence: { ...state.presence, [userId]: presence } })),
}));

export default usePresenceStore;
