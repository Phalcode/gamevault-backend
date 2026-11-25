import type { AppConfiguration } from "../../configuration.js";
import { TAURI_APP_ORIGINS } from "../../tauri-app-origins.js";

/**
 * Canonicalise a user-supplied origin string. Only `http`/`https` origins and
 * the known Tauri origins are accepted, everything else (including opaque and
 * non-web schemes such as `javascript:`, `file:`, `data:` or a literal `null`)
 * is rejected.
 */
function normalizeOrigin(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  // `tauri://localhost` has no serialisable WHATWG origin (`new URL().origin`
  // is `"null"`), so match it verbatim before falling back to URL parsing.
  const tauriOrigin = TAURI_APP_ORIGINS.find(
    (origin) => origin.toLowerCase() === trimmed.toLowerCase(),
  );
  if (tauriOrigin) return tauriOrigin;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Whether an already normalised origin is plain `http` on a loopback IP
 * literal, on any port. This is the redirect target of a native app that opens
 * the login in the system browser and waits on a local listener (RFC 8252,
 * section 7.3).
 *
 * `localhost` is deliberately not accepted: it is a name and may resolve to
 * something other than the loopback interface (RFC 8252, section 8.3).
 */
export function isLoopbackOrigin(origin: string): boolean {
  const { protocol, hostname } = new URL(origin);
  return (
    protocol === "http:" && (hostname === "127.0.0.1" || hostname === "[::1]")
  );
}

/** The origin an OAuth2 login returns to, and how the result is delivered. */
export interface OAuthReturnTarget {
  /** Normalised origin the login result goes to. */
  origin: string;
  /**
   * True for a native app's loopback listener, which receives a one-time code
   * and has to prove with PKCE that it started the login. False for every
   * explicitly allowed origin, which keeps the historical token handoff.
   */
  loopback: boolean;
}

/** Origins that are trusted regardless of the loopback switch. */
function explicitlyAllowedOrigins(config: AppConfiguration): Set<string> {
  const allowed = new Set<string>(TAURI_APP_ORIGINS);
  if (config.AUTH.OAUTH2.CALLBACK_URL) {
    const callbackOrigin = normalizeOrigin(config.AUTH.OAUTH2.CALLBACK_URL);
    if (callbackOrigin) allowed.add(callbackOrigin);
  }
  for (const entry of config.SERVER.CORS_ALLOWED_ORIGINS) {
    const allowedOrigin = normalizeOrigin(entry);
    if (allowedOrigin) allowed.add(allowedOrigin);
  }
  return allowed;
}

/**
 * Resolve where an OAuth2 login should return its result to, and whether that
 * destination is a native loopback listener or an explicitly allowed origin.
 *
 * The value originates from an untrusted `client_origin` query parameter and is
 * therefore only honoured when it matches an explicitly trusted origin:
 *
 * - the GameVault server itself (derived from the configured callback URL),
 * - any origin listed in `SERVER_CORS_ALLOWED_ORIGINS` (e.g. a separately
 *   hosted Web UI),
 * - the fixed Tauri desktop origins above, or
 * - a loopback address (`http://127.0.0.1:<port>` or `http://[::1]:<port>`),
 *   unless `AUTH_OAUTH2_LOOPBACK_RETURN_ENABLED` is turned off.
 *
 * An explicitly allowed origin keeps the historical token handoff, even when
 * it is a loopback address. Only a loopback origin that the switch enables and
 * that is not explicitly allowed becomes the native flow: only a process on
 * the user's own device can receive that redirect, and it receives a one-time
 * code instead of tokens.
 *
 * Anything else returns `null`, which makes the caller fall back to the
 * server's own origin. This prevents the endpoint from becoming an open
 * redirect that leaks tokens to attacker-controlled hosts.
 */
export function resolveOAuthReturnTarget(
  rawOrigin: unknown,
  config: AppConfiguration,
): OAuthReturnTarget | null {
  if (typeof rawOrigin !== "string") return null;
  const origin = normalizeOrigin(rawOrigin);
  if (!origin) return null;

  if (explicitlyAllowedOrigins(config).has(origin)) {
    return { origin, loopback: false };
  }
  if (config.AUTH.OAUTH2.LOOPBACK_RETURN_ENABLED && isLoopbackOrigin(origin)) {
    return { origin, loopback: true };
  }
  return null;
}

/** Convenience wrapper for callers that only need the destination origin. */
export function resolveOAuthReturnOrigin(
  rawOrigin: unknown,
  config: AppConfiguration,
): string | null {
  return resolveOAuthReturnTarget(rawOrigin, config)?.origin ?? null;
}
