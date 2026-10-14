import type { HistorySeries, SeriesPoint } from "@/lib/types";

type ChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
    error?: { description?: string } | null;
  };
};

const FROM_2005 = Date.UTC(2005, 0, 1);

function monthlyLast(points: SeriesPoint[]): SeriesPoint[] {
  const buckets = new Map<string, SeriesPoint>();
  for (const point of points) {
    const date = new Date(point.t);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    buckets.set(key, point);
  }
  return [...buckets.values()];
}

export async function loadScaledSeries(
  symbol: string,
  marketCapUsd: number,
): Promise<HistorySeries> {
  const caption =
    "Monthly closes from 2005, or the whole listing if it is younger. Each point is scaled so the latest close matches the live dollar market cap. Buybacks and new shares are not replayed, so older points are a shape, not an official filing.";
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=max&interval=1mo`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrillionDesk/1.0)" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Price history answered ${res.status}.`);
    const data = (await res.json()) as ChartResponse;
    const result = data.chart?.result?.[0];
    const times = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const pairs: SeriesPoint[] = [];
    for (let i = 0; i < times.length; i++) {
      const close = closes[i];
      if (close == null || !Number.isFinite(close) || close <= 0) continue;
      pairs.push({ t: times[i] * 1000, v: close });
    }
    if (pairs.length < 2) {
      return {
        points: [],
        scale: "linear",
        caption,
        error: "Yahoo did not return a monthly price series for this listing.",
        crossedAt: null,
      };
    }
    const last = pairs[pairs.length - 1].v;
    const scaled = pairs.map((point) => ({
      t: point.t,
      v: (point.v / last) * marketCapUsd,
    }));
    const recent = scaled.filter((point) => point.t >= FROM_2005);
    const points = recent.length >= 8 ? recent : scaled;
    return { points, scale: "linear", caption, error: null, crossedAt: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "History failed.";
    return { points: [], scale: "linear", caption, error: message, crossedAt: null };
  }
}

type BlockchainChart = {
  values?: Array<{ x: number; y: number }>;
};

export async function loadBitcoinSeries(liveCap: number | null): Promise<HistorySeries> {
  const caption =
    "Dollar market cap of coins in circulation, from Blockchain.com, sampled down to one point a month and drawn on a log scale. The last point is the live CoinGecko cap when that quote loaded.";
  try {
    const res = await fetch(
      "https://api.blockchain.info/charts/market-cap?timespan=all&format=json&sampled=true",
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TrillionDesk/1.0)" },
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error(`Blockchain.com answered ${res.status}.`);
    const data = (await res.json()) as BlockchainChart;
    const raw: SeriesPoint[] = [];
    for (const row of data.values ?? []) {
      if (!Number.isFinite(row.y) || row.y <= 0) continue;
      raw.push({ t: row.x * 1000, v: row.y });
    }
    if (!raw.length) {
      return {
        points: [],
        scale: "log",
        caption,
        error: "Blockchain.com returned an empty market-cap series.",
        crossedAt: null,
      };
    }
    const crossedAt = raw.find((point) => point.v >= 1e12)?.t ?? null;
    const points = monthlyLast(raw);
    if (liveCap && liveCap > 0) {
      const last = points[points.length - 1];
      if (!last || liveCap !== last.v) {
        points.push({ t: Date.now(), v: liveCap });
      }
    }
    return { points, scale: "log", caption, error: null, crossedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bitcoin history failed.";
    return { points: [], scale: "log", caption, error: message, crossedAt: null };
  }
}
