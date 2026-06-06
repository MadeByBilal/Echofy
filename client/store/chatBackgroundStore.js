import { create } from "zustand";

const STORAGE_KEY = "chatBg";
const CUSTOM_COLOR_KEY = "chatBgCustom";

const BACKGROUNDS = {
  default: { bg: "", swatch: "#1c1b1b" },
  whatsapp: { bg: "", swatch: "#1c1b1b" },
  pink: { bg: "bg-gradient-to-br from-[#3a1420] via-[#2a0f18] to-[#1a0a10]", swatch: "#d6487a" },
  gray: { bg: "bg-gradient-to-br from-[#2a2a2a] via-[#1e1e1e] to-[#141414]", swatch: "#889096" },
  blue: { bg: "bg-gradient-to-br from-[#0f1f3a] via-[#0c1628] to-[#080e1a]", swatch: "#4a7ed6" },
  green: { bg: "bg-gradient-to-br from-[#0f2a1a] via-[#0c1f14] to-[#08140c]", swatch: "#3db86b" },
  purple: { bg: "bg-gradient-to-br from-[#24143a] via-[#1a0e28] to-[#10081a]", swatch: "#8b62d6" },
  orange: { bg: "bg-gradient-to-br from-[#3a2410] via-[#2a1a0c] to-[#1a1008]", swatch: "#d68a3a" },
  teal: { bg: "bg-gradient-to-br from-[#0f2a2a] via-[#0c1f1f] to-[#081414]", swatch: "#3db8b8" },
};

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function darken({ r, g, b }, factor) {
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

function buildCustomStyle(hex) {
  const rgb = hexToRgb(hex);
  return {
    background: `linear-gradient(135deg, ${darken(rgb, 0.15)} 0%, ${darken(rgb, 0.1)} 50%, ${darken(rgb, 0.05)} 100%)`,
  };
}

const getInitial = () => {
  if (typeof window === "undefined") return "default";
  try {
    return localStorage.getItem(STORAGE_KEY) || "default";
  } catch {
    return "default";
  }
};

const getInitialColor = () => {
  if (typeof window === "undefined") return "#4a7ed6";
  try {
    return localStorage.getItem(CUSTOM_COLOR_KEY) || "#4a7ed6";
  } catch {
    return "#4a7ed6";
  }
};

const useChatBackgroundStore = create((set, get) => ({
  bg: getInitial(),
  customColor: getInitialColor(),
  setBg: (key) => {
    try { localStorage.setItem(STORAGE_KEY, key); } catch {}
    set({ bg: key });
  },
  setCustomColor: (hex) => {
    try { localStorage.setItem(CUSTOM_COLOR_KEY, hex); } catch {}
    set({ customColor: hex });
  },
  getCustomBgStyle: () => buildCustomStyle(get().customColor),
}));

export { BACKGROUNDS };
export default useChatBackgroundStore;
