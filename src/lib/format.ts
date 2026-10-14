export const TRILLION = 1_000_000_000_000;
export const NEAR_FLOOR = 700_000_000_000;

export function formatMoney(usd: number): string {
  const sign = usd < 0 ? "−" : "";
  const abs = Math.abs(usd);
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatCount(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${Math.round(abs)}`;
}

export function formatPrice(value: number, currency: string): string {
  const cur = currency === "GBp" ? "GBP" : currency === "ZAc" ? "ZAR" : currency;
  const digits = value >= 1000 ? 0 : value >= 1 ? 2 : 4;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: digits,
      minimumFractionDigits: Math.min(2, digits),
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatChange(pct: number | null): {
  text: string;
  dir: "up" | "down" | "flat";
} {
  if (pct == null || !Number.isFinite(pct)) return { text: "—", dir: "flat" };
  const dir = pct > 0.005 ? "up" : pct < -0.005 ? "down" : "flat";
  const sign = pct > 0 ? "+" : "";
  return { text: `${sign}${pct.toFixed(2)}%`, dir };
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function formatExpiry(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function lineGap(marketCapUsd: number): string {
  const gap = marketCapUsd - TRILLION;
  if (gap >= 0) return `${formatMoney(gap)} above the line`;
  return `${formatMoney(-gap)} under the line`;
}

export function rankLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}
