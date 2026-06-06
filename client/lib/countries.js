export const countries = [
  { code: "AF", name: "Afghanistan", prefix: "93", length: 10, startsWith: ["07"] },
  { code: "DZ", name: "Algeria", prefix: "213", length: 10, startsWith: ["05", "06", "07"] },
  { code: "AR", name: "Argentina", prefix: "54", length: 13, startsWith: ["15"] },
  { code: "BD", name: "Bangladesh", prefix: "880", length: 11, startsWith: ["01"] },
  { code: "BR", name: "Brazil", prefix: "55", length: 11, startsWith: [] },
  { code: "CA", name: "Canada", prefix: "1", length: 11, startsWith: ["1"] },
  { code: "CN", name: "China", prefix: "86", length: 11, startsWith: ["1"] },
  { code: "CO", name: "Colombia", prefix: "57", length: 10, startsWith: ["3"] },
  { code: "CD", name: "DR Congo", prefix: "243", length: 10, startsWith: ["08", "09"] },
  { code: "EG", name: "Egypt", prefix: "20", length: 11, startsWith: ["010", "011", "012", "015"] },
  { code: "ET", name: "Ethiopia", prefix: "251", length: 10, startsWith: ["09", "07"] },
  { code: "FR", name: "France", prefix: "33", length: 10, startsWith: ["06", "07"] },
  { code: "DE", name: "Germany", prefix: "49", length: 11, startsWith: ["015", "016", "017"] },
  { code: "IN", name: "India", prefix: "91", length: 10, startsWith: ["6", "7", "8", "9"] },
  { code: "ID", name: "Indonesia", prefix: "62", length: 11, startsWith: ["08"] },
  { code: "IR", name: "Iran", prefix: "98", length: 11, startsWith: ["09"] },
  { code: "IQ", name: "Iraq", prefix: "964", length: 11, startsWith: ["07"] },
  { code: "IT", name: "Italy", prefix: "39", length: 10, startsWith: ["3"] },
  { code: "JP", name: "Japan", prefix: "81", length: 11, startsWith: ["070", "080", "090"] },
  { code: "KE", name: "Kenya", prefix: "254", length: 10, startsWith: ["07", "01"] },
  { code: "MX", name: "Mexico", prefix: "52", length: 10, startsWith: [] },
  { code: "MM", name: "Myanmar", prefix: "95", length: 9, startsWith: ["09"] },
  { code: "MA", name: "Morocco", prefix: "212", length: 10, startsWith: ["06", "07"] },
  { code: "NG", name: "Nigeria", prefix: "234", length: 11, startsWith: ["07", "08", "09"] },
  { code: "PK", name: "Pakistan", prefix: "92", length: 11, startsWith: ["03"] },
  { code: "PH", name: "Philippines", prefix: "63", length: 11, startsWith: ["09"] },
  { code: "PL", name: "Poland", prefix: "48", length: 9, startsWith: [] },
  { code: "RU", name: "Russia", prefix: "7", length: 11, startsWith: ["8"] },
  { code: "SA", name: "Saudi Arabia", prefix: "966", length: 10, startsWith: ["05"] },
  { code: "ZA", name: "South Africa", prefix: "27", length: 10, startsWith: ["06", "07", "08"] },
  { code: "KR", name: "South Korea", prefix: "82", length: 11, startsWith: ["010"] },
  { code: "ES", name: "Spain", prefix: "34", length: 9, startsWith: ["6", "7"] },
  { code: "SD", name: "Sudan", prefix: "249", length: 10, startsWith: ["09", "01"] },
  { code: "TZ", name: "Tanzania", prefix: "255", length: 10, startsWith: ["06", "07"] },
  { code: "TH", name: "Thailand", prefix: "66", length: 10, startsWith: ["06", "08", "09"] },
  { code: "TR", name: "Turkey", prefix: "90", length: 11, startsWith: ["05"] },
  { code: "UG", name: "Uganda", prefix: "256", length: 10, startsWith: ["07"] },
  { code: "GB", name: "United Kingdom", prefix: "44", length: 11, startsWith: ["07"] },
  { code: "US", name: "United States", prefix: "1", length: 11, startsWith: ["1"] },
  { code: "VN", name: "Vietnam", prefix: "84", length: 10, startsWith: ["03", "05", "07", "08", "09"] },
];

export function getCountryByCode(code) {
  return countries.find((c) => c.code === code) || null;
}

export function validatePhone(phone, country) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return { error: "Phone number is required" };
  if (digits.length !== country.length) {
    return { error: `Phone must be exactly ${country.length} digits for ${country.name}` };
  }
  if (country.startsWith.length > 0) {
    const valid = country.startsWith.some((s) => digits.startsWith(s));
    if (!valid) {
      const prefixes = country.startsWith.join(", ");
      return { error: `Phone must start with ${prefixes} for ${country.name}` };
    }
  }
  return { error: null, digits };
}

export function formatPhoneWithPrefix(phone, country) {
  const digits = phone.replace(/\D/g, "");
  return `+${country.prefix}${digits}`;
}

const flagEmojis = {
  AF: "🇦🇫", DZ: "🇩🇿", AR: "🇦🇷", BD: "🇧🇩", BR: "🇧🇷", CA: "🇨🇦",
  CN: "🇨🇳", CO: "🇨🇴", CD: "🇨🇩", EG: "🇪🇬", ET: "🇪🇹", FR: "🇫🇷",
  DE: "🇩🇪", IN: "🇮🇳", ID: "🇮🇩", IR: "🇮🇷", IQ: "🇮🇶", IT: "🇮🇹",
  JP: "🇯🇵", KE: "🇰🇪", MX: "🇲🇽", MM: "🇲🇲", MA: "🇲🇦", NG: "🇳🇬",
  PK: "🇵🇰", PH: "🇵🇭", PL: "🇵🇱", RU: "🇷🇺", SA: "🇸🇦", ZA: "🇿🇦",
  KR: "🇰🇷", ES: "🇪🇸", SD: "🇸🇩", TZ: "🇹🇿", TH: "🇹🇭", TR: "🇹🇷",
  UG: "🇺🇬", GB: "🇬🇧", US: "🇺🇸", VN: "🇻🇳",
};

export function getFlag(code) {
  return flagEmojis[code] || "🌍";
}
