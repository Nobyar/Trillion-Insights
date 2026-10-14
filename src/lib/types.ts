export type Quote = {
  symbol: string;
  name: string;
  legalName: string;
  price: number;
  changePct: number | null;
  marketCapUsd: number;
  currency: string;
  exchange: string;
};

export type SeriesPoint = {
  t: number;
  v: number;
};

export type NewsItem = {
  title: string;
  url: string;
  publisher: string | null;
  publishedAt: string | null;
};

export type NewsBlock = {
  blurb: string | null;
  items: NewsItem[];
  error: string | null;
};

export type StrikeRow = {
  strike: number;
  net: number | null;
  call: number | null;
  put: number | null;
  callOi: number | null;
  putOi: number | null;
};

export type ExpirationView = {
  expiry: string;
  netGamma: number | null;
  callWall: number | null;
  putWall: number | null;
  flip: number | null;
  callOi: number | null;
  putOi: number | null;
  forward: number | null;
  strikes: StrikeRow[];
};

export type OptionsStatus =
  | "ready"
  | "needs-session"
  | "not-listed"
  | "rejected"
  | "error"
  | "empty";

export type OptionsView = {
  requestedSymbol: string;
  boardSymbol: string;
  note: string | null;
  status: OptionsStatus;
  message: string;
  link: string | null;
  asOf: string | null;
  spot: number | null;
  catalogAsOf: string | null;
  catalogKind: string | null;
  catalogLabel: string | null;
  sessionDate: string | null;
  sessionsBehind: number | null;
  expirations: ExpirationView[];
};

export type CompanyFacts = {
  headquarters: string | null;
  ceo: string | null;
  employees: number | null;
  sector: string | null;
  industry: string | null;
  revenue: number | null;
  netIncome: number | null;
  reportCurrency: string;
  grossMargin: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  trailingPe: number | null;
  forwardPe: number | null;
  weekLow: number | null;
  weekHigh: number | null;
  priceCurrency: string;
  dividendRate: number | null;
  dividendYield: number | null;
  business: string | null;
  asOf: string | null;
  error: string | null;
};

export type Universe = {
  members: Quote[];
  near: Quote[];
  fetchedAt: string;
  error: string | null;
  sourceNote: string;
};

export type BitcoinChain = {
  blockHeight: number | null;
  hashrateEhs: number | null;
  supplyBtc: number | null;
  difficulty: number | null;
  medianFeeUsd: number | null;
  fastestFeeSat: number | null;
  transactions24h: number | null;
  percentMined: number | null;
  halvingAt: string | null;
  blocksToHalving: number | null;
  mempoolCount: number | null;
  mempoolBytes: number | null;
  nodes: number | null;
};

export type BitcoinQuote = {
  price: number;
  marketCapUsd: number;
  changePct: number | null;
  source: string;
  fetchedAt: string;
  chain: BitcoinChain | null;
};

export type HistorySeries = {
  points: SeriesPoint[];
  scale: "linear" | "log";
  caption: string;
  error: string | null;
  /** First daily print at or above $1T, when the series is a measured market cap. */
  crossedAt: number | null;
};
