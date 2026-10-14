import type { BitcoinChain } from "@/lib/types";

/**
 * timechainstats.com is a static dashboard. Its live board is the public
 * Sidewinder snapshots on 2140data.net (same key the page script ships) and
 * the unauthenticated Diamondback routes on 2140data.com. The key is read from
 * the public script at runtime, or from TIMECHAIN_API_KEY, and is never logged.
 */

const HOME_URL = "https://timechainstats.com/";
const SIDEWINDER_ORIGIN = "https://2140data.net/api";
const DIAMONDBACK_ORIGIN = "https://2140data.com/api";
const USER_AGENT = "Mozilla/5.0 (compatible; TrillionInsights/1.0)";
const KEY_TTL_MS = 6 * 60 * 60 * 1000;
const KEY_PATTERN = /apiKey:"([A-Z0-9]{20,80})"/;

type KeyCache = { value: string; expiresAt: number };

let keyCache: KeyCache | null = null;
let keyInflight: Promise<string | null> | null = null;

export type TimechainQuote = {
  price: number;
  marketCapUsd: number;
  changePct: number | null;
  supplyBtc: number | null;
};

export type TimechainSnapshot = {
  quote: TimechainQuote | null;
  chain: BitcoinChain | null;
};

export async function loadTimechainSnapshot(): Promise<TimechainSnapshot> {
  const key = await timechainKey();
  const [s06, s03, diamond, fees, mempool] = await Promise.all([
    key ? sidewinder("s06", key) : Promise.resolve(null),
    key ? sidewinder("s03", key) : Promise.resolve(null),
    getJson(`${DIAMONDBACK_ORIGIN}/blockchain/stats`),
    getJson(`${DIAMONDBACK_ORIGIN}/fees/recommended`),
    getJson(`${DIAMONDBACK_ORIGIN}/mempool`),
  ]);
  const quote = readQuote(s06, s03);
  return { quote, chain: readChain(s03, s06, quote?.supplyBtc ?? null, diamond, fees, mempool) };
}

async function timechainKey(): Promise<string | null> {
  const fromEnv = process.env.TIMECHAIN_API_KEY?.trim();
  if (fromEnv && /^[A-Za-z0-9_-]{16,128}$/.test(fromEnv)) return fromEnv;
  if (keyCache && keyCache.expiresAt > Date.now()) return keyCache.value;
  if (!keyInflight) {
    keyInflight = discoverKey().finally(() => {
      keyInflight = null;
    });
  }
  return keyInflight;
}

async function discoverKey(): Promise<string | null> {
  try {
    const home = await getText(HOME_URL);
    const src = home?.match(/\/static\/js\/main\.[a-zA-Z0-9]+\.js/)?.[0];
    if (!src) return null;
    const scriptUrl = new URL(src, HOME_URL).href;
    const ranged = await getText(scriptUrl, { Range: "bytes=-220000" });
    const key = extractKey(ranged) ?? extractKey(await getText(scriptUrl));
    if (!key) return null;
    keyCache = { value: key, expiresAt: Date.now() + KEY_TTL_MS };
    return key;
  } catch {
    return null;
  }
}

function extractKey(source: string | null): string | null {
  if (!source) return null;
  return source.match(KEY_PATTERN)?.[1] ?? null;
}

async function sidewinder(path: string, key: string): Promise<unknown | null> {
  return getJson(`${SIDEWINDER_ORIGIN}/${path}/latest`, { "x-api-key": key });
}

async function getJson(url: string, headers?: Record<string, string>): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getText(url: string, headers?: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "text/html,application/javascript,*/*",
        "User-Agent": USER_AGENT,
        ...headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok && res.status !== 206) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function readQuote(s06: unknown, s03: unknown): TimechainQuote | null {
  const market = asRecord(asRecord(asRecord(asRecord(s06)?.s06)?.bitcoin)?.market_data);
  const chain = asRecord(asRecord(asRecord(asRecord(s03)?.s03)?.bitcoin_stats)?.bitcoin_data);
  const price = usd(market?.current_price) ?? finite(chain?.market_price_usd);
  const marketCapUsd = usd(market?.market_cap) ?? finite(chain?.market_cap_usd);
  if (price == null || price <= 0 || marketCapUsd == null || marketCapUsd <= 0) return null;
  const changePct =
    usd(market?.price_change_percentage_24h) ??
    finite(chain?.market_price_usd_change_24h_percentage);
  const supplyBtc = positive(usd(market?.circulating_supply));
  return { price, marketCapUsd, changePct, supplyBtc };
}

function readChain(
  s03: unknown,
  s06: unknown,
  supplyFromQuote: number | null,
  diamond: unknown,
  fees: unknown,
  mempool: unknown,
): BitcoinChain | null {
  const stats = asRecord(asRecord(asRecord(asRecord(s03)?.s03)?.bitcoin_stats)?.bitcoin_data);
  const halving = asRecord(asRecord(asRecord(asRecord(s03)?.s03)?.halvening)?.bitcoin_data);
  const market = asRecord(asRecord(asRecord(asRecord(s06)?.s06)?.bitcoin)?.market_data);
  const board = asRecord(diamond);
  const recommended = asRecord(fees);
  const pool = asRecord(mempool);
  const supplyBtc = supplyFromQuote ?? supplyBtcFrom(stats?.circulation);
  const maxSupply = positive(usd(market?.max_supply)) ?? 21_000_000;
  const chain: BitcoinChain = {
    blockHeight:
      positive(finite(stats?.best_block_height)) ??
      positive(finite(stats?.blocks)) ??
      positive(finite(board?.latestBlockHeight)),
    hashrateEhs: hashrateEhs(stats?.hashrate_24h) ?? hashrateEhs(board?.hashrate),
    supplyBtc,
    difficulty: positive(finite(stats?.difficulty)) ?? positive(finite(board?.difficulty)),
    medianFeeUsd: positive(finite(stats?.median_transaction_fee_usd_24h)),
    fastestFeeSat:
      positive(finite(stats?.suggested_transaction_fee_per_byte_sat)) ??
      positive(finite(recommended?.fastestFee)),
    transactions24h:
      positive(finite(stats?.transactions_24h)) ?? positive(finite(board?.transactions_24h)),
    percentMined:
      supplyBtc != null && maxSupply > 0 ? (supplyBtc / maxSupply) * 100 : null,
    halvingAt: halvingDate(halving?.halvening_time),
    blocksToHalving: positive(finite(halving?.blocks_left)),
    mempoolCount:
      positive(finite(stats?.mempool_transactions)) ?? positive(finite(pool?.count)),
    mempoolBytes:
      positive(finite(stats?.mempool_size)) ??
      positive(finite(pool?.vsize)) ??
      positive(finite(pool?.bytes)),
    nodes: positive(finite(stats?.nodes)),
  };
  return Object.values(chain).some((value) => value != null) ? chain : null;
}

function halvingDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  const iso = trimmed.includes("T") ? trimmed : `${trimmed.replace(" ", "T")}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return trimmed;
  return date.toISOString();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function finite(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function positive(value: number | null): number | null {
  if (value == null || value <= 0) return null;
  return value;
}

/** CoinGecko-shaped fields are either a number or `{ usd: number }`. */
function usd(value: unknown): number | null {
  const direct = finite(value);
  if (direct != null) return direct;
  return finite(asRecord(value)?.usd);
}

/** Sidewinder hashrate is H/s. Diamondback hashrate is already EH/s. */
function hashrateEhs(value: unknown): number | null {
  const raw = positive(finite(value));
  if (raw == null) return null;
  return raw > 1e15 ? raw / 1e18 : raw;
}

/** Circulation above 1e12 is satoshis. The quote supply is already coins. */
function supplyBtcFrom(value: unknown): number | null {
  const raw = positive(finite(value));
  if (raw == null) return null;
  return raw > 1e12 ? raw / 1e8 : raw;
}
