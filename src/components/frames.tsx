import type { ReactNode } from "react";
import Link from "next/link";
import { RefreshButton } from "@/components/refresh-button";

const ACCENTS: Record<string, string> = {
  BTC: "#d7b56d",
  IBIT: "#d7b56d",
  SPCX: "#a9c0d2",
  NVDA: "#8fce9a",
  AAPL: "#e4d2a8",
  MSFT: "#a9c0d2",
  GOOGL: "#c7b8a1",
  AMZN: "#efaa9e",
  META: "#a9c0d2",
  AVGO: "#8fce9a",
  TSLA: "#efaa9e",
  TSM: "#9ed9b4",
  "BRK-B": "#d7b56d",
  LLY: "#c7b8a1",
  MU: "#8fce9a",
  "2222.SR": "#d7b56d",
  "005930.KS": "#a9c0d2",
  "000660.KS": "#8fce9a",
};

export function accentFor(symbol: string): string {
  return ACCENTS[symbol] ?? "#d7b56d";
}

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="sheet">
      {children}
      <footer className="footer">
        Not financial advice. Dollar market caps for companies are Yahoo Finance, converted
        when the listing is not in dollars. Bitcoin&apos;s price, market cap, and chain stats
        come from <a href="https://timechainstats.com/">timechainstats.com</a>. If that board
        does not answer, the quote falls back to CoinGecko, then CoinPaprika. The market-cap
        history is Blockchain.com. Headlines are Yahoo Finance. Options, when a session is
        set, are DudeDiligence. <a href="https://dudediligence.club">dudediligence.club</a>
      </footer>
    </div>
  );
}

export function Mast({
  kicker,
  edition,
  title,
  deck,
  meta,
  current,
}: {
  kicker: string;
  edition?: string;
  title: ReactNode;
  deck: string;
  meta?: ReactNode;
  current?: "list" | "bitcoin";
}) {
  return (
    <header className="masthead">
      <div className="rules" aria-hidden="true" />
      <div className="kicker-row">
        <p className="kicker">{kicker}</p>
        <div className="kicker-actions">
          {edition ? <p className="edition">{edition}</p> : null}
          <RefreshButton />
        </div>
      </div>
      <h1>{title}</h1>
      <p className="deck">{deck}</p>
      <div className="mast-row">
        <p className="meta">{meta}</p>
        <nav className="nav" aria-label="Sections">
          <Link href="/" aria-current={current === "list" ? "page" : undefined}>
            List
          </Link>
          <Link href="/bitcoin" aria-current={current === "bitcoin" ? "page" : undefined}>
            Bitcoin
          </Link>
        </nav>
      </div>
    </header>
  );
}
