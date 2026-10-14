import { NEAR_FLOOR, TRILLION } from "@/lib/format";
import type { Quote, Universe } from "@/lib/types";
import { readQuote, yahooJson, yahooSession, type YahooQuote } from "@/lib/yahoo";
import { profileFor } from "@/lib/profiles";

/**
 * Home listing wins when Yahoo's US line and the primary listing disagree.
 * GOOG/GOOGL and BRK.A/BRK.B are one company. SKHY's reported share count is
 * 10× the Seoul count, so 000660.KS (converted) is the figure we keep.
 */
const GROUP: Record<string, string> = {
  GOOG: "alphabet",
  GOOGL: "alphabet",
  "BRK-A": "berkshire",
  "BRK-B": "berkshire",
  "BRK.A": "berkshire",
  "BRK.B": "berkshire",
  SKHY: "hynix",
  "000660.KS": "hynix",
  "005930.KS": "samsung",
  "005935.KS": "samsung",
  TSM: "tsmc",
  "2330.TW": "tsmc",
};

const PREFERRED: Record<string, string> = {
  alphabet: "GOOGL",
  berkshire: "BRK-B",
  hynix: "000660.KS",
  samsung: "005930.KS",
  tsmc: "TSM",
};

const SUPPLEMENTAL = ["2222.SR", "005930.KS", "000660.KS"];

const SOURCE_NOTE =
  "Membership is the live dollar market cap, refreshed on a short cache. The net is Yahoo's US equity screener from $700B up, plus Saudi Aramco (2222.SR), Samsung Electronics (005930.KS), and SK hynix (000660.KS). Listings that are not in dollars are converted with Yahoo FX. One row per company.";

type ScreenResponse = {
  finance?: {
    result?: Array<{ quotes?: YahooQuote[]; total?: number }>;
    error?: { description?: string } | null;
  };
};

type QuoteResponse = {
  quoteResponse?: { result?: YahooQuote[] };
};

function fxSymbol(currency: string): string {
  return `${currency}USD=X`;
}

function toQuote(
  raw: ReturnType<typeof readQuote>,
  usdPerUnit: number,
): Quote | null {
  if (!raw) return null;
  const marketCapUsd = raw.marketCap * usdPerUnit;
  if (!Number.isFinite(marketCapUsd) || marketCapUsd <= 0) return null;
  const profile = profileFor(raw.symbol, raw.legalName);
  return {
    symbol: raw.symbol,
    name: profile?.name ?? raw.legalName,
    legalName: raw.legalName,
    price: raw.price,
    changePct: raw.changePct,
    marketCapUsd,
    currency: raw.currency,
    exchange: raw.exchange,
  };
}

function collapse(quotes: Quote[]): Quote[] {
  const groups = new Map<string, Quote[]>();
  const singles: Quote[] = [];
  for (const quote of quotes) {
    const group = GROUP[quote.symbol];
    if (!group) {
      singles.push(quote);
      continue;
    }
    const list = groups.get(group) ?? [];
    list.push(quote);
    groups.set(group, list);
  }
  const picked: Quote[] = [...singles];
  for (const [group, list] of groups) {
    const preferred = PREFERRED[group];
    const choice = list.find((quote) => quote.symbol === preferred) ?? list[0];
    if (choice) picked.push(choice);
  }
  return picked;
}

async function screenUs(session: Awaited<ReturnType<typeof yahooSession>>) {
  const body = JSON.stringify({
    size: 60,
    offset: 0,
    sortField: "intradaymarketcap",
    sortType: "DESC",
    quoteType: "EQUITY",
    query: {
      operator: "AND",
      operands: [
        { operator: "GT", operands: ["intradaymarketcap", NEAR_FLOOR] },
        { operator: "EQ", operands: ["region", "us"] },
      ],
    },
  });
  const data = await yahooJson<ScreenResponse>(
    `https://query1.finance.yahoo.com/v1/finance/screener?crumb=${encodeURIComponent(session.crumb)}`,
    { method: "POST", body, session },
  );
  const block = data.finance?.result?.[0];
  if (!block) {
    throw new Error(
      data.finance?.error?.description || "Yahoo's screener returned no result.",
    );
  }
  return block.quotes ?? [];
}

async function quoteSymbols(
  session: Awaited<ReturnType<typeof yahooSession>>,
  symbols: string[],
) {
  if (!symbols.length) return [];
  const url = new URL("https://query1.finance.yahoo.com/v7/finance/quote");
  url.searchParams.set("symbols", symbols.join(","));
  url.searchParams.set("crumb", session.crumb);
  const data = await yahooJson<QuoteResponse>(url.toString(), { session });
  return data.quoteResponse?.result ?? [];
}

export async function loadUniverse(): Promise<Universe> {
  const fetchedAt = new Date().toISOString();
  try {
    const session = await yahooSession();
    const screened = await screenUs(session);
    const extra = await quoteSymbols(session, SUPPLEMENTAL);
    const raw = [...screened, ...extra]
      .map(readQuote)
      .filter((quote): quote is NonNullable<typeof quote> => quote != null);

    const currencies = [
      ...new Set(raw.map((quote) => quote.currency).filter((c) => c !== "USD")),
    ];
    const fxQuotes = currencies.length
      ? await quoteSymbols(session, currencies.map(fxSymbol))
      : [];
    const fx = new Map<string, number>();
    for (const row of fxQuotes) {
      if (!row.symbol || row.regularMarketPrice == null || row.regularMarketPrice <= 0) {
        continue;
      }
      const code = row.symbol.replace(/USD=X$/, "");
      fx.set(code, row.regularMarketPrice);
    }

    const converted: Quote[] = [];
    const skipped: string[] = [];
    for (const quote of raw) {
      const rate = quote.currency === "USD" ? 1 : fx.get(quote.currency);
      if (rate == null) {
        skipped.push(quote.symbol);
        continue;
      }
      const next = toQuote(quote, rate);
      if (next) converted.push(next);
    }

    const unique = collapse(converted);
    unique.sort((a, b) => b.marketCapUsd - a.marketCapUsd);
    const members = unique.filter((quote) => quote.marketCapUsd >= TRILLION);
    const near = unique.filter(
      (quote) => quote.marketCapUsd >= NEAR_FLOOR && quote.marketCapUsd < TRILLION,
    );

    const fxNote = skipped.length
      ? ` Left out for a missing dollar rate: ${skipped.join(", ")}.`
      : "";

    return {
      members,
      near,
      fetchedAt,
      error: null,
      sourceNote: SOURCE_NOTE + fxNote,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Market data failed.";
    return {
      members: [],
      near: [],
      fetchedAt,
      error: message,
      sourceNote: SOURCE_NOTE,
    };
  }
}

export async function loadQuote(symbol: string): Promise<Quote | null> {
  try {
    const session = await yahooSession();
    const [row] = await quoteSymbols(session, [symbol]);
    const parsed = row ? readQuote(row) : null;
    if (!parsed) return null;
    const rate =
      parsed.currency === "USD"
        ? 1
        : await (async () => {
            const [fx] = await quoteSymbols(session, [fxSymbol(parsed.currency)]);
            return fx?.regularMarketPrice && fx.regularMarketPrice > 0
              ? fx.regularMarketPrice
              : null;
          })();
    if (rate == null) return null;
    return toQuote(parsed, rate);
  } catch {
    return null;
  }
}
