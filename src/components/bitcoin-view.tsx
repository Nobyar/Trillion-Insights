import Link from "next/link";
import { CapChart } from "@/components/chart";
import { accentFor, Mast } from "@/components/frames";
import { NewsPanel } from "@/components/news-panel";
import { OptionsPanel } from "@/components/options-panel";
import {
  formatChange,
  formatDay,
  formatMoney,
  formatPrice,
  formatWhen,
  lineGap,
  rankLabel,
  TRILLION,
} from "@/lib/format";
import type { BitcoinPage } from "@/lib/load";
import { companyHref } from "@/lib/slug";
import type { Quote } from "@/lib/types";

export function BitcoinView({ page }: { page: BitcoinPage }) {
  const { quote, universe } = page;
  const change = formatChange(quote.changePct);
  const accent = accentFor("BTC");
  const bigger = universe.members.filter((row) => row.marketCapUsd > quote.marketCapUsd);
  const above = bigger[bigger.length - 1];
  const below = universe.members.find((row) => row.marketCapUsd <= quote.marketCapUsd);
  const crossed = page.firstTrillion
    ? formatDay(new Date(page.firstTrillion.t).toISOString())
    : "February 2021";

  return (
    <>
      <Mast
        current="bitcoin"
        kicker="A trillion-dollar asset"
        edition="BTC"
        title={
          <>
            Bitcoin <span className="dot">·</span> beside the list
          </>
        }
        deck="Spot bitcoin, compared with the public companies above $1 trillion. Options are the IBIT board."
        meta={`${quote.source} · ${formatWhen(quote.fetchedAt)}`}
      />
      <main>
        <article className="card" style={{ ["--accent" as string]: accent }}>
          <p className="symbol">BTC</p>
          <p className="name">Bitcoin · not a share of stock</p>
          <div className="price-row">
            <span className="spot">{formatPrice(quote.price, "USD")}</span>
            <span className={`chg ${change.dir}`}>{change.text}</span>
          </div>
          <dl className="levels">
            <div>
              <dt>Market cap</dt>
              <dd>{formatMoney(quote.marketCapUsd)}</dd>
            </div>
            <div>
              <dt>Versus $1T</dt>
              <dd>{lineGap(quote.marketCapUsd)}</dd>
            </div>
            <div>
              <dt>Rank here</dt>
              <dd>{universe.members.length ? `#${bigger.length + 1}` : "—"}</dd>
            </div>
          </dl>
        </article>

        <section>
          <h2 className="section-label">How it compares</h2>
          <p className="takeaway">
            {quote.marketCapUsd >= TRILLION
              ? `Bitcoin is above the same $1 trillion line as the companies.`
              : `Bitcoin is under the $1 trillion line on this quote.`}
            {above && below
              ? ` It would sit between ${above.name} and ${below.name}.`
              : above
                ? ` ${above.name} is the closest company still larger.`
                : below
                  ? ` It is larger than every public name on the list. ${below.name} is next.`
                  : ""}
          </p>
          <div className="stack" style={{ marginTop: 12 }}>
            {ranked(quote.marketCapUsd, universe.members).map((row) =>
              row.kind === "btc" ? (
                <CompareRow
                  key="BTC"
                  label="BTC"
                  name="Bitcoin"
                  cap={quote.marketCapUsd}
                  href="/bitcoin"
                  here
                />
              ) : (
                <CompareRow
                  key={row.quote.symbol}
                  label={rankLabel(row.index)}
                  name={`${row.quote.symbol} · ${row.quote.name}`}
                  cap={row.quote.marketCapUsd}
                  href={companyHref(row.quote.symbol)}
                  mark={row.quote.symbol}
                />
              ),
            )}
          </div>
          {universe.error ? <p className="note">{universe.error}</p> : null}
        </section>

        <OptionsPanel options={page.options} />
        <NewsPanel news={page.news} />

        <section>
          <h2 className="section-label">How it got here</h2>
          <dl className="levels">
            <div>
              <dt>Paper</dt>
              <dd>2008</dd>
            </div>
            <div>
              <dt>Genesis</dt>
              <dd>Jan 2009</dd>
            </div>
            <div>
              <dt>First $1T</dt>
              <dd>{crossed}</dd>
            </div>
          </dl>
          <div className="prose" style={{ marginTop: 16 }}>
            <p>
              The bitcoin paper was posted on October 31, 2008, under the name Satoshi
              Nakamoto. The genesis block followed on January 3, 2009. There was no
              company, no share count, and for a while no price that mattered. The 2010
              pizza trade is the anecdote people use for the first market. Mining,
              exchanges, and a sequence of boom-and-bust cycles did the rest.
            </p>
            <p>
              The Blockchain.com series on this page first prints a market cap above $1
              trillion on {crossed}. That level did not stick. The 2022 drawdown took it
              back under, and the spot ETFs approved in the United States in January
              2024, IBIT among them, gave traditional accounts a listed way to hold it.
              The live card above is the membership test, the same way a company&apos;s
              quote is.
            </p>
          </div>
          <ol className="milestones">
            <li>
              <time>2008</time>
              <span>White paper, October 31.</span>
            </li>
            <li>
              <time>2009</time>
              <span>Genesis block, January 3.</span>
            </li>
            <li>
              <time>2010</time>
              <span>The pizza trade. A price exists in public.</span>
            </li>
            <li>
              <time>2017</time>
              <span>The first widely watched cycle through $10,000 and back.</span>
            </li>
            <li>
              <time>2021</time>
              <span>Market cap first moves through $1 trillion.</span>
            </li>
            <li>
              <time>2024</time>
              <span>US spot ETFs list. IBIT is BlackRock&apos;s.</span>
            </li>
          </ol>
          <h2 className="section-label">Market cap over time</h2>
          {page.series.error ? <p className="error">{page.series.error}</p> : null}
          {page.series.points.length >= 2 ? (
            <CapChart points={page.series.points} scale={page.series.scale} accent={accent} />
          ) : null}
          <p className="fine">{page.series.caption}</p>
        </section>
      </main>
    </>
  );
}

function CompareRow({
  label,
  name,
  cap,
  href,
  here = false,
  mark,
}: {
  label: string;
  name: string;
  cap: number;
  href: string;
  here?: boolean;
  mark?: string;
}) {
  const width = Math.max(8, Math.min(100, (cap / 6e12) * 100));
  return (
    <Link className={here ? "card row here" : "card row"} href={href} style={{ ["--accent" as string]: accentFor(mark ?? "BTC") }}>
      <span className="rank">{label}</span>
      <span className="ident">
        <span className="name" style={{ margin: 0, color: "var(--text)" }}>
          {name}
        </span>
        <span
          aria-hidden="true"
          style={{
            display: "block",
            marginTop: 8,
            height: 3,
            width: `${width}%`,
            borderRadius: 2,
            background: here ? "var(--gold)" : "rgba(243,239,228,0.28)",
          }}
        />
      </span>
      <span className="figs">
        <span className="spot">{formatMoney(cap)}</span>
      </span>
      <span className="sub">{lineGap(cap)}</span>
    </Link>
  );
}

function ranked(cap: number, members: Quote[]) {
  const rows: Array<
    | { kind: "btc"; cap: number }
    | { kind: "co"; quote: Quote; index: number }
  > = [
    { kind: "btc", cap },
    ...members.map((quote, index) => ({ kind: "co" as const, quote, index })),
  ];
  rows.sort((a, b) => {
    const av = a.kind === "btc" ? a.cap : a.quote.marketCapUsd;
    const bv = b.kind === "btc" ? b.cap : b.quote.marketCapUsd;
    return bv - av;
  });
  return rows;
}
