import {
  selectDefaultGameVersion,
  sortGameVersions,
} from "./version-selection.util.js";

import { GameVersion } from "./game-version.entity.js";
import { GameType } from "./models/game-type.enum.js";

describe("version-selection.util", () => {
  const createVersion = (overrides: Partial<GameVersion>): GameVersion =>
    ({
      id: 1,
      game: { id: 1 } as any,
      file_path: "/files/default.zip",
      size: 1000n,
      early_access: false,
      type: GameType.UNDETECTABLE,
      indexed_at: new Date("2026-01-01T00:00:00.000Z"),
      ...overrides,
    }) as GameVersion;

  describe("sortGameVersions", () => {
    it("sorts strict semver versions descending", () => {
      const versions = [
        createVersion({ file_path: "/files/v1.zip", version: "v1.0.0" }),
        createVersion({ file_path: "/files/v2.zip", version: "v2.0.0" }),
        createVersion({ file_path: "/files/v1-5.zip", version: "v1.5.0" }),
      ];

      const result = sortGameVersions(versions);

      expect(result.map((v) => v.version)).toEqual([
        "v2.0.0",
        "v1.5.0",
        "v1.0.0",
      ]);
    });

    it("deduplicates by file_path and keeps the last occurrence", () => {
      const versions = [
        createVersion({ file_path: "/files/same.zip", version: "v1.0.0" }),
        createVersion({ file_path: "/files/other.zip", version: "v1.1.0" }),
        createVersion({ file_path: "/files/same.zip", version: "v2.0.0" }),
      ];

      const result = sortGameVersions(versions);

      expect(result).toHaveLength(2);
      expect(
        result.find((v) => v.file_path === "/files/same.zip")?.version,
      ).toBe("v2.0.0");
    });

    it("uses indexed_at as tie-breaker when versions are equally comparable", () => {
      const older = createVersion({
        file_path: "/files/older.zip",
        version: "build-alpha",
        indexed_at: new Date("2026-01-01T00:00:00.000Z"),
      });
      const newer = createVersion({
        file_path: "/files/newer.zip",
        version: "build-alpha",
        indexed_at: new Date("2026-02-01T00:00:00.000Z"),
      });

      const result = sortGameVersions([older, newer]);

      expect(result[0].file_path).toBe("/files/newer.zip");
    });

    it("prefers date-like versions over non-date textual versions", () => {
      const dateLike = createVersion({
        file_path: "/files/date.zip",
        version: "v2025-04-27",
      });
      const textOnly = createVersion({
        file_path: "/files/text.zip",
        version: "nightly-build",
      });

      const result = sortGameVersions([textOnly, dateLike]);

      expect(result[0].file_path).toBe("/files/date.zip");
    });
  });

  describe("selectDefaultGameVersion", () => {
    it("returns highest ranked version when comparable versions exist", () => {
      const versions = [
        createVersion({ file_path: "/files/v1.zip", version: "v1.0.0" }),
        createVersion({ file_path: "/files/v2.zip", version: "v2.0.0" }),
      ];

      const selected = selectDefaultGameVersion(versions, "/files/v1.zip");

      expect(selected.file_path).toBe("/files/v2.zip");
    });

    it("prefers preferredFilePath when no versions are comparable", () => {
      const versions = [
        createVersion({
          file_path: "/files/preferred.zip",
          version: "alpha-build",
          indexed_at: new Date("2026-01-01T00:00:00.000Z"),
        }),
        createVersion({
          file_path: "/files/newer.zip",
          version: "beta-build",
          indexed_at: new Date("2026-02-01T00:00:00.000Z"),
        }),
      ];

      const selected = selectDefaultGameVersion(
        versions,
        "/files/preferred.zip",
      );

      expect(selected.file_path).toBe("/files/preferred.zip");
    });

    it("falls back to sorted first when preferred path is missing", () => {
      const versions = [
        createVersion({
          file_path: "/files/a.zip",
          version: "text-a",
          indexed_at: new Date("2026-01-01T00:00:00.000Z"),
        }),
        createVersion({
          file_path: "/files/b.zip",
          version: "text-b",
          indexed_at: new Date("2026-02-01T00:00:00.000Z"),
        }),
      ];

      const selected = selectDefaultGameVersion(versions, "/files/missing.zip");

      expect(selected.file_path).toBe("/files/b.zip");
    });
  });
});
