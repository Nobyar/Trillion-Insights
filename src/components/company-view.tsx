import { CapChart } from "@/components/chart";
import { accentFor, Mast } from "@/components/frames";
import { NewsPanel } from "@/components/news-panel";
import { OptionsPanel } from "@/components/options-panel";
import {
  formatAmount,
  formatChange,
  formatDay,
  formatInteger,
  formatMoney,
  formatMultiple,
  formatPrice,
  formatRatioPct,
  formatWhen,
  lineGap,
  rankLabel,
  TRILLION,
} from "@/lib/format";
import type { CompanyPage } from "@/lib/load";
import type { CompanyFacts } from "@/lib/types";

export function CompanyView({ page }: { page: CompanyPage }) {
  const { quote, profile, universe } = page;
  const memberIndex = universe.members.findIndex((row) => row.symbol === quote.symbol);
  const above = quote.marketCapUsd >= TRILLION;
  const change = formatChange(quote.changePct);
  const accent = accentFor(quote.symbol);

  return (
    <>
      <Mast
        kicker={above ? "Above the line" : "Under the line"}
        edition={memberIndex >= 0 ? rankLabel(memberIndex) : "Live"}
        title={profile.name}
        deck={`${quote.symbol}${quote.exchange ? ` · ${quote.exchange}` : ""}`}
        meta={`${formatMoney(quote.marketCapUsd)} · ${lineGap(quote.marketCapUsd)} · ${formatWhen(universe.fetchedAt)}`}
      />
      <main>
        <article className="card" style={{ ["--accent" as string]: accent }}>
          <p className="symbol">{quote.symbol}</p>
          <p className="name">
            {profile.sector}
            {quote.legalName && quote.legalName !== profile.name
              ? ` · ${quote.legalName}`
              : ""}
          </p>
          <div className="price-row">
            <span className="spot">{formatPrice(quote.price, quote.currency)}</span>
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
              <dt>Crossed $1T</dt>
              <dd>{profile.crossedShort}</dd>
            </div>
          </dl>
        </article>

        <FactsPanel facts={page.facts} />
        <NewsPanel news={page.news} />
        <OptionsPanel options={page.options} priceCurrency={quote.currency === "USD" ? "USD" : "USD"} />

        <section>
          <h2 className="section-label">How it got here</h2>
          <dl className="levels">
            <div>
              <dt>Founded</dt>
              <dd>{profile.founded}</dd>
            </div>
            <div>
              <dt>Home</dt>
              <dd>{profile.home}</dd>
            </div>
            <div>
              <dt>First $1T</dt>
              <dd>{profile.crossed}</dd>
            </div>
          </dl>
          <div className="prose" style={{ marginTop: 16 }}>
            {profile.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {profile.milestones.length ? (
            <ol className="milestones">
              {profile.milestones.map((item) => (
                <li key={item.when + item.text}>
                  <time>{item.when}</time>
                  <span>{item.text}</span>
                </li>
              ))}
            </ol>
          ) : null}
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

function FactsPanel({ facts }: { facts: CompanyFacts }) {
  const cells = factCells(facts);
  return (
    <section>
      <h2 className="section-label">Facts & figures</h2>
      {facts.error && !cells.length ? <p className="note">{facts.error}</p> : null}
      {cells.length ? (
        <dl className="levels">
          {cells.map((cell) => (
            <div key={cell.label}>
              <dt>{cell.label}</dt>
              <dd>{cell.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {facts.business ? (
        <div className="prose" style={{ marginTop: 16 }}>
          <p>{facts.business}</p>
        </div>
      ) : null}
      <p className="fine">
        {facts.asOf
          ? `Data: Yahoo Finance, most recent quarter ${formatDay(facts.asOf)}.`
          : "Data: Yahoo Finance."}
      </p>
    </section>
  );
}

function factCells(facts: CompanyFacts): Array<{ label: string; value: string }> {
  const cells: Array<{ label: string; value: string }> = [];
  if (facts.headquarters) cells.push({ label: "Headquarters", value: facts.headquarters });
  if (facts.ceo) cells.push({ label: "Chief executive", value: facts.ceo });
  if (facts.employees != null) {
    cells.push({ label: "Employees", value: formatInteger(facts.employees) });
  }
  if (facts.sector) cells.push({ label: "Sector", value: facts.sector });
  if (facts.industry && facts.industry !== facts.sector) {
    cells.push({ label: "Industry", value: facts.industry });
  }
  if (facts.revenue != null) {
    cells.push({
      label: "Revenue",
      value: formatAmount(facts.revenue, facts.reportCurrency),
    });
  }
  if (facts.netIncome != null) {
    cells.push({
      label: "Net income",
      value: formatAmount(facts.netIncome, facts.reportCurrency),
    });
  }
  if (facts.grossMargin != null) {
    cells.push({ label: "Gross margin", value: formatRatioPct(facts.grossMargin) });
  }
  if (facts.operatingMargin != null) {
    cells.push({ label: "Operating margin", value: formatRatioPct(facts.operatingMargin) });
  }
  if (facts.profitMargin != null) {
    cells.push({ label: "Profit margin", value: formatRatioPct(facts.profitMargin) });
  }
  if (facts.trailingPe != null) {
    cells.push({ label: "Trailing P/E", value: formatMultiple(facts.trailingPe) });
  }
  if (facts.forwardPe != null) {
    cells.push({ label: "Forward P/E", value: formatMultiple(facts.forwardPe) });
  }
  if (facts.weekLow != null && facts.weekHigh != null) {
    cells.push({
      label: "52-week range",
      value: `${formatPrice(facts.weekLow, facts.priceCurrency)} – ${formatPrice(facts.weekHigh, facts.priceCurrency)}`,
    });
  }
  const dividend = dividendLabel(facts);
  if (dividend) cells.push({ label: "Dividend", value: dividend });
  return cells;
}

function dividendLabel(facts: CompanyFacts): string | null {
  const parts: string[] = [];
  if (facts.dividendRate != null && facts.dividendRate > 0) {
    parts.push(`${formatPrice(facts.dividendRate, facts.priceCurrency)} a year`);
  }
  if (facts.dividendYield != null && facts.dividendYield > 0) {
    parts.push(`${formatRatioPct(facts.dividendYield)} yield`);
  }
  return parts.length ? parts.join(" · ") : null;
}
