import { TAURI_APP_ORIGINS } from "./tauri-app-origins.js";

/**
 * Build the CORS origin allowlist from `SERVER_CORS_ALLOWED_ORIGINS`.
 *
 * The Tauri desktop origins are always appended. The desktop app talks to the
 * server cross-origin, so a server that restricts CORS to its own Web UI would
 * otherwise lock the desktop client out of its own server.
 *
 * An empty list or a configured `*` allows every origin.
 */
export function resolveCorsOriginAllowlist(
  configuredOrigins: readonly string[],
): true | string[] {
  const explicitlyAllowed = configuredOrigins.filter(
    (origin) => origin !== "*",
  );
  if (explicitlyAllowed.length === 0) return true;

  return [...new Set([...explicitlyAllowed, ...TAURI_APP_ORIGINS])];
}
