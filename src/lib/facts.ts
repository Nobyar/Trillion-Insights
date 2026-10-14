import type { CompanyFacts } from "@/lib/types";
import { yahooJson, yahooSession } from "@/lib/yahoo";

const MODULES = [
  "assetProfile",
  "summaryDetail",
  "financialData",
  "defaultKeyStatistics",
  "earnings",
].join(",");

type YahooNumber = { raw?: number };

type SummaryResult = {
  assetProfile?: {
    city?: string;
    state?: string;
    country?: string;
    sector?: string;
    industry?: string;
    fullTimeEmployees?: number;
    longBusinessSummary?: string;
    companyOfficers?: Array<{ name?: string; title?: string }>;
  };
  summaryDetail?: {
    currency?: string;
    trailingPE?: YahooNumber;
    forwardPE?: YahooNumber;
    dividendYield?: YahooNumber;
    trailingAnnualDividendRate?: YahooNumber;
    trailingAnnualDividendYield?: YahooNumber;
    fiftyTwoWeekLow?: YahooNumber;
    fiftyTwoWeekHigh?: YahooNumber;
  };
  financialData?: {
    totalRevenue?: YahooNumber;
    financialCurrency?: string;
    grossMargins?: YahooNumber;
    operatingMargins?: YahooNumber;
    profitMargins?: YahooNumber;
  };
  defaultKeyStatistics?: {
    netIncomeToCommon?: YahooNumber;
    mostRecentQuarter?: YahooNumber;
    trailingPE?: YahooNumber;
    forwardPE?: YahooNumber;
  };
};

type SummaryResponse = {
  quoteSummary?: { result?: SummaryResult[] };
};

export async function loadCompanyFacts(symbol: string): Promise<CompanyFacts> {
  try {
    const session = await yahooSession();
    const url =
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}` +
      `?modules=${MODULES}&crumb=${encodeURIComponent(session.crumb)}`;
    const data = await yahooJson<SummaryResponse>(url, { session });
    const row = data.quoteSummary?.result?.[0];
    if (!row) {
      return blank("Yahoo Finance did not return a company profile.");
    }
    return readFacts(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Company facts failed.";
    return blank(message);
  }
}

function readFacts(row: SummaryResult): CompanyFacts {
  const profile = row.assetProfile;
  const detail = row.summaryDetail;
  const financial = row.financialData;
  const stats = row.defaultKeyStatistics;
  const priceCurrency = detail?.currency || "USD";
  const reportCurrency = financial?.financialCurrency || priceCurrency;
  const quarter = raw(stats?.mostRecentQuarter);
  return {
    headquarters: place(profile?.city, profile?.state, profile?.country),
    ceo: chiefExecutive(profile?.companyOfficers),
    employees: count(profile?.fullTimeEmployees),
    sector: text(profile?.sector),
    industry: text(profile?.industry),
    revenue: raw(financial?.totalRevenue),
    netIncome: raw(stats?.netIncomeToCommon),
    reportCurrency,
    grossMargin: ratio(financial?.grossMargins),
    operatingMargin: ratio(financial?.operatingMargins),
    profitMargin: ratio(financial?.profitMargins),
    trailingPe: raw(detail?.trailingPE) ?? raw(stats?.trailingPE),
    forwardPe: raw(detail?.forwardPE) ?? raw(stats?.forwardPE),
    weekLow: raw(detail?.fiftyTwoWeekLow),
    weekHigh: raw(detail?.fiftyTwoWeekHigh),
    priceCurrency,
    dividendRate: raw(detail?.trailingAnnualDividendRate),
    dividendYield: ratio(detail?.trailingAnnualDividendYield) ?? ratio(detail?.dividendYield),
    business: summary(profile?.longBusinessSummary),
    asOf: quarter == null ? null : new Date(quarter * 1000).toISOString(),
    error: null,
  };
}

function blank(error: string): CompanyFacts {
  return {
    headquarters: null,
    ceo: null,
    employees: null,
    sector: null,
    industry: null,
    revenue: null,
    netIncome: null,
    reportCurrency: "USD",
    grossMargin: null,
    operatingMargin: null,
    profitMargin: null,
    trailingPe: null,
    forwardPe: null,
    weekLow: null,
    weekHigh: null,
    priceCurrency: "USD",
    dividendRate: null,
    dividendYield: null,
    business: null,
    asOf: null,
    error,
  };
}

function raw(value: YahooNumber | number | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && typeof value.raw === "number" && Number.isFinite(value.raw)) {
    return value.raw;
  }
  return null;
}

function ratio(value: YahooNumber | undefined): number | null {
  const n = raw(value);
  if (n == null) return null;
  return n;
}

function count(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

function text(value: string | undefined): string | null {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed : null;
}

function place(city?: string, state?: string, country?: string): string | null {
  const parts = [city, state, country].map((part) => part?.trim()).filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(", ") : null;
}

function chiefExecutive(officers: Array<{ name?: string; title?: string }> | undefined): string | null {
  if (!officers?.length) return null;
  const rows = officers
    .map((officer) => ({
      name: officer.name?.replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/i, "").replace(/\s+/g, " ").trim() ?? "",
      title: officer.title ?? "",
    }))
    .filter((officer) => officer.name);
  const ceo = rows.find((officer) => /\b(CEO|Chief Executive Officer)\b/i.test(officer.title));
  return ceo?.name ?? null;
}

function summary(value: string | undefined): string | null {
  const clean = value?.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (clean.length <= 560) return clean;
  const slice = clean.slice(0, 560);
  const stop = slice.lastIndexOf(". ");
  return (stop > 220 ? slice.slice(0, stop + 1) : slice).trim();
}
