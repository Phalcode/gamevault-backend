import type { AppConfiguration } from "../../configuration.js";
import {
  resolveOAuthReturnOrigin,
  resolveOAuthReturnTarget,
} from "./oauth-return-origin.js";

function buildConfig(options?: {
  callbackUrl?: string;
  corsOrigins?: string[];
  loopbackReturn?: boolean;
}): AppConfiguration {
  return {
    AUTH: {
      OAUTH2: {
        CALLBACK_URL: options?.callbackUrl,
        LOOPBACK_RETURN_ENABLED: options?.loopbackReturn ?? true,
      },
    },
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

  describe("loopback return origins", () => {
    it("allows the IPv4 loopback address on any port", () => {
      expect(resolveOAuthReturnOrigin("http://127.0.0.1:49152", config)).toBe(
        "http://127.0.0.1:49152",
      );
      expect(resolveOAuthReturnOrigin("http://127.0.0.1:8080/", config)).toBe(
        "http://127.0.0.1:8080",
      );
    });

    it("allows the IPv6 loopback address on any port", () => {
      expect(resolveOAuthReturnOrigin("http://[::1]:49152", config)).toBe(
        "http://[::1]:49152",
      );
    });

    it("allows them without a callback URL or CORS entry", () => {
      expect(
        resolveOAuthReturnOrigin("http://127.0.0.1:49152", buildConfig()),
      ).toBe("http://127.0.0.1:49152");
    });

    it("returns the canonical form of alternative loopback spellings", () => {
      expect(resolveOAuthReturnOrigin("http://127.1:49152", config)).toBe(
        "http://127.0.0.1:49152",
      );
      expect(
        resolveOAuthReturnOrigin("http://[0:0:0:0:0:0:0:1]:49152", config),
      ).toBe("http://[::1]:49152");
    });

    it("rejects localhost", () => {
      expect(
        resolveOAuthReturnOrigin("http://localhost:49152", config),
      ).toBeNull();
    });

    it("rejects https on a loopback address", () => {
      expect(
        resolveOAuthReturnOrigin("https://127.0.0.1:49152", config),
      ).toBeNull();
      expect(
        resolveOAuthReturnOrigin("https://[::1]:49152", config),
      ).toBeNull();
    });

    it("rejects hosts that merely resemble a loopback address", () => {
      for (const origin of [
        "http://127.0.0.1.evil.example:49152",
        "http://127.0.0.1@evil.example:49152",
        "http://127.0.0.1:49152@evil.example",
        "http://evil.example#127.0.0.1:49152",
        "http://evil.example/127.0.0.1:49152",
      ]) {
        expect(resolveOAuthReturnOrigin(origin, config)).toBeNull();
      }
    });

    it("rejects other loopback, private and unspecified addresses", () => {
      for (const origin of [
        "http://127.0.0.2:49152",
        "http://0.0.0.0:49152",
        "http://10.0.0.1:49152",
        "http://172.16.0.1:49152",
        "http://192.168.1.10:49152",
        "http://169.254.1.1:49152",
        "http://[::]:49152",
        "http://[::ffff:127.0.0.1]:49152",
        "http://[fe80::1]:49152",
        "http://[fd00::1]:49152",
      ]) {
        expect(resolveOAuthReturnOrigin(origin, config)).toBeNull();
      }
    });

    it("rejects loopback addresses when the option is turned off", () => {
      const disabled = buildConfig({
        callbackUrl: "https://demo.gamevau.lt/api/auth/oauth2/login",
        loopbackReturn: false,
      });
      expect(
        resolveOAuthReturnOrigin("http://127.0.0.1:49152", disabled),
      ).toBeNull();
      expect(
        resolveOAuthReturnOrigin("http://[::1]:49152", disabled),
      ).toBeNull();
    });

    it("still allows a loopback origin listed in CORS when the option is off", () => {
      const disabled = buildConfig({
        corsOrigins: ["http://127.0.0.1:5173"],
        loopbackReturn: false,
      });
      expect(resolveOAuthReturnOrigin("http://127.0.0.1:5173", disabled)).toBe(
        "http://127.0.0.1:5173",
      );
      expect(
        resolveOAuthReturnOrigin("http://127.0.0.1:49152", disabled),
      ).toBeNull();
    });
  });

  describe("resolveOAuthReturnTarget", () => {
    it("marks a switch-enabled loopback origin as the native flow", () => {
      expect(
        resolveOAuthReturnTarget("http://127.0.0.1:49152", config),
      ).toEqual({
        origin: "http://127.0.0.1:49152",
        loopback: true,
      });
    });

    it("keeps a CORS-listed loopback origin on the token handoff", () => {
      const withCors = buildConfig({
        corsOrigins: ["http://127.0.0.1:5173"],
      });

      expect(
        resolveOAuthReturnTarget("http://127.0.0.1:5173", withCors),
      ).toEqual({
        origin: "http://127.0.0.1:5173",
        loopback: false,
      });
    });

    it("keeps a CORS-listed loopback origin on the token handoff when the switch is off", () => {
      const disabled = buildConfig({
        corsOrigins: ["http://127.0.0.1:5173"],
        loopbackReturn: false,
      });

      expect(
        resolveOAuthReturnTarget("http://127.0.0.1:5173", disabled),
      ).toEqual({
        origin: "http://127.0.0.1:5173",
        loopback: false,
      });
    });

    it("has no target for a loopback origin the switch does not allow", () => {
      const disabled = buildConfig({ loopbackReturn: false });

      expect(
        resolveOAuthReturnTarget("http://127.0.0.1:49152", disabled),
      ).toBeNull();
    });

    it("marks other explicitly allowed origins as the token handoff", () => {
      expect(
        resolveOAuthReturnTarget("https://demo.gamevau.lt", config),
      ).toEqual({
        origin: "https://demo.gamevau.lt",
        loopback: false,
      });
    });

    it("has no target for an untrusted origin", () => {
      expect(
        resolveOAuthReturnTarget("https://evil.example", config),
      ).toBeNull();
    });
  });
});
