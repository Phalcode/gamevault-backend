import { extractFull } from "node-7z";
import { EventEmitter } from "node:events";
import { WebUIService } from "./web-ui.service";

jest.mock("../../configuration", () => ({
  __esModule: true,
  default: {
    SERVER: { VERSION: "16.3.0" },
    WEB_UI: { VERSION: undefined },
    VOLUMES: { CONFIG: "/tmp/gamevault-config" },
  },
}));

jest.mock("node-7z", () => ({
  extractFull: jest.fn(),
}));

jest.mock("fs-extra", () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue([]),
  remove: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(false),
  readFile: jest.fn().mockResolvedValue(""),
  createWriteStream: jest.fn(() => ({
    on: jest.fn(),
  })),
}));

describe("WebUIService", () => {
  let service: WebUIService;

  beforeEach(() => {
    service = new WebUIService(jest.requireMock("../../configuration").default);
    jest.restoreAllMocks();
  });

  describe("prepareFrontend", () => {
    it("should use forced version and skip download when cached", async () => {
      (service as any).compatibleVersion = "";
      jest.spyOn(service as any, "isCached").mockResolvedValue(true);

      const config = jest.requireMock("../../configuration").default;
      config.WEB_UI.VERSION = "v16.2.0";

      const fetchSpy = jest.spyOn(global, "fetch" as any);
      const ensureSpy = jest.spyOn(service as any, "ensureFrontendCached");

      await service.prepareFrontend();

      expect((service as any).compatibleVersion).toBe("v16.2.0");
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(ensureSpy).not.toHaveBeenCalled();
    });

    it("should fetch releases and cache selected compatible version when not cached", async () => {
      const config = jest.requireMock("../../configuration").default;
      config.WEB_UI.VERSION = undefined;
      config.SERVER.VERSION = "16.3.0";

      jest.spyOn(service as any, "isCached").mockResolvedValue(false);
      const ensureSpy = jest
        .spyOn(service as any, "ensureFrontendCached")
        .mockResolvedValue(undefined);

      jest.spyOn(global, "fetch" as any).mockResolvedValue({
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

    it("should fallback to nearest newer stable when no compatible stable release is found", async () => {
      const config = jest.requireMock("../../configuration").default;
      config.WEB_UI.VERSION = undefined;
      config.SERVER.VERSION = "16.3.0";

      jest.spyOn(service as any, "isCached").mockResolvedValue(false);
      const ensureSpy = jest
        .spyOn(service as any, "ensureFrontendCached")
        .mockResolvedValue(undefined);

      jest.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => [{ tag_name: "17.0.0" }, { tag_name: "unstable" }],
      } as Response);

      await service.prepareFrontend();

      expect((service as any).compatibleVersion).toBe("17.0.0");
      expect(ensureSpy).toHaveBeenCalledWith("17.0.0");
    });

    it("should fallback to unstable when no stable releases are available", async () => {
      const config = jest.requireMock("../../configuration").default;
      config.WEB_UI.VERSION = undefined;
      config.SERVER.VERSION = "16.3.0";

      jest.spyOn(service as any, "isCached").mockResolvedValue(false);
      const ensureSpy = jest
        .spyOn(service as any, "ensureFrontendCached")
        .mockResolvedValue(undefined);

      jest.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => [{ tag_name: "unstable" }],
      } as Response);

      await service.prepareFrontend();

      expect((service as any).compatibleVersion).toBe("unstable");
      expect(ensureSpy).toHaveBeenCalledWith("unstable");
    });

    it("should fallback to unstable default list when GitHub API fails", async () => {
      const config = jest.requireMock("../../configuration").default;
      config.WEB_UI.VERSION = undefined;

      jest.spyOn(service as any, "isCached").mockResolvedValue(false);
      const ensureSpy = jest
        .spyOn(service as any, "ensureFrontendCached")
        .mockResolvedValue(undefined);

      jest.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await service.prepareFrontend();

      expect((service as any).compatibleVersion).toBe("unstable");
      expect(ensureSpy).toHaveBeenCalledWith("unstable");
    });
  });

  describe("cleanCacheExceptZip", () => {
    it("should remove all files except frontend zip", async () => {
      const fs = jest.requireMock("fs-extra");
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
      const fs = jest.requireMock("fs-extra");
      fs.pathExists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
      fs.readFile.mockResolvedValue("16.3.0\n");

      const result = await (service as any).isCached("16.3.0");
      expect(result).toBe(true);
    });

    it("should return false cache when files are missing", async () => {
      const fs = jest.requireMock("fs-extra");
      fs.pathExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      const result = await (service as any).isCached("16.3.0");
      expect(result).toBe(false);
    });

    it("should sort semver releases before non-semver releases", async () => {
      jest.spyOn(global, "fetch" as any).mockResolvedValue({
        ok: true,
        json: async () => [
          { tag_name: "unstable" },
          { tag_name: "16.2.0" },
          { tag_name: "16.3.0" },
        ],
      } as Response);

      const releases = await (service as any).fetchReleases();
      expect(releases.map((r: any) => r.tag_name)).toEqual([
        "16.3.0",
        "16.2.0",
        "unstable",
      ]);
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

    it("should throw when fallback unstable release is missing", () => {
      expect(() =>
        (service as any).getCompatibleOrFallbackRelease("16.3.0", [
          { tag_name: "15.9.0" },
        ]),
      ).toThrow("No unstable release found");
    });

    it("should skip frontend download when cached and not force redownload", async () => {
      jest.spyOn(service as any, "isCached").mockResolvedValue(true);
      const downloadSpy = jest.spyOn(service as any, "downloadFile");

      await (service as any).ensureFrontendCached("16.3.0");

      expect(downloadSpy).not.toHaveBeenCalled();
    });

    it("should execute full cache refresh flow when not cached", async () => {
      const fs = jest.requireMock("fs-extra");
      jest.spyOn(service as any, "isCached").mockResolvedValue(false);
      const downloadSpy = jest
        .spyOn(service as any, "downloadFile")
        .mockResolvedValue(undefined);
      const cleanSpy = jest
        .spyOn(service as any, "cleanCacheExceptZip")
        .mockResolvedValue(undefined);
      const extractSpy = jest
        .spyOn(service as any, "extractZip")
        .mockResolvedValue(undefined);
      const writeVersionSpy = jest
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
      (extractFull as jest.Mock).mockImplementation(() => {
        const emitter = new EventEmitter();
        setImmediate(() => emitter.emit("end"));
        return emitter;
      });

      await expect(
        (service as any).extractZip("/tmp/test.zip"),
      ).resolves.toBeUndefined();
    });

    it("should reject zip extraction when 7z emits error", async () => {
      (extractFull as jest.Mock).mockImplementation(() => {
        const emitter = new EventEmitter();
        setImmediate(() => emitter.emit("error", new Error("extract failed")));
        return emitter;
      });

      await expect(
        (service as any).extractZip("/tmp/test.zip"),
      ).rejects.toThrow("extract failed");
    });

    it("should throw when download response is not ok", async () => {
      jest.spyOn(global, "fetch" as any).mockResolvedValue({
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
      jest.spyOn(global, "fetch" as any).mockResolvedValue({
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
