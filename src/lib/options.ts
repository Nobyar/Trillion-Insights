import {
  credentialMode,
  DudeDiligenceLoginError,
  getSiteSession,
  invalidateSiteSession,
  overrideHeaders,
  sessionHeaderAttempts,
} from "@/lib/dudediligence-session";
import { formatExpiry, formatWhen } from "@/lib/format";
import type { ExpirationView, OptionsView, StrikeRow } from "@/lib/types";

const ORIGIN = "https://dudediligence.club";

type CatalogEntry = {
  symbol: string;
  enabled: boolean;
  asOf: string | null;
  label: string;
  kind: string | null;
  sessionDate: string | null;
  sessionsBehind: number | null;
};

type Catalog = {
  bySymbol: Map<string, CatalogEntry>;
  error: string | null;
};

let catalogCache: { at: number; value: Catalog } | null = null;

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "raw" in value) {
    const raw = (value as { raw?: unknown }).raw;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  }
  return null;
}

function strikeOf(value: unknown): number | null {
  const direct = num(value);
  if (direct != null) return direct;
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    return num(row.strike ?? row.price ?? row.k);
  }
  return null;
}

function expiryOf(value: unknown): string | null {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function expiryRows(payload: Record<string, unknown>): Record<string, unknown>[] {
  const candidates = [payload.by_expiry, payload.expiries, payload.per_expiry, payload.boards];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((row) => row && typeof row === "object") as Record<
        string,
        unknown
      >[];
    }
    const record = asRecord(candidate);
    if (record) {
      return Object.entries(record).map(([key, value]) => {
        const row = asRecord(value) ?? {};
        return { expiry: row.expiry ?? key, ...row };
      });
    }
  }
  return [];
}

function sumOi(strikes: Record<string, unknown>[], key: string): number | null {
  let total = 0;
  let seen = false;
  for (const strike of strikes) {
    const value = num(strike[key]);
    if (value == null) continue;
    total += value;
    seen = true;
  }
  return seen ? total : null;
}

function heaviest(strikes: Record<string, unknown>[]): StrikeRow[] {
  const rows: StrikeRow[] = strikes.map((strike) => ({
    strike: num(strike.strike) ?? Number.NaN,
    net: num(strike.net_gex),
    call: num(strike.call_gex),
    put: num(strike.put_gex),
    callOi: num(strike.call_oi),
    putOi: num(strike.put_oi),
  }));
  return rows
    .filter((row) => Number.isFinite(row.strike))
    .sort((a, b) => Math.abs(b.net ?? 0) - Math.abs(a.net ?? 0))
    .slice(0, 12)
    .sort((a, b) => a.strike - b.strike);
}

function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function parseBoard(payload: unknown): {
  asOf: string | null;
  spot: number | null;
  expirations: ExpirationView[];
} {
  const root = asRecord(payload) ?? {};
  const rows = expiryRows(root);
  const today = todayIso();
  const expirations: ExpirationView[] = [];
  for (const row of rows) {
    const expiry = expiryOf(row.expiry ?? row.date ?? row.expiration);
    if (!expiry) continue;
    const strikes = Array.isArray(row.strikes)
      ? (row.strikes.filter((item) => item && typeof item === "object") as Record<
          string,
          unknown
        >[])
      : [];
    const levels = asRecord(row.levels);
    expirations.push({
      expiry,
      netGamma: num(row.net_gex ?? row.netGamma ?? row.total_gex),
      callWall: strikeOf(row.call_wall ?? row.callWall ?? row.posStrike ?? levels?.call_wall),
      putWall: strikeOf(row.put_wall ?? row.putWall ?? row.negStrike ?? levels?.put_wall),
      flip: strikeOf(row.gex_flip ?? row.flip ?? row.zero_gamma ?? levels?.zero_gamma),
      callOi: num(row.call_oi) ?? sumOi(strikes, "call_oi"),
      putOi: num(row.put_oi) ?? sumOi(strikes, "put_oi"),
      forward: num(row.forward),
      strikes: heaviest(strikes),
    });
  }
  expirations.sort((a, b) => a.expiry.localeCompare(b.expiry));
  const upcoming = expirations.filter((row) => row.expiry >= today);
  const chosen = (upcoming.length ? upcoming : expirations).slice(0, 5);
  return {
    asOf: typeof root.as_of === "string" ? root.as_of : null,
    spot: num(root.spot),
    expirations: chosen,
  };
}

async function loadCatalog(): Promise<Catalog> {
  if (catalogCache && Date.now() - catalogCache.at < 10 * 60 * 1000) {
    return catalogCache.value;
  }
  try {
    const res = await fetch(`${ORIGIN}/v1/options/meta`, {
      headers: { Accept: "application/json", "User-Agent": "TrillionInsights/1.0" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`DudeDiligence catalog answered ${res.status}.`);
    const data = (await res.json()) as {
      underlyings?: Array<{
        symbol?: string;
        enabled?: boolean;
        latest_as_of?: string;
        label?: string;
        kind?: string;
        session_date?: string;
        sessions_behind?: number;
      }>;
    };
    const bySymbol = new Map<string, CatalogEntry>();
    for (const row of data.underlyings ?? []) {
      if (!row.symbol) continue;
      bySymbol.set(row.symbol.toUpperCase(), {
        symbol: row.symbol.toUpperCase(),
        enabled: Boolean(row.enabled),
        asOf: row.latest_as_of ?? null,
        label: row.label ?? row.symbol,
        kind: row.kind ?? null,
        sessionDate: row.session_date ?? null,
        sessionsBehind:
          typeof row.sessions_behind === "number" && Number.isFinite(row.sessions_behind)
            ? row.sessions_behind
            : null,
      });
    }
    const value = { bySymbol, error: null };
    catalogCache = { at: Date.now(), value };
    return value;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog failed.";
    return { bySymbol: new Map(), error: message };
  }
}

const API_HEADERS = {
  Accept: "application/json",
  "User-Agent": "TrillionInsights/1.0",
};

async function fetchBoard(
  symbol: string,
  attempts: Record<string, string>[],
): Promise<Response | null> {
  let last: Response | null = null;
  for (const extra of attempts) {
    last = await fetch(`${ORIGIN}/v1/options/gex/${encodeURIComponent(symbol)}?expiries=5`, {
      headers: { ...API_HEADERS, ...extra },
      cache: "no-store",
    });
    if (last.status !== 401 && last.status !== 403) return last;
  }
  return last;
}

async function boardAttempts(force = false): Promise<Record<string, string>[]> {
  const override = overrideHeaders();
  if (override) return [override];
  return sessionHeaderAttempts(await getSiteSession(force));
}

function boardLink(symbol: string): string {
  return `${ORIGIN}/s/${encodeURIComponent(symbol)}/options`;
}

/**
 * Next five expirations from DudeDiligence's gamma board.
 * `/v1/options/meta` is public. `/v1/options/gex/{symbol}` returns 401
 * unless the request carries a signed-in session. The server signs in with
 * DUDEDILIGENCE_EMAIL and DUDEDILIGENCE_PASSWORD when those are set, and
 * retries once after a 401. Cookie and Authorization env vars override that.
 * robots.txt disallows crawling `/v1/`.
 */
export async function loadOptions(
  listingSymbol: string,
  boardSymbol = listingSymbol,
  note: string | null = null,
): Promise<OptionsView> {
  const requested = listingSymbol.toUpperCase();
  const symbol = boardSymbol.toUpperCase();
  const catalog = await loadCatalog();
  const entry = catalog.bySymbol.get(symbol);
  const base = {
    requestedSymbol: requested,
    boardSymbol: symbol,
    note,
    link: boardLink(symbol),
    catalogAsOf: entry?.asOf ?? null,
    catalogKind: entry?.kind ?? null,
    catalogLabel: entry?.label ?? null,
    sessionDate: entry?.sessionDate ?? null,
    sessionsBehind: entry?.sessionsBehind ?? null,
    asOf: null,
    spot: null,
    expirations: [] as ExpirationView[],
  };

  if (catalog.error && catalog.bySymbol.size === 0) {
    return {
      ...base,
      status: "error",
      message: catalog.error,
    };
  }

  if (!entry || !entry.enabled) {
    return {
      ...base,
      status: "not-listed",
      link: `${ORIGIN}/s/${encodeURIComponent(symbol)}`,
      message: `${symbol} is not an enabled options underlying in DudeDiligence's public catalog (/v1/options/meta). A session cookie will not invent a board that the catalog does not list.`,
    };
  }

  const asOf = entry.asOf ? formatWhen(entry.asOf) : "the latest session";
  const mode = credentialMode();
  if (mode === "none") {
    return {
      ...base,
      status: "needs-session",
      message: `DudeDiligence lists ${symbol} in the public catalog. The last snapshot is ${asOf}. Strikes and gamma for the next five expirations need a signed-in account. Set DUDEDILIGENCE_EMAIL and DUDEDILIGENCE_PASSWORD on the server (Vercel → Settings → Environment Variables, then redeploy) and the server signs in by itself. DUDEDILIGENCE_COOKIE and DUDEDILIGENCE_AUTHORIZATION remain optional overrides. The chain is not filled in from anywhere else.`,
    };
  }
  if (mode === "incomplete") {
    return {
      ...base,
      status: "needs-session",
      message: `DudeDiligence lists ${symbol}, snapshot ${asOf}, but the sign-in pair is incomplete. Set both DUDEDILIGENCE_EMAIL (or DUDEDILIGENCE_USERNAME) and DUDEDILIGENCE_PASSWORD, then redeploy. The chain is not filled in from anywhere else.`,
    };
  }

  try {
    const attempts = await boardAttempts();
    let res = await fetchBoard(symbol, attempts);
    if (!res) {
      return {
        ...base,
        status: "error",
        message: `No DudeDiligence session headers were available for ${symbol}.`,
      };
    }
    if ((res.status === 401 || res.status === 403) && mode === "password") {
      invalidateSiteSession();
      const retry = await boardAttempts(true);
      res = (await fetchBoard(symbol, retry)) ?? res;
    }
    if (res.status === 401 || res.status === 403) {
      return {
        ...base,
        status: "rejected",
        message:
          mode === "override"
            ? `DudeDiligence refused the DUDEDILIGENCE_COOKIE / DUDEDILIGENCE_AUTHORIZATION override (${res.status}). Paste a fresh session, or remove the override and set DUDEDILIGENCE_EMAIL and DUDEDILIGENCE_PASSWORD. Catalog snapshot: ${asOf}.`
            : `DudeDiligence refused the signed-in session (${res.status}) after an automatic re-login. Catalog snapshot: ${asOf}.`,
      };
    }
    if (res.status === 404) {
      return {
        ...base,
        status: "not-listed",
        message: `DudeDiligence has ${symbol} in the catalog but returned 404 for the gamma board.`,
      };
    }
    if (!res.ok) {
      return {
        ...base,
        status: "error",
        message: `DudeDiligence answered ${res.status} for ${symbol}.`,
      };
    }
    const payload = (await res.json()) as unknown;
    const board = parseBoard(payload);
    if (!board.expirations.length) {
      return {
        ...base,
        status: "empty",
        asOf: board.asOf,
        spot: board.spot,
        message: `The ${symbol} board came back without expiration rows. The parser looks for by_expiry, expiries, or per_expiry, with net_gex, call_wall, put_wall, and gex_flip.`,
      };
    }
    return {
      ...base,
      status: "ready",
      asOf: board.asOf,
      spot: board.spot,
      expirations: board.expirations,
      message: `Next ${board.expirations.length} expirations from DudeDiligence${board.asOf ? `, as of ${formatWhen(board.asOf)}` : ""}. Net gamma is the site's dollar figure per 1% move.`,
    };
  } catch (error) {
    if (error instanceof DudeDiligenceLoginError) {
      return {
        ...base,
        status: "rejected",
        message: `${error.message} Catalog snapshot: ${asOf}.`,
      };
    }
    return {
      ...base,
      status: "error",
      message: "The DudeDiligence options request failed before a board came back.",
    };
  }
}

export const IBIT_OPTIONS_HEADING = "IBIT (iShares Bitcoin Trust) options";

export function expiryLabel(expiry: string): string {
  return formatExpiry(expiry);
}
