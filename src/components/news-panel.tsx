import { formatWhen } from "@/lib/format";
import type { NewsBlock } from "@/lib/types";

export function NewsPanel({ news }: { news: NewsBlock }) {
  return (
    <section>
      <h2 className="section-label">News and insights</h2>
      {news.error ? <p className="error">{news.error}</p> : null}
      {news.blurb ? <p className="takeaway">{news.blurb}</p> : null}
      {news.items.length ? (
        <ul className="news">
          {news.items.map((item) => (
            <li key={item.url}>
              <a href={item.url}>{item.title}</a>
              <span className="source">
                {[item.publisher, item.publishedAt ? formatWhen(item.publishedAt) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      ) : news.error ? null : (
        <p className="empty">No headlines came back from Yahoo Finance for this name just now.</p>
      )}
      <p className="fine">
        The paragraph is a lead-in built from those headlines, not a separate research note.
        Refresh pulls a new set.
      </p>
    </section>
  );
}
