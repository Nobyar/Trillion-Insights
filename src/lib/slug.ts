/** Dots in tickers such as 005930.KS break some route matching, so the path uses a tilde. */
export function toSlug(symbol: string): string {
  return symbol.replaceAll(".", "~");
}

export function fromSlug(slug: string): string {
  return decodeURIComponent(slug).replaceAll("~", ".").toUpperCase();
}

export function companyHref(symbol: string): string {
  return `/company/${toSlug(symbol)}`;
}
