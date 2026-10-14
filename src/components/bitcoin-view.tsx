import Link from "next/link";
import { CapChart } from "@/components/chart";
import { accentFor, Mast } from "@/components/frames";
import { NewsPanel } from "@/components/news-panel";
import { OptionsPanel } from "@/components/options-panel";
import {
  formatBtc,
  formatChange,
  formatCompact,
  formatDay,
  formatBytes,
  formatHashrate,
  formatInteger,
  formatMoney,
  formatPrice,
  formatSatVb,
  formatWhen,
  lineGap,
  rankLabel,
  TRILLION,
} from "@/lib/format";
import type { BitcoinPage } from "@/lib/load";
import { companyHref } from "@/lib/slug";
import type { BitcoinChain, Quote } from "@/lib/types";

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
          <p className="fine">
            Data: <a href="https://timechainstats.com/">timechainstats.com</a>
            {quote.source === "timechainstats.com" ? null : ` · this quote is from ${quote.source}`}
          </p>
        </article>

        {quote.chain ? <ChainStats chain={quote.chain} /> : null}

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

function ChainStats({ chain }: { chain: BitcoinChain }) {
  const cells = chainCells(chain);
  if (!cells.length) return null;
  return (
    <section>
      <h2 className="section-label">Facts & figures</h2>
      <dl className="levels">
        {cells.map((cell) => (
          <div key={cell.label}>
            <dt>{cell.label}</dt>
            <dd>{cell.value}</dd>
          </div>
        ))}
      </dl>
      <p className="fine">
        Data: <a href="https://timechainstats.com/">timechainstats.com</a>
      </p>
    </section>
  );
}

function chainCells(chain: BitcoinChain): Array<{ label: string; value: string }> {
  const cells: Array<{ label: string; value: string }> = [];
  if (chain.blockHeight != null) {
    cells.push({ label: "Block height", value: formatInteger(chain.blockHeight) });
  }
  if (chain.hashrateEhs != null) {
    cells.push({ label: "Hashrate", value: formatHashrate(chain.hashrateEhs) });
  }
  if (chain.difficulty != null) {
    cells.push({ label: "Difficulty", value: formatCompact(chain.difficulty) });
  }
  if (chain.supplyBtc != null) {
    const mined =
      chain.percentMined != null ? ` · ${chain.percentMined.toFixed(2)}% mined` : "";
    cells.push({ label: "Supply", value: `${formatBtc(chain.supplyBtc)}${mined}` });
  }
  const halving = halvingLabel(chain);
  if (halving) cells.push({ label: "Next halving", value: halving });
  if (chain.medianFeeUsd != null) {
    cells.push({ label: "Median fee", value: formatPrice(chain.medianFeeUsd, "USD") });
  }
  if (chain.fastestFeeSat != null) {
    cells.push({ label: "Fastest fee", value: formatSatVb(chain.fastestFeeSat) });
  }
  if (chain.mempoolCount != null || chain.mempoolBytes != null) {
    const parts = [
      chain.mempoolCount != null ? `${formatInteger(chain.mempoolCount)} tx` : null,
      chain.mempoolBytes != null ? formatBytes(chain.mempoolBytes) : null,
    ].filter((part): part is string => Boolean(part));
    cells.push({ label: "Mempool", value: parts.join(" · ") });
  }
  if (chain.nodes != null) {
    cells.push({ label: "Nodes", value: formatInteger(chain.nodes) });
  }
  if (chain.transactions24h != null) {
    cells.push({
      label: "Transactions",
      value: `${formatInteger(chain.transactions24h)} / 24h`,
    });
  }
  return cells;
}

function halvingLabel(chain: BitcoinChain): string | null {
  const when = chain.halvingAt ? formatDay(chain.halvingAt) : null;
  const blocks =
    chain.blocksToHalving != null ? `${formatInteger(chain.blocksToHalving)} blocks` : null;
  const parts = [when, blocks].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(" · ") : null;
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
