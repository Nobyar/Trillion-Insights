import { CapChart } from "@/components/chart";
import { accentFor, Mast } from "@/components/frames";
import { NewsPanel } from "@/components/news-panel";
import { OptionsPanel } from "@/components/options-panel";
import {
  formatChange,
  formatMoney,
  formatPrice,
  formatWhen,
  lineGap,
  rankLabel,
  TRILLION,
} from "@/lib/format";
import type { CompanyPage } from "@/lib/load";

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
