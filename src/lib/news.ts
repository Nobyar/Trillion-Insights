import type { NewsBlock, NewsItem } from "@/lib/types";

type YahooNews = {
  news?: Array<{
    title?: string;
    link?: string;
    publisher?: string;
    providerPublishTime?: number;
  }>;
};

function clean(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

function blurb(name: string, items: NewsItem[]): string | null {
  if (!items.length) return null;
  const [lead, ...rest] = items;
  const publisher = lead.publisher ? ` (${lead.publisher})` : "";
  let text = `Recent coverage of ${name} leads with “${lead.title}”${publisher}.`;
  const more = rest.slice(0, 2).map((item) => `“${item.title}”`);
  if (more.length === 1) text += ` Also on the tape: ${more[0]}.`;
  if (more.length === 2) text += ` Also on the tape: ${more[0]} and ${more[1]}.`;
  return text;
}

async function searchNews(query: string): Promise<NewsItem[]> {
  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", query);
  url.searchParams.set("newsCount", "6");
  url.searchParams.set("quotesCount", "0");
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TrillionInsights/1.0)",
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Yahoo news answered ${res.status}.`);
  const data = (await res.json()) as YahooNews;
  const items: NewsItem[] = [];
  for (const row of data.news ?? []) {
    if (!row.title || !row.link) continue;
    items.push({
      title: clean(row.title),
      url: row.link,
      publisher: row.publisher ?? null,
      publishedAt:
        row.providerPublishTime != null
          ? new Date(row.providerPublishTime * 1000).toISOString()
          : null,
    });
  }
  return items.slice(0, 5);
}

export async function loadNews(name: string, queries: string[]): Promise<NewsBlock> {
  try {
    let items: NewsItem[] = [];
    for (const query of queries) {
      items = await searchNews(query);
      if (items.length) break;
    }
    const aliases = new Set<string>();
    aliases.add(name.toLowerCase());
    for (const part of name.toLowerCase().split(/[^a-z0-9]+/)) {
      if (part.length > 3) aliases.add(part);
    }
    for (const query of queries) {
      const token = query.toLowerCase();
      if (token.length > 2 && !token.includes(".") && !token.includes("=")) aliases.add(token);
    }
    const matched = items.filter((item) => {
      const title = item.title.toLowerCase();
      return [...aliases].some((needle) => title.includes(needle));
    });
    const chosen = matched.length ? matched : items;
    return { blurb: blurb(name, chosen), items: chosen, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "News failed.";
    return { blurb: null, items: [], error: message };
  }
}
