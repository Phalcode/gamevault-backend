/**
 * Tests for the configuration module helper functions.
 * Since the helper functions are module-scoped, we test them via
 * their effects on the configuration object and exported utilities.
 */

import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { getCensoredConfiguration } from "./configuration.js";

describe("Configuration", () => {
  describe("getCensoredConfiguration", () => {
    it("should return a configuration object", () => {
      const config = getCensoredConfiguration();
      expect(config).toBeDefined();
      expect(config.SERVER).toBeDefined();
      expect(config.DB).toBeDefined();
      expect(config.VOLUMES).toBeDefined();
    });

    it("should redact sensitive database password", () => {
      const config = getCensoredConfiguration();
      // DB password should either be null or REDACTED
      if (config.DB.PASSWORD) {
        expect(config.DB.PASSWORD).toBe("**REDACTED**");
      }
    });

    it("should redact sensitive admin password", () => {
      const config = getCensoredConfiguration();
      if (config.SERVER.ADMIN_PASSWORD) {
        expect(config.SERVER.ADMIN_PASSWORD).toBe("**REDACTED**");
      }
    });

    it("should redact IGDB client ID", () => {
      const config = getCensoredConfiguration();
      if (config.METADATA.IGDB.CLIENT_ID) {
        expect(config.METADATA.IGDB.CLIENT_ID).toBe("**REDACTED**");
      }
    });

    it("should redact IGDB client secret", () => {
      const config = getCensoredConfiguration();
      if (config.METADATA.IGDB.CLIENT_SECRET) {
        expect(config.METADATA.IGDB.CLIENT_SECRET).toBe("**REDACTED**");
      }
    });

    it("should redact AUTH seed", () => {
      const config = getCensoredConfiguration();
      if (config.AUTH.SEED) {
        expect(config.AUTH.SEED).toBe("**REDACTED**");
      }
    });

    it("should not modify non-sensitive values", () => {
      const config = getCensoredConfiguration();
      expect(typeof config.SERVER.PORT).toBe("number");
      expect(config.SERVER.PORT).toBeGreaterThan(0);
    });

    it("should convert undefined values to null", () => {
      const config = getCensoredConfiguration();
      // The JSON.parse(JSON.stringify()) in getCensoredConfiguration converts
      // undefined to null, so no value should be undefined
      const configStr = JSON.stringify(config);
      expect(configStr).not.toContain("undefined");
    });
  });

  describe("configuration defaults", () => {
    // Test the default configuration values are reasonable
    let config: typeof import("./configuration.js").default;

    beforeAll(async () => {
      config = (await import("./configuration.js")).default;
    });

    it("should have default server port", () => {
      expect(config.SERVER.PORT).toBeDefined();
      expect(typeof config.SERVER.PORT).toBe("number");
    });

    it("should have a version string", () => {
      expect(config.SERVER.VERSION).toBeDefined();
      expect(typeof config.SERVER.VERSION).toBe("string");
    });

    it("should have volume paths", () => {
      expect(config.VOLUMES.FILES).toBeDefined();
      expect(config.VOLUMES.MEDIA).toBeDefined();
      expect(config.VOLUMES.CONFIG).toBeDefined();
      expect(config.VOLUMES.LOGS).toBeDefined();
    });

    it("should have database configuration", () => {
      expect(config.DB.SYSTEM).toBeDefined();
      expect(config.DB.HOST).toBeDefined();
    });

    it("should have testing configuration", () => {
      expect(typeof config.TESTING.AUTHENTICATION_DISABLED).toBe("boolean");
      expect(typeof config.TESTING.MOCK_FILES).toBe("boolean");
      expect(typeof config.TESTING.IN_MEMORY_DB).toBe("boolean");
    });

    it("should have game supported formats", () => {
      expect(config.GAMES.SUPPORTED_FILE_FORMATS).toBeDefined();
      expect(Array.isArray(config.GAMES.SUPPORTED_FILE_FORMATS)).toBe(true);
      expect(config.GAMES.SUPPORTED_FILE_FORMATS.length).toBeGreaterThan(0);
    });

    it("should have auth configuration", () => {
      expect(config.AUTH.SEED).toBeDefined();
      expect(typeof config.AUTH.SEED).toBe("string");
      expect(config.AUTH.SEED.length).toBeGreaterThan(0);
    });

    it("should have computed access token secret", () => {
      expect(config.AUTH.ACCESS_TOKEN.SECRET).toBeDefined();
      expect(typeof config.AUTH.ACCESS_TOKEN.SECRET).toBe("string");
    });

    it("should have computed refresh token secret different from access token secret", () => {
      expect(config.AUTH.REFRESH_TOKEN.SECRET).not.toBe(
        config.AUTH.ACCESS_TOKEN.SECRET,
      );
    });

    it("should have parental control defaults", () => {
      expect(typeof config.PARENTAL.AGE_RESTRICTION_ENABLED).toBe("boolean");
      expect(config.PARENTAL.AGE_OF_MAJORITY).toBeDefined();
    });

    it("should have media configuration", () => {
      expect(config.MEDIA.MAX_SIZE).toBeGreaterThan(0);
      expect(Array.isArray(config.MEDIA.SUPPORTED_FORMATS)).toBe(true);
    });
  });

  describe("YAML configuration fallback", () => {
    let tempConfigDir: string;

    beforeEach(() => {
      tempConfigDir = mkdtempSync(join(tmpdir(), "gamevault-config-"));
      process.env.VOLUMES_CONFIG = tempConfigDir;
      delete process.env.SERVER_PORT;
      vi.resetModules();
    });

    afterEach(() => {
      delete process.env.VOLUMES_CONFIG;
      delete process.env.SERVER_PORT;
      rmSync(tempConfigDir, { recursive: true, force: true });
    });

    it("should use YAML values when corresponding env vars are unset", async () => {
      writeFileSync(
        join(tempConfigDir, "config.yaml"),
        "server:\n  port: 9191\n",
      );

      const { default: config } = await import("./configuration.js");

      expect(config.SERVER.PORT).toBe(9191);
    });

    it("should prioritize env vars over YAML values", async () => {
      writeFileSync(
        join(tempConfigDir, "config.yaml"),
        "server:\n  port: 9191\n",
      );
      process.env.SERVER_PORT = "8089";

      const { default: config } = await import("./configuration.js");

      expect(config.SERVER.PORT).toBe(8089);
    });
  });
});
