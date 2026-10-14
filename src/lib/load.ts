import { loadBitcoinQuote } from "@/lib/bitcoin";
import { loadCompanyFacts } from "@/lib/facts";
import { loadQuote, loadUniverse } from "@/lib/market";
import { loadNews } from "@/lib/news";
import { loadOptions } from "@/lib/options";
import { newsQueries, profileFor } from "@/lib/profiles";
import { loadBitcoinSeries, loadScaledSeries } from "@/lib/series";
import type {
  BitcoinQuote,
  CompanyFacts,
  HistorySeries,
  NewsBlock,
  OptionsView,
  Quote,
  Universe,
} from "@/lib/types";

export type DeskData = {
  universe: Universe;
  bitcoin: BitcoinQuote | null;
  bitcoinError: string | null;
};

export async function loadDesk(): Promise<DeskData> {
  const [universe, bitcoinResult] = await Promise.all([
    loadUniverse(),
    loadBitcoinQuote().then(
      (bitcoin) => ({ bitcoin, bitcoinError: null as string | null }),
      (error: unknown) => ({
        bitcoin: null,
        bitcoinError: error instanceof Error ? error.message : "Bitcoin quote failed.",
      }),
    ),
  ]);
  return { universe, ...bitcoinResult };
}

export type CompanyPage = {
  quote: Quote;
  universe: Universe;
  news: NewsBlock;
  options: OptionsView;
  series: HistorySeries;
  profile: ReturnType<typeof profileFor>;
  facts: CompanyFacts;
};

export async function loadCompanyPage(symbol: string): Promise<CompanyPage | null> {
  const universe = await loadUniverse();
  const fromList = [...universe.members, ...universe.near].find(
    (quote) => quote.symbol === symbol,
  );
  const quote = fromList ?? (await loadQuote(symbol));
  if (!quote) return null;
  const profile = profileFor(quote.symbol, quote.legalName);
  const [news, options, series, facts] = await Promise.all([
    loadNews(profile.name, newsQueries(quote.symbol, profile.name)),
    loadOptions(quote.symbol),
    loadScaledSeries(quote.symbol, quote.marketCapUsd),
    loadCompanyFacts(quote.symbol),
  ]);
  return { quote, universe, news, options, series, profile, facts };
}

export type BitcoinPage = {
  quote: BitcoinQuote;
  universe: Universe;
  news: NewsBlock;
  options: OptionsView;
  series: HistorySeries;
  firstTrillion: { t: number } | null;
};

export async function loadBitcoinPage(): Promise<BitcoinPage> {
  const desk = await loadDesk();
  if (!desk.bitcoin) {
    throw new Error(desk.bitcoinError || "Bitcoin quote failed.");
  }
  const quote = desk.bitcoin;
  const [news, options, series] = await Promise.all([
    loadNews("Bitcoin", newsQueries("BTC", "Bitcoin")),
    loadOptions(
      "BTC",
      "IBIT",
      "Spot bitcoin is not an options underlying on DudeDiligence. The board below is IBIT, the iShares Bitcoin Trust, which is the listed contract the site carries for bitcoin.",
    ),
    loadBitcoinSeries(quote.marketCapUsd, quote.source),
  ]);
  return {
    quote,
    universe: desk.universe,
    news,
    options,
    series,
    firstTrillion: series.crossedAt ? { t: series.crossedAt } : null,
  };
}
