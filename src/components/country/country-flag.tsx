/* eslint-disable @next/next/no-img-element -- FlagCDN serves fixed, tiny country assets; native images avoid Next's aspect-ratio warning for flags with different proportions. */
import { Globe2 } from "lucide-react";

const nameToCode: Record<string, string> = {
  australia: "AU", canada: "CA", china: "CN", germany: "DE", hungary: "HU",
  ireland: "IE", japan: "JP", malaysia: "MY", netherlands: "NL", "new zealand": "NZ",
  "saudi arabia": "SA", singapore: "SG", "south korea": "KR", turkey: "TR",
  "united kingdom": "GB", uk: "GB", "united states": "US", usa: "US",
  france: "FR", sweden: "SE", finland: "FI",
};

export function normalizeCountryCode(code?: string | null, name?: string | null) {
  const raw = (code || "").trim().toUpperCase();
  const candidate = (/^[A-Z]{2}$/.test(raw) ? raw : nameToCode[(name || "").trim().toLowerCase()] || "").trim().toUpperCase();
  if (candidate === "UK") return "GB";
  return /^[A-Z]{2}$/.test(candidate) ? candidate : "";
}

export function countryEmoji(code?: string | null, name?: string | null) {
  const normalized = normalizeCountryCode(code, name);
  if (!normalized) return "";
  return String.fromCodePoint(...Array.from(normalized).map((letter) => 127397 + letter.charCodeAt(0)));
}

export function CountryFlag({ code, name, compact = false }: { code?: string | null; name?: string | null; compact?: boolean }) {
  const normalized = normalizeCountryCode(code, name);
  return <span className={`country-identity${compact ? " country-identity--compact" : ""}`} aria-label={name || normalized || "International"}>
    <span className="country-identity__flag" aria-hidden="true">{normalized ? <img src={`https://flagcdn.com/w40/${normalized.toLowerCase()}.png`} alt="" width={28} height={20} /> : <Globe2 size={18} />}</span>
    {!compact && <span className="country-identity__name">{name || normalized || "International"}</span>}
  </span>;
}
