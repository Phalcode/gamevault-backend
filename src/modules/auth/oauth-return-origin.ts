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
 * Resolve the origin an OAuth2 login should return its tokens to.
 *
 * The value originates from an untrusted `client_origin` query parameter and is
 * therefore only honoured when it matches an explicitly trusted origin:
 *
 * - the GameVault server itself (derived from the configured callback URL),
 * - any origin listed in `SERVER_CORS_ALLOWED_ORIGINS` (e.g. a separately
 *   hosted Web UI), or
 * - the fixed Tauri desktop origins above.
 *
 * Anything else returns `null`, which makes the caller fall back to the
 * server's own origin. This prevents the endpoint from becoming an open
 * redirect that leaks tokens to attacker-controlled hosts.
 */
export function resolveOAuthReturnOrigin(
  rawOrigin: unknown,
  config: AppConfiguration,
): string | null {
  if (typeof rawOrigin !== "string") return null;
  const origin = normalizeOrigin(rawOrigin);
  if (!origin) return null;

  const allowed = new Set<string>(TAURI_APP_ORIGINS);
  if (config.AUTH.OAUTH2.CALLBACK_URL) {
    const callbackOrigin = normalizeOrigin(config.AUTH.OAUTH2.CALLBACK_URL);
    if (callbackOrigin) allowed.add(callbackOrigin);
  }
  for (const entry of config.SERVER.CORS_ALLOWED_ORIGINS) {
    const allowedOrigin = normalizeOrigin(entry);
    if (allowedOrigin) allowed.add(allowedOrigin);
  }

  return allowed.has(origin) ? origin : null;
}
