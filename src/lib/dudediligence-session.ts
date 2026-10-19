import { createHash, randomBytes, randomUUID } from "node:crypto";

/**
 * DudeDiligence signs in through Auth0 Universal Login (authorization code + PKCE).
 * The public SPA client rejects the password grant and cross-origin login, so the
 * server posts the same username/password form the browser shows at /u/login,
 * exchanges the code, then opens POST /v1/session with the ID token.
 *
 * The Auth0 domain and client id are public values in the site bundle, not secrets.
 * They are read from that bundle on each cold start. DudeDiligence moved the
 * issuer to a custom domain; a token from the old tenant is rejected with
 * "token is from another issuer".
 * A captcha, bot-detection interstitial, or MFA page cannot be completed here.
 */

const ORIGIN = "https://dudediligence.club";
/** Used only when the live bundle cannot be read. Matches the current custom domain. */
const FALLBACK_AUTH = {
  host: "auth.dudediligence.club",
  clientId: "8edkjjfe3t2NFmSHA9bOpr7MKLSpEWMY",
};
const REDIRECT_URI = ORIGIN;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const clientId = randomUUID();

export type AuthConfig = {
  host: string;
  clientId: string;
};

let authCached: { at: number; value: AuthConfig } | null = null;
let authPending: Promise<AuthConfig> | null = null;

function validHost(host: string): boolean {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host) && !host.includes("..");
}

function validClientId(id: string): boolean {
  return /^[A-Za-z0-9_-]{10,80}$/.test(id);
}

function readAuthValue(source: string, token: string, near: number): string | null {
  const quoted = token.match(/^["']([^"']+)["']$/);
  if (quoted) return quoted[1];
  if (!/^[A-Za-z_$][\w$]*$/.test(token)) return null;
  const re = new RegExp(String.raw`(?:^|[^\w$])${token}\s*=\s*["']([^"']+)["']`, "g");
  let found: string | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const match of source.matchAll(re)) {
    const at = match.index ?? 0;
    const distance = Math.abs(at - near);
    if (distance < best) {
      best = distance;
      found = match[1];
    }
  }
  return found;
}

/** Pulls the Auth0 SPA `domain` and `clientId` out of a DudeDiligence bundle. */
export function discoverAuthConfigFromSource(source: string): AuthConfig | null {
  const patterns = [
    /\{[^{}]{0,500}?\bdomain\s*:\s*([^,}\s]+)[^{}]{0,500}?\bclientId\s*:\s*([^,}\s]+)/,
    /\{[^{}]{0,500}?\bclientId\s*:\s*([^,}\s]+)[^{}]{0,500}?\bdomain\s*:\s*([^,}\s]+)/,
  ];
  for (const [index, pattern] of patterns.entries()) {
    const match = source.match(pattern);
    if (!match || match.index == null) continue;
    const host = readAuthValue(source, index === 0 ? match[1] : match[2], match.index);
    const client = readAuthValue(source, index === 0 ? match[2] : match[1], match.index);
    if (host && client && validHost(host) && validClientId(client)) {
      return { host, clientId: client };
    }
  }
  return null;
}

async function discoverAuthConfig(): Promise<AuthConfig | null> {
  const home = await fetch(`${ORIGIN}/`, {
    cache: "no-store",
    headers: { accept: "text/html", "user-agent": BROWSER_UA },
    signal: AbortSignal.timeout(15000),
  });
  if (!home.ok) return null;
  const html = await home.text();
  const paths = [
    ...new Set(
      [...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((match) => match[1]),
    ),
  ];
  for (let index = 0; index < paths.length; index += 4) {
    const batch = paths.slice(index, index + 4);
    const sources = await Promise.all(
      batch.map(async (path) => {
        try {
          const res = await fetch(`${ORIGIN}${path}`, {
            cache: "no-store",
            headers: { "user-agent": BROWSER_UA },
            signal: AbortSignal.timeout(15000),
          });
          return res.ok ? await res.text() : "";
        } catch {
          return "";
        }
      }),
    );
    for (const source of sources) {
      const found = discoverAuthConfigFromSource(source);
      if (found) return found;
    }
  }
  return null;
}

export async function loadAuthConfig(force = false): Promise<AuthConfig> {
  if (!force && authCached && Date.now() - authCached.at < 30 * 60 * 1000) return authCached.value;
  if (!force && authPending) return authPending;
  const run = discoverAuthConfig()
    .then((found) => {
      const value = found ?? FALLBACK_AUTH;
      if (found) authCached = { at: Date.now(), value };
      return value;
    })
    .catch(() => FALLBACK_AUTH);
  const tracked = run.finally(() => {
    if (authPending === tracked) authPending = null;
  });
  authPending = tracked;
  return tracked;
}

export function invalidateAuthConfig(): void {
  authCached = null;
}

export class DudeDiligenceLoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DudeDiligenceLoginError";
  }
}

export type SiteSession = {
  cookie?: string;
  authorization?: string;
  expiresAt: number;
};

type CredentialMode = "override" | "password" | "incomplete" | "none";

let cached: SiteSession | null = null;
let pending: Promise<SiteSession> | null = null;
let generation = 0;

function username(): string | null {
  const email = process.env.DUDEDILIGENCE_EMAIL?.trim();
  const handle = process.env.DUDEDILIGENCE_USERNAME?.trim();
  return email || handle || null;
}

function password(): string | null {
  const value = process.env.DUDEDILIGENCE_PASSWORD;
  if (value == null || value === "") return null;
  return value;
}

export function credentialMode(): CredentialMode {
  const cookie = process.env.DUDEDILIGENCE_COOKIE?.trim();
  const authorization = process.env.DUDEDILIGENCE_AUTHORIZATION?.trim();
  if (cookie || authorization) return "override";
  const user = username();
  const secret = password();
  if (user && secret) return "password";
  if (user || secret) return "incomplete";
  return "none";
}

export function overrideHeaders(): Record<string, string> | null {
  const headers: Record<string, string> = {};
  const cookie = process.env.DUDEDILIGENCE_COOKIE?.trim();
  const authorization = process.env.DUDEDILIGENCE_AUTHORIZATION?.trim();
  if (cookie) headers.Cookie = cookie;
  if (authorization) headers.Authorization = authorization;
  return cookie || authorization ? headers : null;
}

export function invalidateSiteSession(): void {
  cached = null;
  generation += 1;
}

export function sessionHeaderAttempts(session: SiteSession): Record<string, string>[] {
  const attempts: Record<string, string>[] = [];
  if (session.cookie && session.authorization) {
    attempts.push({ Cookie: session.cookie, Authorization: session.authorization });
    attempts.push({ Cookie: session.cookie });
    attempts.push({ Authorization: session.authorization });
  } else if (session.cookie) {
    attempts.push({ Cookie: session.cookie });
  } else if (session.authorization) {
    attempts.push({ Authorization: session.authorization });
  }
  return attempts.map((headers) => ({ ...headers, "x-client-id": clientId }));
}

export async function getSiteSession(force = false): Promise<SiteSession> {
  if (credentialMode() !== "password") {
    throw new DudeDiligenceLoginError(
      "Set both DUDEDILIGENCE_EMAIL and DUDEDILIGENCE_PASSWORD. The sign-in form calls the first field Username; DUDEDILIGENCE_USERNAME is accepted when EMAIL is unset.",
    );
  }
  if (!force && cached && cached.expiresAt > Date.now() + 60_000) return cached;
  if (!force && pending) return pending;
  const gen = generation;
  const run = login().then((session) => {
    if (generation === gen) cached = session;
    return session;
  });
  const tracked = run.finally(() => {
    if (pending === tracked) pending = null;
  });
  pending = tracked;
  return tracked;
}

function base64url(bytes: Buffer): string {
  return bytes.toString("base64url");
}

function safePhrase(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || text.length > 180) return null;
  if (!/^[A-Za-z0-9 .,'():/_-]{1,180}$/.test(text)) return null;
  return text;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripMarkup(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

export function classifyLoginHtml(
  html: string,
): "wrong-credentials" | "captcha" | "mfa" | "anomaly" | "form" | "unknown" {
  const stripped = stripMarkup(html);
  const lower = stripped.toLowerCase();
  if (
    lower.includes("wrong-username-credentials") ||
    lower.includes("incorrect username or password") ||
    lower.includes("wrong email or password")
  ) {
    return "wrong-credentials";
  }
  if (lower.includes("data-captcha-sitekey") || lower.includes("data-captcha-provider")) {
    return "captcha";
  }
  if (
    lower.includes("anomalydetected") ||
    lower.includes("access_denied") ||
    lower.includes("bot detection")
  ) {
    return "anomaly";
  }
  if (
    /\/u\/mfa|one-time code|verification code|authenticator app|two-factor|multi-factor|use your passkey|enter the code/i.test(
      stripped,
    )
  ) {
    return "mfa";
  }
  if (lower.includes('name="password"') && lower.includes('name="username"')) return "form";
  return "unknown";
}

function hiddenValue(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<input[^>]*name="${name}"[^>]*value="([^"]*)"`, "i"),
    new RegExp(`<input[^>]*value="([^"]*)"[^>]*name="${name}"`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1]);
  }
  return null;
}

function absorbCookies(jar: Map<string, string>, res: Response): void {
  const lines = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const line of lines) {
    const semi = line.indexOf(";");
    const pair = (semi === -1 ? line : line.slice(0, semi)).trim();
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (!value || /max-age=0/i.test(line)) jar.delete(name);
    else jar.set(name, value);
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function auth0Fetch(
  url: string,
  jar: Map<string, string>,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("user-agent")) headers.set("user-agent", BROWSER_UA);
  if (!headers.has("accept")) headers.set("accept", "text/html,application/xhtml+xml");
  const cookie = cookieHeader(jar);
  if (cookie) headers.set("cookie", cookie);
  const res = await fetch(url, { ...init, headers, redirect: "manual", cache: "no-store" });
  absorbCookies(jar, res);
  return res;
}

function jwtExpiresAt(token: string): number | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    if (typeof payload.exp === "number" && Number.isFinite(payload.exp)) return payload.exp * 1000;
  } catch {
    return null;
  }
  return null;
}

function loginFailure(kind: ReturnType<typeof classifyLoginHtml>, status: number): DudeDiligenceLoginError {
  if (kind === "wrong-credentials") {
    return new DudeDiligenceLoginError(
      "DudeDiligence rejected DUDEDILIGENCE_EMAIL / DUDEDILIGENCE_PASSWORD (incorrect username or password).",
    );
  }
  if (kind === "captcha") {
    return new DudeDiligenceLoginError(
      "Auth0 asked for a captcha, so automatic sign-in cannot finish. Set DUDEDILIGENCE_COOKIE as an override, or leave the board linked.",
    );
  }
  if (kind === "mfa") {
    return new DudeDiligenceLoginError(
      "Auth0 stopped at a second factor (MFA, email code, or passkey). Automatic sign-in cannot complete that step. Use DUDEDILIGENCE_COOKIE while MFA is on.",
    );
  }
  if (kind === "anomaly") {
    return new DudeDiligenceLoginError(
      "Auth0 blocked the sign-in as automated traffic. A captcha or bot check is in the way, so the server stopped.",
    );
  }
  return new DudeDiligenceLoginError(
    `Auth0 returned the sign-in page without a session (${status}). Automatic login did not finish.`,
  );
}

function jwtIssuer(token: string): string | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as {
      iss?: unknown;
    };
    return typeof payload.iss === "string" ? payload.iss : null;
  } catch {
    return null;
  }
}

async function login(): Promise<SiteSession> {
  const first = await loadAuthConfig();
  try {
    return await loginWith(first);
  } catch (error) {
    if (!(error instanceof DudeDiligenceLoginError) || !/another issuer/i.test(error.message)) {
      throw error;
    }
    invalidateAuthConfig();
    const fresh = await loadAuthConfig(true);
    if (fresh.host === first.host && fresh.clientId === first.clientId) throw error;
    return loginWith(fresh);
  }
}

async function loginWith(config: AuthConfig): Promise<SiteSession> {
  const user = username();
  const secret = password();
  if (!user || !secret) {
    throw new DudeDiligenceLoginError(
      "Set both DUDEDILIGENCE_EMAIL and DUDEDILIGENCE_PASSWORD.",
    );
  }

  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  const oauthState = base64url(randomBytes(16));
  const nonce = base64url(randomBytes(16));
  const authorize = new URL(`https://${config.host}/authorize`);
  authorize.searchParams.set("client_id", config.clientId);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("redirect_uri", REDIRECT_URI);
  authorize.searchParams.set("scope", "openid profile email");
  authorize.searchParams.set("state", oauthState);
  authorize.searchParams.set("nonce", nonce);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  authorize.searchParams.set("response_mode", "query");
  authorize.searchParams.set("prompt", "login");
  authorize.searchParams.set("max_age", "0");

  const jar = new Map<string, string>();
  let current = authorize.toString();
  let res = await auth0Fetch(current, jar);
  for (let hop = 0; hop < 6 && res.status >= 300 && res.status < 400; hop += 1) {
    const location = res.headers.get("location");
    if (!location) break;
    const dest = new URL(location, current);
    if (dest.hostname !== config.host) {
      throw new DudeDiligenceLoginError(
        "Auth0 left the sign-in page before showing a username form.",
      );
    }
    current = dest.toString();
    res = await auth0Fetch(current, jar);
  }
  if (!res.ok) {
    throw new DudeDiligenceLoginError(`Auth0 did not open the sign-in form (${res.status}).`);
  }
  const formHtml = await res.text();
  const formKind = classifyLoginHtml(formHtml);
  if (formKind !== "form") throw loginFailure(formKind, res.status);
  const formState = hiddenValue(formHtml, "state");
  if (!formState) {
    throw new DudeDiligenceLoginError("Auth0's sign-in form had no state field.");
  }

  const body = new URLSearchParams();
  body.set("state", formState);
  body.set("username", user);
  body.set("password", secret);
  body.set("action", "default");
  res = await auth0Fetch(current, jar, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      origin: `https://${config.host}`,
      referer: current,
    },
    body,
  });

  let code: string | null = null;
  for (let hop = 0; hop < 8; hop += 1) {
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      const dest = new URL(location, current);
      if (dest.hostname === "dudediligence.club") {
        code = dest.searchParams.get("code");
        const returned = dest.searchParams.get("state");
        if (!code || returned !== oauthState) {
          throw new DudeDiligenceLoginError(
            "Auth0 redirected back without a usable authorization code.",
          );
        }
        break;
      }
      if (dest.hostname !== config.host) {
        throw new DudeDiligenceLoginError(
          "Sign-in left Auth0 for another provider. Google sign-in cannot be completed from the server.",
        );
      }
      if (/\/mfa|challenge/i.test(dest.pathname)) {
        throw loginFailure("mfa", res.status);
      }
      current = dest.toString();
      res = await auth0Fetch(current, jar);
      continue;
    }
    const html = await res.text();
    throw loginFailure(classifyLoginHtml(html), res.status);
  }
  if (!code) {
    throw new DudeDiligenceLoginError("Auth0 did not return an authorization code.");
  }

  const tokenRes = await fetch(`https://${config.host}/oauth/token`, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: config.clientId,
      code_verifier: verifier,
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const tokenJson = (await tokenRes.json().catch(() => null)) as {
    error?: string;
    error_description?: string;
    id_token?: string;
  } | null;
  const idToken = tokenJson && typeof tokenJson.id_token === "string" ? tokenJson.id_token : "";
  if (!tokenRes.ok || !idToken) {
    const detail = safePhrase(tokenJson?.error_description) ?? safePhrase(tokenJson?.error);
    throw new DudeDiligenceLoginError(
      detail
        ? `Auth0 did not issue an ID token (${detail}).`
        : "Auth0 did not issue an ID token.",
    );
  }
  const iss = jwtIssuer(idToken);
  const expected = `https://${config.host}/`;
  if (iss && iss !== expected && iss !== expected.slice(0, -1)) {
    throw new DudeDiligenceLoginError(
      `Auth0 issued a token from ${safePhrase(iss) ?? "an unexpected issuer"}, not ${expected}. DudeDiligence rejects that as another issuer.`,
    );
  }

  const sessionRes = await fetch(`${ORIGIN}/v1/session`, {
    method: "POST",
    cache: "no-store",
    redirect: "manual",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${idToken}`,
      "x-client-id": clientId,
      origin: ORIGIN,
      "user-agent": "TrillionInsights/1.0",
    },
  });
  const siteJar = new Map<string, string>();
  absorbCookies(siteJar, sessionRes);
  const sessionText = await sessionRes.text();
  let detail: string | null = null;
  if (sessionText) {
    try {
      const parsed = JSON.parse(sessionText) as { detail?: unknown };
      detail = safePhrase(parsed.detail);
    } catch {
      detail = null;
    }
  }
  if (sessionRes.status === 401 && detail === "fresh sign-in required") {
    throw new DudeDiligenceLoginError(
      "DudeDiligence refused the new Auth0 token (fresh sign-in required). The board stays linked.",
    );
  }
  if (!sessionRes.ok) {
    throw new DudeDiligenceLoginError(
      detail
        ? `DudeDiligence did not open a session (${sessionRes.status}: ${detail}).`
        : `DudeDiligence did not open a session (${sessionRes.status}).`,
    );
  }

  const cookie = cookieHeader(siteJar);
  const expiresAt = jwtExpiresAt(idToken) ?? Date.now() + 30 * 60 * 1000;
  return {
    cookie: cookie || undefined,
    authorization: `Bearer ${idToken}`,
    expiresAt,
  };
}
