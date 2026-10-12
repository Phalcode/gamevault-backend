import type { AppConfiguration } from "../../configuration.js";
import { resolveOAuthReturnOrigin } from "./oauth-return-origin.js";

function buildConfig(options?: {
  callbackUrl?: string;
  corsOrigins?: string[];
}): AppConfiguration {
  return {
    AUTH: { OAUTH2: { CALLBACK_URL: options?.callbackUrl } },
    SERVER: { CORS_ALLOWED_ORIGINS: options?.corsOrigins ?? [] },
  } as unknown as AppConfiguration;
}

const config = buildConfig({
  callbackUrl: "https://demo.gamevau.lt/api/auth/oauth2/login",
});

describe("resolveOAuthReturnOrigin", () => {
  it("allows the server origin derived from the callback URL", () => {
    expect(resolveOAuthReturnOrigin("https://demo.gamevau.lt", config)).toBe(
      "https://demo.gamevau.lt",
    );
  });

  it("allows the Windows/Android desktop origin", () => {
    expect(resolveOAuthReturnOrigin("http://tauri.localhost", config)).toBe(
      "http://tauri.localhost",
    );
  });

  it("allows the macOS/Linux desktop origin", () => {
    expect(resolveOAuthReturnOrigin("tauri://localhost", config)).toBe(
      "tauri://localhost",
    );
  });

  it("allows explicitly configured CORS origins (e.g. a separately hosted Web UI)", () => {
    const withCors = buildConfig({
      callbackUrl: "https://demo.gamevau.lt/api/auth/oauth2/login",
      corsOrigins: ["http://localhost:5173"],
    });
    expect(resolveOAuthReturnOrigin("http://localhost:5173", withCors)).toBe(
      "http://localhost:5173",
    );
  });

  it("normalises trailing slashes", () => {
    expect(resolveOAuthReturnOrigin("https://demo.gamevau.lt/", config)).toBe(
      "https://demo.gamevau.lt",
    );
  });

  it("ignores case and trailing slashes for the desktop origin", () => {
    expect(resolveOAuthReturnOrigin("HTTP://TAURI.LOCALHOST/", config)).toBe(
      "http://tauri.localhost",
    );
  });

  it("rejects an arbitrary origin", () => {
    expect(resolveOAuthReturnOrigin("https://evil.example", config)).toBeNull();
  });

  it("rejects an origin that merely resembles the server origin", () => {
    expect(
      resolveOAuthReturnOrigin("https://demo.gamevau.lt.evil.example", config),
    ).toBeNull();
  });

  it("rejects non-http(s) schemes", () => {
    for (const origin of [
      "javascript:alert(1)",
      "file:///etc/passwd",
      "data:text/html,<script></script>",
      "null",
    ]) {
      expect(resolveOAuthReturnOrigin(origin, config)).toBeNull();
    }
  });

  it("rejects empty, missing and non-string values", () => {
    expect(resolveOAuthReturnOrigin(undefined, config)).toBeNull();
    expect(resolveOAuthReturnOrigin(null, config)).toBeNull();
    expect(resolveOAuthReturnOrigin("", config)).toBeNull();
    expect(resolveOAuthReturnOrigin(42, config)).toBeNull();
  });

  it("does not trust the server origin when no callback URL is configured", () => {
    const withoutCallback = buildConfig();
    expect(
      resolveOAuthReturnOrigin("https://demo.gamevau.lt", withoutCallback),
    ).toBeNull();
    expect(
      resolveOAuthReturnOrigin("http://tauri.localhost", withoutCallback),
    ).toBe("http://tauri.localhost");
  });
});
