import * as fsExtraModule from "fs-extra";
import { extractFull } from "node-7z";
import { EventEmitter } from "node:events";
import type { Mock } from "vitest";
import configurationModule from "../../configuration.js";
import { WebUIService } from "./web-ui.service.js";

vi.mock("../../configuration.js", () => ({
  __esModule: true,
  default: {
    SERVER: { VERSION: "16.3.0" },
    WEB_UI: { VERSION: undefined },
    VOLUMES: { CONFIG: "/tmp/gamevault-config" },
  },
}));

vi.mock("node-7z", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  const overrides = { extractFull: vi.fn() };
  return {
    ...actual,
    ...overrides,
    default: { ...(actual as any).default, ...overrides },
  };
});

vi.mock("fs-extra", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  const overrides = {
    ensureDir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    remove: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    pathExists: vi.fn().mockResolvedValue(false),
    readFile: vi.fn().mockResolvedValue(""),
    createWriteStream: vi.fn(() => ({
      on: vi.fn(),
    })),
  };
  return {
    ...actual,
    ...overrides,
    default: { ...(actual as any).default, ...overrides },
  };
});

describe("WebUIService", () => {
  let service: WebUIService;

  beforeEach(() => {
    service = new WebUIService(configurationModule);
    vi.restoreAllMocks();

    const config = configurationModule as any;
    config.SERVER.VERSION = "16.3.0";
    config.WEB_UI.VERSION = undefined;
  });

  describe("prepareFrontend", () => {
    it("should use forced version and skip download when cached", async () => {
      (service as any).compatibleVersion = "";
      vi.spyOn(service as any, "isCached").mockResolvedValue(true);

      const config = configurationModule as any;
      config.WEB_UI.VERSION = "v16.2.0";

      const fetchSpy = vi.spyOn(global, "fetch" as any);
      const ensureSpy = vi.spyOn(service as any, "ensureFrontendCached");

      await service.prepareFrontend();

      expect((service as any).compatibleVersion).toBe("v16.2.0");
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(ensureSpy).not.toHaveBeenCalled();
    });

    it("should fetch releases and cache selected compatible version when not cached", async () => {
      const config = configurationModule as any;
      config.WEB_UI.VERSION = undefined;
      config.SERVER.VERSION = "16.3.0";

      vi.spyOn(service as any, "isCached").mockResolvedValue(false);
      const ensureSpy = vi
        .spyOn(service as any, "ensureFrontendCached")
        .mockResolvedValue(undefined);

      vi.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => [
          { tag_name: "16.3.0" },
          { tag_name: "17.0.0" },
          { tag_name: "unstable" },
        ],
      } as Response);

      await service.prepareFrontend();

      expect((service as any).compatibleVersion).toBe("16.3.0");
      expect(ensureSpy).toHaveBeenCalledWith("16.3.0");
    });

    it("should keep the cached build when no release for the server major exists", async () => {
      const config = configurationModule as any;
      config.WEB_UI.VERSION = undefined;
      config.SERVER.VERSION = "16.3.0";

      vi.spyOn(service as any, "isCached").mockResolvedValue(true);
      const ensureSpy = vi
        .spyOn(service as any, "ensureFrontendCached")
        .mockResolvedValue(undefined);

      vi.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => [{ tag_name: "17.0.0" }, { tag_name: "unstable" }],
      } as Response);

      const cachedSpy = vi
        .spyOn(service as any, "getCachedVersion")
        .mockResolvedValue("16.2.1");

      await service.prepareFrontend();

      expect(cachedSpy).toHaveBeenCalled();
      expect((service as any).compatibleVersion).toBe("16.2.1");
      expect(ensureSpy).not.toHaveBeenCalled();
    });

    it("should never fall back to unstable when only pre-releases exist", async () => {
      const config = configurationModule as any;
      config.WEB_UI.VERSION = undefined;
      config.SERVER.VERSION = "16.3.0";

      vi.spyOn(service as any, "isCached").mockResolvedValue(false);
      const ensureSpy = vi
        .spyOn(service as any, "ensureFrontendCached")
        .mockResolvedValue(undefined);

      vi.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => [{ tag_name: "unstable", prerelease: true }],
      } as Response);
      vi.spyOn(service as any, "getCachedVersion").mockResolvedValue(null);

      await service.prepareFrontend();

      expect((service as any).compatibleVersion).toBe("");
      expect(ensureSpy).not.toHaveBeenCalled();
    });

    it("should keep the cached build when the GitHub API fails", async () => {
      const config = configurationModule as any;
      config.WEB_UI.VERSION = undefined;

      vi.spyOn(service as any, "isCached").mockResolvedValue(true);
      const ensureSpy = vi
        .spyOn(service as any, "ensureFrontendCached")
        .mockResolvedValue(undefined);

      vi.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);
      vi.spyOn(service as any, "getCachedVersion").mockResolvedValue("16.2.1");

      await service.prepareFrontend();

      expect((service as any).compatibleVersion).toBe("16.2.1");
      expect(ensureSpy).not.toHaveBeenCalled();
    });

    it("should serve the unstable tag when pinned via WEB_UI_VERSION", async () => {
      const config = configurationModule as any;
      config.WEB_UI.VERSION = " Unstable ";

      const fetchSpy = vi.spyOn(global, "fetch" as any);
      vi.spyOn(service as any, "isCached").mockResolvedValue(false);
      const ensureSpy = vi
        .spyOn(service as any, "ensureFrontendCached")
        .mockResolvedValue(undefined);

      await service.prepareFrontend();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect((service as any).compatibleVersion).toBe("unstable");
      expect(ensureSpy).toHaveBeenCalledWith("unstable");
    });

    it("should serve the early-access tag when pinned via WEB_UI_VERSION", async () => {
      const config = configurationModule as any;
      config.WEB_UI.VERSION = " early-access ";

      const fetchSpy = vi.spyOn(global, "fetch" as any);
      vi.spyOn(service as any, "isCached").mockResolvedValue(false);
      const ensureSpy = vi
        .spyOn(service as any, "ensureFrontendCached")
        .mockResolvedValue(undefined);

      await service.prepareFrontend();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect((service as any).compatibleVersion).toBe("early-access");
      expect(ensureSpy).toHaveBeenCalledWith("early-access");
    });
  });

  describe("cleanCacheExceptZip", () => {
    it("should remove all files except frontend zip", async () => {
      const fs = fsExtraModule as any;
      fs.readdir.mockResolvedValue([
        "gamevault-frontend.zip",
        "dist",
        ".version",
      ]);

      await service.cleanCacheExceptZip();

      expect(fs.remove).toHaveBeenCalledTimes(2);
      expect(fs.remove.mock.calls[0][0]).toContain("dist");
      expect(fs.remove.mock.calls[1][0]).toContain(".version");
    });
  });

  describe("private helpers", () => {
    it("should detect valid cache for matching version", async () => {
      const fs = fsExtraModule as any;
      fs.pathExists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
      fs.readFile.mockResolvedValue("16.3.0\n");

      const result = await (service as any).isCached("16.3.0");
      expect(result).toBe(true);
    });

    it("should return false cache when files are missing", async () => {
      const fs = fsExtraModule as any;
      fs.pathExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      const result = await (service as any).isCached("16.3.0");
      expect(result).toBe(false);
    });

    it("should only return stable semver releases, newest first", async () => {
      vi.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => [
          { tag_name: "unstable", prerelease: true },
          { tag_name: "16.2.0" },
          { tag_name: "16.3.0" },
          { tag_name: "16.4.0-rc.1", prerelease: true },
          { tag_name: "16.5.0", draft: true },
          { tag_name: "early-access", prerelease: true },
        ],
      } as Response);

      const releases = await (service as any).fetchReleases();
      expect(releases.map((r: any) => r.tag_name)).toEqual([
        "16.3.0",
        "16.2.0",
      ]);
    });

    it("should return null when the release list cannot be read", async () => {
      vi.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "rate limited",
      } as Response);

      await expect((service as any).fetchReleases()).resolves.toBeNull();
    });

    it("should return null compatible release for invalid server semver", () => {
      const release = (service as any).selectCompatibleRelease("invalid", [
        { tag_name: "16.3.0" },
        { tag_name: "unstable" },
      ]);
      expect(release).toBeNull();
    });

    it("should pick latest patch when server and release minors match", () => {
      const release = (service as any).selectCompatibleRelease("16.3.2", [
        { tag_name: "16.3.9" },
        { tag_name: "16.3.1" },
        { tag_name: "16.2.9" },
        { tag_name: "unstable" },
      ]);

      expect(release).toEqual({ tag_name: "16.3.9" });
    });

    it("should pick the newest release of the server's major version", () => {
      const release = (service as any).selectCompatibleRelease("16.0.0", [
        { tag_name: "17.0.0" },
        { tag_name: "16.3.0" },
        { tag_name: "16.2.9" },
      ]);

      expect(release).toEqual({ tag_name: "16.3.0" });
    });

    it("should ignore releases of other major versions", () => {
      const release = (service as any).selectCompatibleRelease("17.1.1", [
        { tag_name: "18.0.0" },
        { tag_name: "16.3.0" },
      ]);

      expect(release).toBeNull();
    });

    it("should skip frontend download when cached and not force redownload", async () => {
      vi.spyOn(service as any, "isCached").mockResolvedValue(true);
      const downloadSpy = vi.spyOn(service as any, "downloadFile");

      await (service as any).ensureFrontendCached("16.3.0");

      expect(downloadSpy).not.toHaveBeenCalled();
    });

    it("should execute full cache refresh flow when not cached", async () => {
      const fs = fsExtraModule as any;
      vi.spyOn(service as any, "isCached").mockResolvedValue(false);
      const downloadSpy = vi
        .spyOn(service as any, "downloadFile")
        .mockResolvedValue(undefined);
      const cleanSpy = vi
        .spyOn(service as any, "cleanCacheExceptZip")
        .mockResolvedValue(undefined);
      const extractSpy = vi
        .spyOn(service as any, "extractZip")
        .mockResolvedValue(undefined);
      const writeVersionSpy = vi
        .spyOn(service as any, "writeVersionFile")
        .mockResolvedValue(undefined);

      await (service as any).ensureFrontendCached("16.3.0");

      expect(downloadSpy).toHaveBeenCalled();
      expect(cleanSpy).toHaveBeenCalled();
      expect(extractSpy).toHaveBeenCalled();
      expect(fs.remove).toHaveBeenCalled();
      expect(writeVersionSpy).toHaveBeenCalledWith("16.3.0");
    });

    it("should resolve zip extraction when 7z emits end", async () => {
      (extractFull as Mock).mockImplementation(() => {
        const emitter = new EventEmitter();
        setImmediate(() => emitter.emit("end"));
        return emitter;
      });

      await expect(
        (service as any).extractZip("/tmp/test.zip"),
      ).resolves.toBeUndefined();
    });

    it("should reject zip extraction when 7z emits error", async () => {
      (extractFull as Mock).mockImplementation(() => {
        const emitter = new EventEmitter();
        setImmediate(() => emitter.emit("error", new Error("extract failed")));
        return emitter;
      });

      await expect(
        (service as any).extractZip("/tmp/test.zip"),
      ).rejects.toThrow("extract failed");
    });

    it("should throw when download response is not ok", async () => {
      vi.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      } as Response);

      await expect(
        (service as any).downloadFile(
          "https://example.com/a.zip",
          "/tmp/a.zip",
        ),
      ).rejects.toThrow("Failed to download file: Not Found");
    });

    it("should throw when download response body is empty", async () => {
      vi.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: true,
        body: null,
      } as Response);

      await expect(
        (service as any).downloadFile(
          "https://example.com/a.zip",
          "/tmp/a.zip",
        ),
      ).rejects.toThrow("Response body is empty");
    });
  });
});
