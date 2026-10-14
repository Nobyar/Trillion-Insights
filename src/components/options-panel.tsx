import { expiryLabel } from "@/lib/options";
import { formatCount, formatMoney, formatPrice, formatWhen } from "@/lib/format";
import type { ExpirationView, OptionsView } from "@/lib/types";

export function OptionsPanel({
  options,
  priceCurrency = "USD",
  heading = "Options · next five expirations",
}: {
  options: OptionsView;
  priceCurrency?: string;
  heading?: string;
}) {
  const nearest = options.expirations[0];
  const showForward = options.expirations.some((row) => row.forward != null);
  return (
    <section>
      <h2 className="section-label">{heading}</h2>
      {options.note ? <p className="takeaway">{options.note}</p> : null}
      {options.status === "ready" ? (
        <>
          <p className="fine">{options.message}</p>
          {nearest ? (
            <Track expiry={nearest} spot={options.spot} currency={priceCurrency} />
          ) : null}
          <table className="gex-table">
            <caption>Nearest first, five at most</caption>
            <thead>
              <tr>
                <th>Expiry</th>
                <th>Net gamma</th>
                <th>Put wall</th>
                <th>Flip</th>
                <th>Call wall</th>
                <th>Call OI</th>
                <th>Put OI</th>
                {showForward ? <th>Forward</th> : null}
              </tr>
            </thead>
            <tbody>
              {options.expirations.map((row) => (
                <tr key={row.expiry}>
                  <td data-label="Expiry">{expiryLabel(row.expiry)}</td>
                  <td
                    data-label="Net gamma"
                    className={
                      row.netGamma == null ? undefined : row.netGamma >= 0 ? "pos" : "neg"
                    }
                  >
                    {row.netGamma == null ? "—" : formatMoney(row.netGamma)}
                  </td>
                  <td data-label="Put wall">{strike(row.putWall, priceCurrency)}</td>
                  <td data-label="Flip">{strike(row.flip, priceCurrency)}</td>
                  <td data-label="Call wall">{strike(row.callWall, priceCurrency)}</td>
                  <td data-label="Call OI">
                    {row.callOi == null ? "—" : formatCount(row.callOi)}
                  </td>
                  <td data-label="Put OI">
                    {row.putOi == null ? "—" : formatCount(row.putOi)}
                  </td>
                  {showForward ? (
                    <td data-label="Forward">{strike(row.forward, priceCurrency)}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          {options.expirations.some((row) => row.strikes.length) ? (
            <details className="chain">
              <summary>Heaviest strikes on those expirations</summary>
              {options.expirations.map((row) =>
                row.strikes.length ? (
                  <table className="gex-table" key={row.expiry}>
                    <caption>{expiryLabel(row.expiry)}</caption>
                    <thead>
                      <tr>
                        <th>Strike</th>
                        <th>Net</th>
                        <th>Call</th>
                        <th>Put</th>
                        <th>Call OI</th>
                        <th>Put OI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.strikes.map((strikeRow) => (
                        <tr key={strikeRow.strike}>
                          <td data-label="Strike">
                            {formatPrice(strikeRow.strike, priceCurrency)}
                          </td>
                          <td data-label="Net">
                            {strikeRow.net == null ? "—" : formatMoney(strikeRow.net)}
                          </td>
                          <td data-label="Call">
                            {strikeRow.call == null ? "—" : formatMoney(strikeRow.call)}
                          </td>
                          <td data-label="Put">
                            {strikeRow.put == null ? "—" : formatMoney(strikeRow.put)}
                          </td>
                          <td data-label="Call OI">
                            {strikeRow.callOi == null ? "—" : formatCount(strikeRow.callOi)}
                          </td>
                          <td data-label="Put OI">
                            {strikeRow.putOi == null ? "—" : formatCount(strikeRow.putOi)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null,
              )}
            </details>
          ) : null}
        </>
      ) : (
        <>
          <CatalogFacts options={options} />
          <p className={options.status === "error" || options.status === "rejected" ? "note error" : "note"}>
            {options.message}{" "}
            {options.link ? (
              <a href={options.link}>Open the board on DudeDiligence.</a>
            ) : null}
          </p>
        </>
      )}
    </section>
  );
}

function CatalogFacts({ options }: { options: OptionsView }) {
  const cells: Array<{ label: string; value: string }> = [
    {
      label: "Board",
      value: options.catalogLabel
        ? `${options.boardSymbol} · ${options.catalogLabel}`
        : options.boardSymbol,
    },
  ];
  if (options.catalogKind) cells.push({ label: "Kind", value: options.catalogKind });
  if (options.catalogAsOf) {
    cells.push({ label: "Catalog updated", value: formatWhen(options.catalogAsOf) });
  }
  if (options.sessionDate) cells.push({ label: "Session", value: options.sessionDate });
  if (options.sessionsBehind != null) {
    cells.push({ label: "Sessions behind", value: String(options.sessionsBehind) });
  }
  if (cells.length < 2) return null;
  return (
    <dl className="levels">
      {cells.map((cell) => (
        <div key={cell.label}>
          <dt>{cell.label}</dt>
          <dd>{cell.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function strike(value: number | null, currency: string): string {
  if (value == null) return "—";
  return formatPrice(value, currency);
}

function Track({
  expiry,
  spot,
  currency,
}: {
  expiry: ExpirationView;
  spot: number | null;
  currency: string;
}) {
  const marks = [
    expiry.putWall != null ? { kind: "put" as const, value: expiry.putWall, label: "Put wall" } : null,
    expiry.flip != null ? { kind: "flip" as const, value: expiry.flip, label: "Flip" } : null,
    expiry.callWall != null ? { kind: "call" as const, value: expiry.callWall, label: "Call wall" } : null,
    spot != null ? { kind: "spot" as const, value: spot, label: "Spot" } : null,
  ].filter((mark): mark is { kind: "put" | "flip" | "call" | "spot"; value: number; label: string } =>
    mark != null,
  );
  if (marks.length < 2) return null;
  const min = Math.min(...marks.map((mark) => mark.value));
  const max = Math.max(...marks.map((mark) => mark.value));
  const span = max - min || 1;
  return (
    <div>
      <p className="section-label">Nearest expiry · {expiryLabel(expiry.expiry)}</p>
      <div className="track" aria-hidden="true">
        <div className="track-line" />
        {marks.map((mark) => (
          <span
            key={mark.kind}
            className={`mark ${mark.kind}`}
            style={{ left: `${((mark.value - min) / span) * 100}%` }}
            title={`${mark.label} ${formatPrice(mark.value, currency)}`}
          />
        ))}
      </div>
      <p className="track-caption">
        {marks.map((mark) => (
          <span key={mark.kind}>
            <i className={`swatch ${mark.kind}`} />
            {mark.label} {formatPrice(mark.value, currency)}
          </span>
        ))}
      </p>
    </div>
  );
}
