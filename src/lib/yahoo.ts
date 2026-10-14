const UA =
  "Mozilla/5.0 (compatible; TrillionDesk/1.0; +https://localhost; market-data)";

type Session = { cookie: string; crumb: string; expires: number };

let session: Session | null = null;

function cookieHeader(res: Response): string {
  const list =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  const parts = list
    .map((row) => row.split(";")[0]?.trim())
    .filter((row): row is string => Boolean(row));
  return parts.join("; ");
}

export async function yahooSession(): Promise<Session> {
  if (session && session.expires > Date.now()) return session;

  const seed = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA },
    redirect: "manual",
    cache: "no-store",
  });
  let cookie = cookieHeader(seed);
  const crumbRes = await fetch(
    "https://query1.finance.yahoo.com/v1/test/getcrumb",
    {
      headers: { "User-Agent": UA, Cookie: cookie },
      cache: "no-store",
    },
  );
  cookie = [cookie, cookieHeader(crumbRes)].filter(Boolean).join("; ");
  const crumb = (await crumbRes.text()).trim();
  if (!crumbRes.ok || !crumb || crumb.startsWith("{") || crumb.startsWith("<")) {
    throw new Error("Yahoo Finance did not return a crumb for quotes.");
  }
  session = { cookie, crumb, expires: Date.now() + 20 * 60 * 1000 };
  return session;
}

export async function yahooJson<T>(
  url: string,
  init?: { method?: string; body?: string; session?: Session },
): Promise<T> {
  const headers: Record<string, string> = {
    "User-Agent": UA,
    Accept: "application/json",
  };
  if (init?.session) {
    headers.Cookie = init.session.cookie;
  }
  if (init?.body) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers,
    body: init?.body,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Yahoo Finance answered ${res.status} for ${new URL(url).pathname}.`);
  }
  return (await res.json()) as T;
}

export type YahooQuote = {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  marketCap?: number;
  currency?: string;
  fullExchangeName?: string;
  quoteType?: string;
};

export function readQuote(raw: YahooQuote): {
  symbol: string;
  legalName: string;
  price: number;
  changePct: number | null;
  marketCap: number;
  currency: string;
  exchange: string;
} | null {
  if (!raw.symbol || raw.regularMarketPrice == null || raw.marketCap == null) {
    return null;
  }
  if (!Number.isFinite(raw.regularMarketPrice) || !Number.isFinite(raw.marketCap)) {
    return null;
  }
  const legal = (raw.longName || raw.shortName || raw.symbol).replace(/\s+/g, " ").trim();
  return {
    symbol: raw.symbol,
    legalName: legal,
    price: raw.regularMarketPrice,
    changePct:
      raw.regularMarketChangePercent == null ||
      !Number.isFinite(raw.regularMarketChangePercent)
        ? null
        : raw.regularMarketChangePercent,
    marketCap: raw.marketCap,
    currency: raw.currency || "USD",
    exchange: raw.fullExchangeName || "",
  };
}
