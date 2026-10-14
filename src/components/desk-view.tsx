import Link from "next/link";
import { accentFor, Mast } from "@/components/frames";
import { OptionsPanel } from "@/components/options-panel";
import { IBIT_OPTIONS_HEADING } from "@/lib/options";
import {
  formatChange,
  formatMoney,
  formatPrice,
  formatWhen,
  lineGap,
  rankLabel,
} from "@/lib/format";
import type { DeskData } from "@/lib/load";
import { companyHref } from "@/lib/slug";
import type { Quote } from "@/lib/types";

export function DeskView({ desk }: { desk: DeskData }) {
  const { universe, bitcoin, bitcoinError } = desk;
  const count = universe.members.length;
  const bitcoinRank =
    bitcoin == null
      ? null
      : place(bitcoin.marketCapUsd, universe.members);

  return (
    <>
      <Mast
        current="list"
        kicker="Trillion Insights"
        edition="Live"
        title={
          <>
            Above one <span className="dot">·</span> trillion
          </>
        }
        deck="Public companies whose live dollar market cap clears $1 trillion, with Bitcoin kept beside them as its own asset."
        meta={
          universe.error
            ? "Quotes did not load."
            : `${count} ${count === 1 ? "company" : "companies"} above the line · ${formatWhen(universe.fetchedAt)}`
        }
      />
      {universe.error ? <p className="note">{universe.error}</p> : null}
      <main>
        <section aria-labelledby="bitcoin-heading">
          <h2 id="bitcoin-heading" className="section-label">
            Bitcoin
          </h2>
          <div className="stack">
            {bitcoin ? (
              <Link className="card" href="/bitcoin" style={{ ["--accent" as string]: accentFor("BTC") }}>
                <p className="symbol">BTC</p>
                <p className="name">Bitcoin · not a company · {bitcoin.source}</p>
                <div className="price-row">
                  <span className="spot">{formatPrice(bitcoin.price, "USD")}</span>
                  <Change pct={bitcoin.changePct} />
                </div>
                <p className="name">
                  {formatMoney(bitcoin.marketCapUsd)} market cap · {lineGap(bitcoin.marketCapUsd)}
                </p>
                {bitcoinRank ? (
                  <p className="takeaway" style={{ marginTop: 12 }}>
                    {bitcoinRank.sentence}
                  </p>
                ) : null}
              </Link>
            ) : (
              <p className="note">{bitcoinError}</p>
            )}
          </div>
          <OptionsPanel options={desk.bitcoinOptions} heading={IBIT_OPTIONS_HEADING} />
        </section>

        <section className="stack" aria-labelledby="companies-heading">
          <h2 id="companies-heading" className="section-label">
            Public companies
          </h2>
          {universe.members.length ? (
            universe.members.map((quote, index) => (
              <CompanyRow key={quote.symbol} quote={quote} index={index} />
            ))
          ) : universe.error ? null : (
            <p className="empty">
              No name in the monitored net is above $1 trillion on this refresh.
            </p>
          )}
        </section>

        {universe.near.length ? (
          <section className="stack" aria-labelledby="near-heading">
            <h2 id="near-heading" className="section-label">
              Still under the line
            </h2>
            <p className="fine">
              These are inside the same net, from $700 billion up to the line. They join
              the list on their own when the live cap crosses $1 trillion.
            </p>
            {universe.near.map((quote) => (
              <CompanyRow key={quote.symbol} quote={quote} />
            ))}
          </section>
        ) : null}
      </main>
      <p className="fine">{universe.sourceNote}</p>
    </>
  );
}

function CompanyRow({ quote, index }: { quote: Quote; index?: number }) {
  return (
    <Link
      className="card row"
      href={companyHref(quote.symbol)}
      style={{ ["--accent" as string]: accentFor(quote.symbol) }}
    >
      <span className="rank">{index == null ? "–" : rankLabel(index)}</span>
      <span className="ident">
        <span className="symbol">{quote.symbol}</span>
        <span className="name">
          {quote.name}
          {quote.exchange ? ` · ${quote.exchange}` : ""}
        </span>
      </span>
      <span className="figs">
        <span className="spot">{formatMoney(quote.marketCapUsd)}</span>
        <Change pct={quote.changePct} />
      </span>
      <span className="sub">
        {formatPrice(quote.price, quote.currency)} · {lineGap(quote.marketCapUsd)}
      </span>
    </Link>
  );
}

function Change({ pct }: { pct: number | null }) {
  const change = formatChange(pct);
  return <span className={`chg ${change.dir}`}>{change.text}</span>;
}

function place(cap: number, members: Quote[]): { sentence: string } | null {
  if (!members.length) return null;
  const bigger = members.filter((quote) => quote.marketCapUsd > cap);
  const smaller = members.filter((quote) => quote.marketCapUsd <= cap);
  const above = bigger[bigger.length - 1];
  const below = smaller[0];
  if (!above && below) {
    return {
      sentence: `Larger than every public name on this list. ${below.name} is next, at ${formatMoney(below.marketCapUsd)}.`,
    };
  }
  if (above && !below) {
    return {
      sentence: `Smaller than every public name above the line. ${above.name} is the closest, at ${formatMoney(above.marketCapUsd)}.`,
    };
  }
  if (above && below) {
    return {
      sentence: `It would sit at #${bigger.length + 1} among these companies, between ${above.name} (${formatMoney(above.marketCapUsd)}) and ${below.name} (${formatMoney(below.marketCapUsd)}).`,
    };
  }
  return null;
}
