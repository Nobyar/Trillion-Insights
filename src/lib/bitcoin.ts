import type { BitcoinQuote } from "@/lib/types";
import { loadTimechainSnapshot } from "@/lib/timechain";

type CoinGecko = {
  bitcoin?: {
    usd?: number;
    usd_market_cap?: number;
    usd_24h_change?: number;
  };
};

type Paprika = {
  quotes?: {
    USD?: {
      price?: number;
      market_cap?: number;
      percent_change_24h?: number;
    };
  };
};

export async function loadBitcoinQuote(): Promise<BitcoinQuote> {
  const fetchedAt = new Date().toISOString();
  const timechain = await loadTimechainSnapshot();
  if (timechain.quote) {
    return {
      price: timechain.quote.price,
      marketCapUsd: timechain.quote.marketCapUsd,
      changePct: timechain.quote.changePct,
      source: "timechainstats.com",
      fetchedAt,
      chain: timechain.chain,
    };
  }

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true&include_24hr_change=true",
      {
        headers: { Accept: "application/json", "User-Agent": "TrillionInsights/1.0" },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) throw new Error(`CoinGecko answered ${res.status}.`);
    const data = (await res.json()) as CoinGecko;
    const row = data.bitcoin;
    if (row?.usd == null || row.usd_market_cap == null) {
      throw new Error("CoinGecko left the bitcoin quote empty.");
    }
    return {
      price: row.usd,
      marketCapUsd: row.usd_market_cap,
      changePct: row.usd_24h_change ?? null,
      source: "CoinGecko",
      fetchedAt,
      chain: timechain.chain,
    };
  } catch {
    const res = await fetch("https://api.coinpaprika.com/v1/tickers/btc-bitcoin", {
      headers: { Accept: "application/json", "User-Agent": "TrillionInsights/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      throw new Error("Bitcoin quotes failed at timechainstats.com, CoinGecko, and CoinPaprika.");
    }
    const data = (await res.json()) as Paprika;
    const usd = data.quotes?.USD;
    if (usd?.price == null || usd.market_cap == null) {
      throw new Error("CoinPaprika left the bitcoin quote empty.");
    }
    return {
      price: usd.price,
      marketCapUsd: usd.market_cap,
      changePct: usd.percent_change_24h ?? null,
      source: "CoinPaprika",
      fetchedAt,
      chain: timechain.chain,
    };
  }
}
