# Trillion Insights

A quiet list of every public company whose live dollar market cap is above $1 trillion, plus a Bitcoin section for the asset that sits in the same range. The visual language follows the [IBIT · SPCX · NVDA morning brief](https://github.com/Nobyar/IBIT-SPCX-NVDA-Morning-Brief): dark ground, gold rules, Fraunces for the names, Outfit for the prose, IBM Plex Mono for the figures.

## Run it

```bash
npm install
npm run dev
```

The dev server prints a local URL. `npm run build` then `npm start` runs the production server.

Copy `.env.example` to `.env.local` only if you want DudeDiligence options chains. The server signs in when `DUDEDILIGENCE_EMAIL` and `DUDEDILIGENCE_PASSWORD` are set. Quotes, headlines, and Bitcoin work with no keys.

## What Trillion Insights does

The home page ranks companies above $1 trillion and keeps a shorter list of names still between $700 billion and the line. A name enters when the live dollar market cap crosses $1 trillion and leaves when it falls under. Nothing on the page is a stored membership flag.

Each company page has:

- the live price, change, and dollar market cap
- a facts panel from Yahoo Finance: headquarters, chief executive, employees, sector, revenue, net income, margins, P/E, 52-week range, dividend, and the business description when Yahoo returns them
- a news blurb built from the latest Yahoo Finance headlines, plus the headlines
- options for the next five expirations, from DudeDiligence when the server can sign in
- a short history of how the company got to a trillion-dollar valuation, and a market-cap chart

Bitcoin has the same sections. Its options are the **IBIT** (iShares Bitcoin Trust) board, which is the contract DudeDiligence lists for bitcoin. Spot BTC is not an options underlying there.

## Data sources

| Piece | Source | Key |
| --- | --- | --- |
| US company quotes and the $700B+ screener | Yahoo Finance (`v7/finance/quote`, `v1/finance/screener`, chart API) | None. The server fetches a crumb. |
| Company facts | Yahoo Finance `v10/finance/quoteSummary` (`assetProfile`, `summaryDetail`, `financialData`, `defaultKeyStatistics`) | None. Same crumb. |
| Aramco, Samsung, SK hynix | Yahoo quotes for `2222.SR`, `005930.KS`, `000660.KS` | None |
| Dollar conversion | Yahoo `CCYUSD=X` | None |
| Headlines | Yahoo Finance search news | None |
| Bitcoin live price, market cap, 24h change, and the Facts & figures panel (height, hashrate, difficulty, supply and percent mined, halving, fees, mempool, nodes, transactions) | [timechainstats.com](https://timechainstats.com/) via the public Sidewinder snapshots and Diamondback routes that board loads. CoinGecko, then CoinPaprika, only if the price and market cap fail | None. The server reads the public page key at runtime. `TIMECHAIN_API_KEY` is optional and must not be committed. |
| Bitcoin market-cap history | [Blockchain.com charts](https://api.blockchain.info/charts/market-cap?timespan=all&format=json&sampled=true). Timechain Stats publishes a price history, not this market-cap series | None |
| Options catalog | `GET https://dudediligence.club/v1/options/meta` | None. Public, cached about ten minutes. |
| Options chain | `GET https://dudediligence.club/v1/options/gex/{SYMBOL}?expiries=5` | Server sign-in. See below. |

Pages cache for about a minute (`cacheLife("minutes")`), then refresh in the background. The Refresh button expires that cache immediately.

### Who is counted

- Yahoo's US-region equity screener, market cap above $700 billion. That picks up US listings and ADRs such as TSM and SPCX.
- Plus three home listings that do not show up as dollar companies on that screener: Saudi Aramco, Samsung Electronics common, and SK hynix in Seoul.
- Share classes collapse to one company: GOOGL rather than GOOG, BRK-B rather than BRK-A.
- SK hynix is the Seoul line. Yahoo's US line `SKHY` reports about ten times as many shares as `000660.KS`, which inflates that dollar cap. Counting both would also double the company. The home listing, converted from won, is the figure that has to clear $1 trillion.
- A company outside this net will not appear until the net is widened. The US screener plus those three home listings covers the names that were actually around the line when this was built.

### Charts

Company charts are monthly closes from 2005 (or the whole listing, if it is younger), scaled so the last point equals the live dollar market cap. They do not replay buybacks or issuance. The caption on the page says so.

Bitcoin's chart is the measured market cap of coins in circulation, on a log scale. That history is Blockchain.com. The live point on the end of the line is the timechainstats.com cap.

### DudeDiligence options

The site is a Next.js app. Public pages such as `/s/AAPL/options` render the shell and then request JSON from the site's own API.

What is public:

- `GET /v1/options/meta` returns the options universe (about 2,600 underlyings) with `symbol`, `enabled`, and `latest_as_of`. No login. AAPL, NVDA, MSFT, GOOGL, AMZN, META, AVGO, TSLA, TSM, SPCX, LLY, MU, and **IBIT** are enabled. BTC, BRK-B, 2222.SR, and 005930.KS are not in the catalog.
- `robots.txt` disallows crawling `/api/` and `/v1/`.

What is not public:

- `GET /v1/options/gex/{SYMBOL}?expiries=5` returns `401` and `{"detail":"Gamma Exposure needs a signed-in account."}`.
- The same client calls `/v1/options/gex/{SYMBOL}/history`, `/at/{time}`, `/live`, and `POST /v1/options/refresh/{SYMBOL}`. Those are the same gated family.
- The logged-out HTML does not include strikes, expirations, or gamma. There is nothing honest to scrape off the page.

Sign-in is Auth0 Universal Login (the page titled “Log in | Dudediligence”), not a cookie you paste from your browser. The public app rejects Auth0’s password grant and cross-origin login, so the server posts the username and password form itself, exchanges the authorization code, and calls `POST /v1/session` with the ID token. It keeps that session in memory and signs in again when the token is close to expiry or the gamma route answers 401. The Auth0 domain and client id are read from the live DudeDiligence page, so a move to a custom domain does not keep sending tokens from the old issuer.

Set these two variables. The sign-in form labels the first field **Username**. Put that value in `DUDEDILIGENCE_EMAIL` (the account email, when that is the username). `DUDEDILIGENCE_USERNAME` is accepted only when `DUDEDILIGENCE_EMAIL` is empty.

```bash
DUDEDILIGENCE_EMAIL="the Username from the sign-in form"
DUDEDILIGENCE_PASSWORD="the account password"
```

Do not commit either value. Restart the server, or use Refresh.

If either `DUDEDILIGENCE_COOKIE` or `DUDEDILIGENCE_AUTHORIZATION` is set, automatic login is skipped and those headers are sent instead. Leave them unset unless you need to bypass the form.

### Setting this on Vercel

The five-expiry board stays on the public catalog until these variables exist on the Vercel project. Open the project, then **Settings → Environment Variables**, and add:

| Name | Required | Value |
| --- | --- | --- |
| `DUDEDILIGENCE_EMAIL` | Yes, for automatic sign-in | The Username from the DudeDiligence / Auth0 sign-in form. Use the account email when that is the username. |
| `DUDEDILIGENCE_PASSWORD` | Yes, for automatic sign-in | The password for that account. Mark it Sensitive. |
| `DUDEDILIGENCE_USERNAME` | No | Same Username field. Used only when `DUDEDILIGENCE_EMAIL` is empty. |
| `DUDEDILIGENCE_COOKIE` | No | Optional override. Full `Cookie` header from a signed-in gamma request. If set, the server does not log in. |
| `DUDEDILIGENCE_AUTHORIZATION` | No | Optional override. Full `Authorization` header, including `Bearer `. If set, the server does not log in. |

Enable `DUDEDILIGENCE_EMAIL` and `DUDEDILIGENCE_PASSWORD` for Production, and for Preview if you want the board on preview deployments. Save, then redeploy. Vercel does not pick up new environment variables until the next deployment. Do not paste the password, cookie, or token into the repo, a pull request, or a build log.

What automatic login cannot do:

- Auth0 captcha or bot detection (reCAPTCHA, hCaptcha, Arkose, Turnstile, or an “AnomalyDetected” block). The login form did not show a captcha when this was built. If Auth0 turns one on, sign-in fails and the page keeps the DudeDiligence link.
- Auth0 MFA, email codes, or a passkey prompt on the Auth0 page. DudeDiligence also offers passkeys after you are signed in; those are WebAuthn and stay in the browser.
- A Google-only account. “Continue with Google” cannot be completed from the server.
- A password the form rejects. The page says so, and still links to the board.

`TIMECHAIN_API_KEY` is optional. Leave it unset and the server reads the public key from the timechainstats.com page script. Set it on Vercel only if you want to skip that lookup. Mark it sensitive and do not commit it.

The parser expects the board the site's own client reads: `by_expiry` (or `expiries` / `per_expiry`, including a nested `levels` object) with `net_gex`, `call_wall`, `put_wall`, `gex_flip` / `zero_gamma`, `forward`, and optional `strikes` (`call_gex`, `put_gex`, `call_oi`, `put_oi`). Net gamma is labeled as that site's dollar figure per 1% move. If the JSON shape changes, the page says the board came back without rows instead of inventing strikes.

Without a working sign-in, every covered name still shows the options section, the catalog time, the exact URL, and why the chain is missing. Names the catalog does not list say that plainly. No strikes are filled in from somewhere else.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DUDEDILIGENCE_EMAIL` | For options chains | Username from the DudeDiligence sign-in form. Often the account email. |
| `DUDEDILIGENCE_PASSWORD` | For options chains | Password for that account. The server signs in and refreshes the session on its own. |
| `DUDEDILIGENCE_USERNAME` | No | Same username field, used only when `DUDEDILIGENCE_EMAIL` is empty. |
| `DUDEDILIGENCE_COOKIE` | No | Optional override. Skips automatic login. |
| `DUDEDILIGENCE_AUTHORIZATION` | No | Optional override. Full `Authorization` value, including `Bearer `. Skips automatic login. |
| `TIMECHAIN_API_KEY` | No | Skips the public timechainstats.com key lookup. |

## Fonts

Fraunces, Outfit, and IBM Plex Mono are loaded through `next/font` and are under the SIL Open Font License. The morning brief vendors the same three faces.
