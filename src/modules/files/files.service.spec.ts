/*
https://docs.nestjs.com/fundamentals/testing#unit-testing
*/

import { Test } from "@nestjs/testing";
import { FilesService } from "./files.service";
import { GamesService } from "../games/games.service";
import { RawgService } from "../providers/rawg/rawg.service";
import { BoxArtsService } from "../boxarts/boxarts.service";

describe("FilesService", () => {
  let filesService: FilesService;

  const mockGamesService = {};
  const mockRawgService = {};
  const mockBoxartService = {};

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [FilesService, GamesService, RawgService, BoxArtsService],
    })
      .overrideProvider(GamesService)
      .useValue(mockGamesService)
      .overrideProvider(RawgService)
      .useValue(mockRawgService)
      .overrideProvider(BoxArtsService)
      .useValue(mockBoxartService)
      .compile();

    filesService = moduleRef.get<FilesService>(FilesService);
  });

  it("should be defined", () => {
    expect(filesService).toBeDefined();
  });

  describe("isValidFilename", () => {
    let loggerDebugSpy, loggerWarnSpy;

    beforeEach(() => {
      // Create spies for logger.debug and logger.warn methods
      loggerDebugSpy = jest
        .spyOn(filesService["logger"], "debug")
        .mockImplementation(() => {});
      loggerWarnSpy = jest
        .spyOn(filesService["logger"], "warn")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      // Restore the original logger.debug and logger.warn methods
      loggerDebugSpy.mockRestore();
      loggerWarnSpy.mockRestore();
    });

    it("should return false for unsupported file extensions", () => {
      const unsupportedFilenames = [
        "Assassin's Creed Odyssey (v1.5.3) (2018).pig",
        "Red Dead Redemption 2 (v1.2) (2020).rat",
        "Cyberpunk 2077 (v1.3.1) (2021).giraffe",
      ];

      unsupportedFilenames.forEach((filename) => {
        expect(filesService["isValidFilename"](filename)).toBe(false);
        expect(loggerDebugSpy).toHaveBeenCalledWith(
          `Indexer ignoring invalid filename: unsupported file extension - ${filename}`,
        );
      });
    });

    it("should return false for filenames with invalid characters", () => {
      const invalidFilenames = [
        "DOOM: Eternal (v2.1) (2020).zip",
        "The Legend of Zelda: Breath of the Wild (v1.2) (2017).7z",
        "Dishonored <2> (v1.11) (2016).tar",
      ];

      invalidFilenames.forEach((filename) => {
        expect(filesService["isValidFilename"](filename)).toBe(false);
        expect(loggerWarnSpy).toHaveBeenCalledWith(
          `Indexer ignoring invalid filename: contains invalid characters - ${filename}`,
        );
      });
    });

    it("should return true for valid filenames", () => {
      const validFilenames = [
        "Star Wars Jedi - Fallen Order (v1.0.10.0) (2019).zip",
        "HITMAN 3 (v3.10.1) (2021).7z",
        "!mygames/!The Wandering Village (v0.1.32) (EA) (2022).iso",
        "Saints Row (W_S) (2022).zip",
        "My personal IndieGame (v1.2.9) (NC) (2018).zip",
        "Stray (2022).7z",
        "Captain of Industry (v0.4.12b) (EA) (2022).gz",
        "Minecraft (2011).exe",
      ];

      validFilenames.forEach((filename) => {
        expect(filesService["isValidFilename"](filename)).toBe(true);
      });

      // Ensure logger.debug and logger.warn were not called for valid filenames
      expect(loggerDebugSpy).not.toHaveBeenCalled();
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });
  });
});
