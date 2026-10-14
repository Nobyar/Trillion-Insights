# Trillion desk

A quiet list of every public company whose live dollar market cap is above $1 trillion, plus a Bitcoin section for the asset that sits in the same range. The visual language follows the [IBIT · SPCX · NVDA morning brief](https://github.com/Nobyar/IBIT-SPCX-NVDA-Morning-Brief): dark ground, gold rules, Fraunces for the names, Outfit for the prose, IBM Plex Mono for the figures.

## Run it

```bash
npm install
npm run dev
```

The dev server prints a local URL. `npm run build` then `npm start` runs the production server.

Copy `.env.example` to `.env.local` only if you want DudeDiligence options chains. Quotes, headlines, and Bitcoin work with no keys.

## What the desk does

The home page ranks companies above $1 trillion and keeps a shorter list of names still between $700 billion and the line. A name enters when the live dollar market cap crosses $1 trillion and leaves when it falls under. Nothing on the page is a stored membership flag.

Each company page has:

- the live price, change, and dollar market cap
- a news blurb built from the latest Yahoo Finance headlines, plus the headlines
- options for the next five expirations, from DudeDiligence when a session is configured
- a short history of how the company got to a trillion-dollar valuation, and a market-cap chart

Bitcoin has the same sections. Its options are the **IBIT** (iShares Bitcoin Trust) board, which is the contract DudeDiligence lists for bitcoin. Spot BTC is not an options underlying there.

## Data sources

| Piece | Source | Key |
| --- | --- | --- |
| US company quotes and the $700B+ screener | Yahoo Finance (`v7/finance/quote`, `v1/finance/screener`, chart API) | None. The server fetches a crumb. |
| Aramco, Samsung, SK hynix | Yahoo quotes for `2222.SR`, `005930.KS`, `000660.KS` | None |
| Dollar conversion | Yahoo `CCYUSD=X` | None |
| Headlines | Yahoo Finance search news | None |
| Bitcoin live price and market cap | CoinGecko simple price. CoinPaprika if CoinGecko fails | None |
| Bitcoin market-cap history | [Blockchain.com charts](https://api.blockchain.info/charts/market-cap?timespan=all&format=json&sampled=true) | None |
| Options catalog | `GET https://dudediligence.club/v1/options/meta` | None. Public, cached about ten minutes. |
| Options chain | `GET https://dudediligence.club/v1/options/gex/{SYMBOL}?expiries=5` | Session. See below. |

Pages cache for about a minute (`cacheLife("minutes")`), then refresh in the background. The Refresh button expires that cache immediately.

### Who is counted

- Yahoo's US-region equity screener, market cap above $700 billion. That picks up US listings and ADRs such as TSM and SPCX.
- Plus three home listings that do not show up as dollar companies on that screener: Saudi Aramco, Samsung Electronics common, and SK hynix in Seoul.
- Share classes collapse to one company: GOOGL rather than GOOG, BRK-B rather than BRK-A.
- SK hynix is the Seoul line. Yahoo's US line `SKHY` reports about ten times as many shares as `000660.KS`, which inflates that dollar cap. Counting both would also double the company. The home listing, converted from won, is the figure that has to clear $1 trillion.
- A company outside this net will not appear until the net is widened. The US screener plus those three home listings covers the names that were actually around the line when this was built.

### Charts

Company charts are monthly closes from 2005 (or the whole listing, if it is younger), scaled so the last point equals the live dollar market cap. They do not replay buybacks or issuance. The caption on the page says so.

Bitcoin's chart is the measured market cap of coins in circulation, on a log scale.

### DudeDiligence options

The site is a Next.js app. Public pages such as `/s/AAPL/options` render the shell and then request JSON from the site's own API.

What is public:

- `GET /v1/options/meta` returns the options universe (about 2,600 underlyings) with `symbol`, `enabled`, and `latest_as_of`. No login. AAPL, NVDA, MSFT, GOOGL, AMZN, META, AVGO, TSLA, TSM, SPCX, LLY, MU, and **IBIT** are enabled. BTC, BRK-B, 2222.SR, and 005930.KS are not in the catalog.
- `robots.txt` disallows crawling `/api/` and `/v1/`.

What is not public:

- `GET /v1/options/gex/{SYMBOL}?expiries=5` returns `401` and `{"detail":"Gamma Exposure needs a signed-in account."}`.
- The same client calls `/v1/options/gex/{SYMBOL}/history`, `/at/{time}`, `/live`, and `POST /v1/options/refresh/{SYMBOL}`. Those are the same gated family.
- The logged-out HTML does not include strikes, expirations, or gamma. There is nothing honest to scrape off the page.

This desk reads the public catalog so it can say whether a symbol is covered. It calls the gamma route only when you set a session:

```bash
DUDEDILIGENCE_COOKIE="paste the Cookie header from a signed-in request"
# or
DUDEDILIGENCE_AUTHORIZATION="Bearer …"
```

Sign in at [dudediligence.club](https://dudediligence.club), open DevTools on a gamma request, and copy the cookie. Put it in `.env.local`. Do not commit it. Restart the server, or use Refresh.

The parser expects the board the site's own client reads: `by_expiry` (or `expiries` / `per_expiry`) with `net_gex`, `call_wall`, `put_wall`, `gex_flip`, and optional `strikes` (`call_gex`, `put_gex`, `call_oi`, `put_oi`). Net gamma is labeled as that site's dollar figure per 1% move. If the JSON shape changes, the page says the board came back without rows instead of inventing strikes.

Without a session, every covered name still shows the options section, the catalog time, the exact URL, and the env vars. Names the catalog does not list say that plainly. No strikes are filled in from somewhere else.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DUDEDILIGENCE_COOKIE` | No | Cookie header from a signed-in DudeDiligence session. Unlocks the five-expiry board. |
| `DUDEDILIGENCE_AUTHORIZATION` | No | Alternative `Authorization` header, including the `Bearer ` prefix if that is what the session uses. |

## Fonts

Fraunces, Outfit, and IBM Plex Mono are loaded through `next/font` and are under the SIL Open Font License. The morning brief vendors the same three faces.
