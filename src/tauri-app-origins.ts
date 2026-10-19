/**
 * Origins that the GameVault desktop (Tauri) shell can load its bundled Web UI
 * from. They are fixed by the desktop runtime and never derived from user
 * input, so they are always safe to trust:
 *
 * - `http://tauri.localhost` on Windows / Android
 * - `tauri://localhost` on macOS / Linux (custom protocol)
 *
 * The desktop app sends cross-origin requests from one of these origins, so
 * they must always be part of the CORS allowlist and are always valid OAuth2
 * return origins.
 */
export const TAURI_APP_ORIGINS = [
  "http://tauri.localhost",
  "tauri://localhost",
] as const;
