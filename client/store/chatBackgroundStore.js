import { create } from "zustand";

const STORAGE_KEY = "chatBg";

const BACKGROUNDS = {
  default: "",
  pink: "bg-gradient-to-br from-[#2a1a1a] via-[#1f1414] to-[#1a0f0f]",
  gray: "bg-gradient-to-br from-[#1c1c1c] via-[#161616] to-[#121212]",
  blue: "bg-gradient-to-br from-[#0f1a2e] via-[#0d1524] to-[#0a101c]",
  green: "bg-gradient-to-br from-[#0f1f14] via-[#0d1a10] to-[#0a140c]",
  purple: "bg-gradient-to-br from-[#1e0f2e] via-[#160d24] to-[#120a1c]",
  orange: "bg-gradient-to-br from-[#2a1a0f] via-[#1f140d] to-[#1a0f0a]",
  teal: "bg-gradient-to-br from-[#0f1f1f] via-[#0d1a1a] to-[#0a1414]",
};

const getInitial = () => {
  if (typeof window === "undefined") return "default";
  try {
    return localStorage.getItem(STORAGE_KEY) || "default";
  } catch {
    return "default";
  }
};

const useChatBackgroundStore = create((set) => ({
  bg: getInitial(),
  setBg: (key) => {
    try { localStorage.setItem(STORAGE_KEY, key); } catch {}
    set({ bg: key });
  },
}));

export { BACKGROUNDS };
export default useChatBackgroundStore;
