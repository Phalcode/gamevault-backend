import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  StreamableFile,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { type Response } from "express";
import type { Stats } from "fs-extra";
import fsExtra from "fs-extra";
import lodash from "lodash";
import node7z from "node-7z";
import { randomBytes } from "node:crypto";
import path, { basename } from "node:path";
import { type Readable } from "node:stream";
import { from, lastValueFrom } from "rxjs";
import { mergeMap } from "rxjs/operators";
import filenameSanitizer from "sanitize-filename";
import { Throttle } from "stream-throttle";
import { IsNull, Not, Repository } from "typeorm";
import unidecode from "unidecode";
const { access, constants, createReadStream, pathExists, rm, stat, writeFile } =
  fsExtra;
const { debounce, toLower } = lodash;
const { add, list } = node7z;

import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import configuration from "../../configuration.js";
import globals, { toFindOptionsRelations } from "../../globals.js";
import { logGamevaultGame } from "../../logging.js";
import { MetadataService } from "../metadata/metadata.service.js";
import { GameVersion } from "./game-version.entity.js";
import { GamesService } from "./games.service.js";
import { GamevaultGame } from "./gamevault-game.entity.js";
import { type File } from "./models/file.model.js";
import { GameExistence } from "./models/game-existence.enum.js";
import { GameType } from "./models/game-type.enum.js";
import { type RangeHeader } from "./models/range-header.model.js";
import {
  selectDefaultGameVersion,
  sortGameVersions,
} from "./version-selection.util.js";

@Injectable()
export class FilesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);
  private readonly supportedFormatsSet = new Set(
    configuration.GAMES.SUPPORTED_FILE_FORMATS.map((f) => toLower(f)),
  );

  private readonly runDebouncedIntegrityCheck = debounce(async () => {
    await this.checkIntegrity();
  }, 5000);

  constructor(
    private readonly gamesService: GamesService,
    private readonly metadataService: MetadataService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectRepository(GameVersion)
    private readonly gameVersionRepository: Repository<GameVersion>,
  ) {}

  /** Initializes the file watcher and starts the initial indexing. */
  async onApplicationBootstrap() {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Skipping File Watcher.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      this.indexAllFiles();
      return;
    }

    const { watch } = await import("chokidar");

    watch(configuration.VOLUMES.FILES, {
      depth: configuration.GAMES.SEARCH_RECURSIVE ? undefined : 0,
      ignorePermissionErrors: true,
      ignoreInitial: true,
      followSymlinks: true,
      alwaysStat: true,
      awaitWriteFinish: true,
      usePolling: configuration.GAMES.INDEX_USE_POLLING,
    })
      .on("add", (path, stats) => this.index(path, stats))
      .on("change", (path, stats) => this.index(path, stats))
      .on("unlink", (path, stats) => this.index(path, stats))
      .on("error", (error) =>
        this.logger.error({ message: "Error in Filewatcher.", error }),
      );
    this.indexAllFiles();
  }

  @Cron(
    `*/${(configuration.GAMES.INDEX_INTERVAL_IN_MINUTES ?? 60) > 0 ? (configuration.GAMES.INDEX_INTERVAL_IN_MINUTES ?? 60) : 1} * * * *`,
    {
      disabled:
        (configuration.GAMES.INDEX_INTERVAL_IN_MINUTES ?? 60) <= 0 ||
        configuration.TESTING.MOCK_FILES,
    },
  )
  /** Scans the filesystem for all games and indexes them. */
  public async indexAllFiles() {
    const files = await this.readAllFiles();
    this.logger.log({
      message: "Starting full file index.",
      count: files.length,
    });

    if (files.length > 0) {
      await lastValueFrom(
        from(files).pipe(
          mergeMap(
            (file) =>
              this.index(file.path, { size: Number(file.size) } as Stats, true),
            configuration.GAMES.INDEX_CONCURRENCY,
          ),
        ),
      );
    }

    this.logger.log({
      message: "Finished full file index.",
      count: files.length,
    });

    this.runDebouncedIntegrityCheck.cancel();
    await this.checkIntegrity(files);
  }

  /**
   * Deletes a game file from disk.
   * The file indexer will automatically soft-delete the game from the database
   * once it detects the file is missing.
   */
  public async deleteGameFile(
    gameId: number,
    requestedVersionId: number,
  ): Promise<void> {
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
    });

    const availableVersions = sortGameVersions(
      await this.listAvailableVersionsFromStorage(game),
    );

    if (availableVersions.length === 0) {
      throw new NotFoundException(
        `Game with id ${gameId} has no downloadable versions associated.`,
      );
    }

    const explicitVersion = availableVersions.find(
      (version) => version.id === requestedVersionId,
    );

    if (!explicitVersion) {
      throw new NotFoundException(
        `Version with id "${requestedVersionId}" not found for game id ${gameId}.`,
      );
    }

    const versionsToDelete = [explicitVersion];

    if (versionsToDelete.some((version) => !version.file_path)) {
      throw new NotFoundException(
        `Game with id ${gameId} has no valid version file path associated.`,
      );
    }

    const existingVersionPaths: string[] = [];
    for (const version of versionsToDelete) {
      if (await pathExists(version.file_path)) {
        existingVersionPaths.push(version.file_path);
      }
    }

    if (existingVersionPaths.length === 0) {
      throw new NotFoundException(
        `Game file not found on disk for requested version id "${requestedVersionId}".`,
      );
    }

    // Verify write permissions on the files volume
    try {
      await access(configuration.VOLUMES.FILES, constants.W_OK);
    } catch {
      throw new BadRequestException(
        `The server does not have write permissions on the files volume "${configuration.VOLUMES.FILES}". Game deletion requires write access.`,
      );
    }

    for (const filePath of existingVersionPaths) {
      await rm(filePath);
    }

    this.logger.log({
      message: "Game file deleted from disk.",
      gameId,
      version_id: requestedVersionId,
      count: existingVersionPaths.length,
      paths: existingVersionPaths,
    });
  }

  /**
   * Uploads a game file to the files volume.
   * Only supported file formats are accepted. The filename must be valid.
   * Write permissions on the files volume are required.
   */
  public async upload(file: Express.Multer.File): Promise<{ path: string }> {
    const filename = filenameSanitizer(file.originalname);

    if (!filename) {
      throw new BadRequestException(
        "The uploaded file has an invalid filename.",
      );
    }

    const ext = toLower(path.extname(filename));
    if (!this.supportedFormatsSet.has(ext)) {
      throw new BadRequestException(
        `Unsupported file format "${ext}". Supported formats: ${Array.from(this.supportedFormatsSet).join(", ")}`,
      );
    }

    // Verify write permissions on the files volume
    try {
      await access(configuration.VOLUMES.FILES, constants.W_OK);
    } catch {
      throw new BadRequestException(
        `The server does not have write permissions on the files volume "${configuration.VOLUMES.FILES}". Game upload requires write access.`,
      );
    }

    const targetPath = path.join(configuration.VOLUMES.FILES, filename);

    // Prevent overwriting existing files
    if (await pathExists(targetPath)) {
      throw new BadRequestException(
        `A file named "${filename}" already exists in the game library.`,
      );
    }

    await writeFile(targetPath, file.buffer);

    this.logger.log({
      message: "Game file uploaded successfully.",
      filename,
      size: file.size,
      path: targetPath,
    });

    // Trigger indexing of the newly uploaded file
    const stats = await stat(targetPath);
    await this.index(targetPath, stats);

    return { path: targetPath };
  }

  /** Indexes a single file and updates the database accordingly. */
  private async index(path: string, stats?: Stats, skipIntegrityCheck = false) {
    if (!path || !this.isValidFilePath(path)) {
      return;
    }

    const size = BigInt(stats?.size || 0);
    if (!size) {
      if (!skipIntegrityCheck) {
        this.runDebouncedIntegrityCheck();
      }
      return;
    }

    // Log the initial ingestion message
    this.logger.log({
      message: "Ingesting game.",
      path,
      size,
    });

    const gameToIndex = new GamevaultGame();
    const filename = basename(path);
    gameToIndex.size = size;
    gameToIndex.file_path = path;
    gameToIndex.title = this.extractTitle(filename);
    gameToIndex.sort_title = this.gamesService.generateSortTitle(
      gameToIndex.title,
    );
    gameToIndex.release_date = this.extractReleaseYear(filename);
    gameToIndex.version = this.extractVersion(filename);
    gameToIndex.early_access = this.extractEarlyAccessFlag(filename);

    try {
      // Check if the game already exists in the database
      const existingGameTuple: [GameExistence, GamevaultGame | undefined] =
        await this.gamesService.checkIfExistsInDatabase(gameToIndex);
      const existingGame = existingGameTuple[1];

      // Prepare log messages based on game existence status
      const logMessageMap = {
        [GameExistence.EXISTS]: `Identical file is already indexed in the database. Skipping it.`,
        [GameExistence.DOES_NOT_EXIST]: `Indexing new file.`,
        [GameExistence.EXISTS_BUT_DELETED_IN_DATABASE]: `A soft-deleted duplicate of the file has been found in the database. Restoring it and updating the information.`,
        [GameExistence.EXISTS_BUT_ALTERED]: `An altered duplicate of the file has been found in the database. Updating the information.`,
      };

      // Log the corresponding message based on game existence
      this.logger.debug({
        message: logMessageMap[existingGameTuple[0]],
        game: logGamevaultGame(gameToIndex),
        ...(existingGame && { existingGame: logGamevaultGame(existingGame) }),
      });

      // Handle different cases of game existence
      switch (existingGameTuple[0]) {
        case GameExistence.EXISTS: {
          // Keep legacy rows normalized while preserving current default file path.
          gameToIndex.type = await this.detectType(gameToIndex.file_path);
          this.metadataService.addUpdateMetadataJob(
            await this.upsertIndexedVersion(existingGame!.id, gameToIndex),
          );
          break;
        }

        case GameExistence.DOES_NOT_EXIST: {
          // If it doesn't exist, detect the type and save it
          gameToIndex.type = await this.detectType(gameToIndex.file_path);
          const savedGame = await this.gamesService.save(gameToIndex);
          this.metadataService.addUpdateMetadataJob(
            await this.upsertIndexedVersion(savedGame.id, gameToIndex),
          );
          break;
        }

        case GameExistence.EXISTS_BUT_DELETED_IN_DATABASE: {
          // Restore soft-deleted game and add/update the indexed version
          const restoredGame = await this.gamesService.restore(
            existingGame!.id,
          );
          gameToIndex.type = await this.detectType(gameToIndex.file_path);
          this.metadataService.addUpdateMetadataJob(
            await this.upsertIndexedVersion(restoredGame.id, gameToIndex),
          );
          break;
        }

        case GameExistence.EXISTS_BUT_ALTERED: {
          // Update or add a version for an altered duplicate
          gameToIndex.type = await this.detectType(gameToIndex.file_path);
          this.metadataService.addUpdateMetadataJob(
            await this.upsertIndexedVersion(existingGame!.id, gameToIndex),
          );
          break;
        }
      }
    } catch (error) {
      // Log an error message if something goes wrong
      this.logger.error({
        message: `Failed to index file "${gameToIndex.file_path}". Does this file really belong here and are you sure the format is correct?`,
        game: { id: gameToIndex.id, path },
        error,
      });
    }

    if (!skipIntegrityCheck) {
      this.runDebouncedIntegrityCheck();
    }
  }

  /** Upserts one indexed file as an available version of the game. */
  private async upsertIndexedVersion(
    id: number,
    indexedGame: GamevaultGame,
  ): Promise<GamevaultGame> {
    const gameToUpdate = await this.gamesService.findOneByGameIdOrFail(id, {
      loadDeletedEntities: false,
    });

    await this.upsertReleaseRecord(id, indexedGame);

    const availableVersions =
      await this.listAvailableVersionsFromStorage(gameToUpdate);

    const selectedVersion = selectDefaultGameVersion(availableVersions);

    const gamePatch = Object.assign(new GamevaultGame(), { id });
    this.applyVersionToGame(gamePatch, selectedVersion);
    gamePatch.download_count = gameToUpdate.download_count;

    // Only (re)derive title/sort title from the file name when the user has
    // specifically set them. A user metadata row may exist for unrelated edits
    // (e.g. description/cover only), so preserve only what was actually
    // overridden; a customized sort_title is detected by comparing it against
    // the auto-generated value for the current title.
    const userSetTitle = !!gameToUpdate.user_metadata?.title?.trim();
    const autoSortTitle = this.gamesService.generateSortTitle(
      gameToUpdate.title ?? "",
    );
    const hasCustomSortTitle =
      !!gameToUpdate.sort_title && gameToUpdate.sort_title !== autoSortTitle;

    if (!userSetTitle) {
      gamePatch.title = indexedGame.title;
    }
    if (!hasCustomSortTitle) {
      gamePatch.sort_title = this.gamesService.generateSortTitle(
        indexedGame.title ?? "",
      );
    }

    // Persist only scalar game fields to avoid relation graph side effects.
    await this.gamesService.save(gamePatch);
    const updatedGame = await this.gamesService.findOneByGameIdOrFail(id, {
      loadDeletedEntities: false,
    });
    this.logger.log({
      message: `Updated game versions based on file changes.`,
      game: logGamevaultGame(updatedGame),
    });
    return updatedGame;
  }

  /** Upserts one normalized release row for a game and indexed file. */
  private async upsertReleaseRecord(
    gameId: number,
    indexedGame: GamevaultGame,
  ): Promise<void> {
    const now = new Date();

    const existingVersion = await this.gameVersionRepository.findOne({
      where: {
        game: { id: gameId },
        file_path: indexedGame.file_path,
      },
      withDeleted: true,
    });

    const versionPatch = Object.assign(new GameVersion(), {
      id: existingVersion?.id,
      game: { id: gameId } as GamevaultGame,
      file_path: indexedGame.file_path,
      version: indexedGame.version,
      size: indexedGame.size,
      release_date: indexedGame.release_date,
      early_access: indexedGame.early_access,
      type: indexedGame.type,
      indexed_at: now,
      deleted_at: null,
    });

    await this.gameVersionRepository.save(versionPatch);
  }

  /** Returns all versions from normalized storage, falling back to legacy columns. */
  private async listAvailableVersionsFromStorage(
    game: GamevaultGame,
  ): Promise<GameVersion[]> {
    const versions = await this.gameVersionRepository.find({
      where: {
        game: { id: game.id },
      },
      relationLoadStrategy: "query",
      relations: toFindOptionsRelations<GameVersion>(["game"]),
      withDeleted: false,
    });

    if (versions.length > 0) {
      return versions.map((version) =>
        Object.assign(new GameVersion(), {
          id: version.id,
          game: version.game,
          file_path: version.file_path,
          version: version.version,
          size: version.size,
          release_date: version.release_date,
          early_access: !!version.early_access,
          type: version.type || GameType.UNDETECTABLE,
          indexed_at: version.indexed_at || version.updated_at || new Date(),
        }),
      );
    }

    return this.normalizeVersions(game);
  }

  /** Converts legacy single-file games into a normalized versions structure. */
  private normalizeVersions(game: GamevaultGame): GameVersion[] {
    if (!game.file_path) {
      return [];
    }
    return [
      Object.assign(new GameVersion(), {
        id: undefined,
        game: { id: game.id } as GamevaultGame,
        file_path: game.file_path,
        version: game.version,
        size: game.size || 0n,
        release_date: game.release_date,
        early_access: !!game.early_access,
        type: game.type || GameType.UNDETECTABLE,
        indexed_at: game.updated_at || game.created_at || new Date(),
      }),
    ];
  }

  /** Applies one version to legacy top-level game fields. */
  private applyVersionToGame(game: GamevaultGame, version: GameVersion): void {
    game.file_path = version.file_path;
    game.version = version.version;
    game.size = BigInt(version.size || 0);
    game.release_date = version.release_date
      ? new Date(version.release_date)
      : undefined;
    game.early_access = !!version.early_access;
    game.type = version.type || GameType.UNDETECTABLE;
  }

  /** Checks if a given file path is valid and supported by the indexer. */
  private isValidFilePath(filename: string) {
    const invalidCharacters = /[/<>:"\\|?*]/;
    const actualFilename = basename(filename);

    if (!this.supportedFormatsSet.has(toLower(path.extname(actualFilename)))) {
      this.logger.debug({
        message: `Indexer ignoring invalid filename.`,
        reason: "Unsupported file extension.",
        filename,
      });
      return false;
    }

    if (invalidCharacters.test(actualFilename)) {
      this.logger.warn({
        message: `Indexer ignoring invalid filename.`,
        reason: "Contains invalid characters.",
        filename,
      });
      return false;
    }

    return true;
  }

  /**
   * Extracts the game title from a given file name string using a
   * regular expression.
   */
  private extractTitle(filePath: string): string {
    return path
      .basename(filePath, path.extname(filePath))
      .replace(/\([^)]*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Extracts the game version from a given file path string using a
   * regular expression.
   */
  private extractVersion(filePath: string): string | undefined {
    const match = /\((v[^)]+)\)/.exec(filePath);
    if (match?.[1]) {
      return match[1];
    }
    return undefined;
  }

  /**
   * Extracts the game release year from a given file path string
   * using a regular expression.
   */
  private extractReleaseYear(filePath: string): Date | undefined {
    try {
      const match = /\((\d{4})\)/.exec(filePath);
      if (!match?.[1]) {
        return undefined;
      }
      const parsedDate = new Date(match[1]);
      return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
    } catch {
      return undefined;
    }
  }

  /**
   * Extracts the early access flag from a given file path string
   * using a regular expression.
   */
  private extractEarlyAccessFlag(filePath: string): boolean {
    return /\(EA\)/.test(filePath);
  }

  /** Detects if any of the given file paths match common Windows installer patterns. */
  private detectWindowsSetupExecutable(filepaths: string[]): boolean {
    const windowsInstallerPatterns: { regex: RegExp; description: string }[] = [
      { regex: /^setup\.exe$/i, description: "setup.exe" },
      { regex: /^autorun\.exe$/i, description: "autorun.exe" },
      { regex: /^setup_.*\.exe$/i, description: "setup_*.exe" },
      { regex: /^setup-.*\.exe$/i, description: "setup-*.exe" },
      { regex: /^install\.exe$/i, description: "install.exe" },
      { regex: /^unarc\.exe$/i, description: "unarc.exe" },
      {
        regex: /^(?!.*\bredist\b).*\.msi$/,
        description: "*.msi (except redistributables)",
      },
    ];

    const detectedPatterns: string[] = [];

    for (const path of filepaths) {
      const fileName = toLower(basename(path));

      for (const pattern of windowsInstallerPatterns) {
        if (pattern.regex.test(fileName)) {
          this.logger.debug({
            message: `File matched Windows Installer Game Type pattern.`,
            game: { id: undefined, path: path },
            pattern,
          });
          detectedPatterns.push(pattern.description);
        }
      }
    }

    return detectedPatterns.length > 0;
  }

  /** Detects the game type based on the file path and its contents. */
  private async detectType(path: string): Promise<GameType> {
    try {
      if (/\(W_P\)/.test(path)) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_PORTABLE}.`,
          reason: "(W_P) override in filename.",
          game: { id: undefined, path: path },
        });
        return GameType.WINDOWS_PORTABLE;
      }

      if (/\(W_S\)/.test(path)) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
          reason: "(W_S) override in filename.",
          game: { id: undefined, path: path },
        });
        return GameType.WINDOWS_SETUP;
      }

      if (/\(L_P\)/.test(path)) {
        this.logger.debug({
          message: `Detected game type as ${GameType.LINUX_PORTABLE}.`,
          reason: "(L_P) override in filename.",
          game: { id: undefined, path },
        });
        return GameType.LINUX_PORTABLE;
      }

      if (/\(W_SW\)/.test(path)) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_SOFTWARE}.`,
          reason: "(W_SW) override in filename.",
          game: { id: undefined, path },
        });
        return GameType.WINDOWS_SOFTWARE;
      }

      if (/\(L_SW\)/.test(path)) {
        this.logger.debug({
          message: `Detected game type as ${GameType.LINUX_SOFTWARE}.`,
          reason: "(L_SW) override in filename.",
          game: { id: undefined, path },
        });
        return GameType.LINUX_SOFTWARE;
      }

      // Failsafe for Mock-Files because we cant look into them
      if (configuration.TESTING.MOCK_FILES) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
          reason: "TESTING_MOCK_FILES is set to true.",
          game: { id: undefined, path },
        });
        return GameType.WINDOWS_SETUP;
      }

      // Detect single File executables
      if (toLower(path).endsWith(".exe")) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
          reason: "Filename ends with .exe .",
          game: { id: undefined, path },
        });
        return GameType.WINDOWS_SETUP;
      }

      if (
        toLower(path).endsWith(".sh") ||
        toLower(path).endsWith(".appimage")
      ) {
        this.logger.debug({
          message: `Detected game type as ${GameType.LINUX_PORTABLE}.`,
          reason: `Filename ends with ${toLower(path).endsWith(".sh") ? ".sh" : ".appimage"} .`,
          game: { id: undefined, path },
        });
        return GameType.LINUX_PORTABLE;
      }

      // Detect Windows Executables in Archive
      const executablesInArchive = await this.findAllExecutablesInArchive(
        path,
        ["*.exe", "*.msi", "*.sh", "*.appimage"],
      );

      if (executablesInArchive.length > 0) {
        const windowsExecutables = executablesInArchive.filter((f) => {
          const lowerFile = toLower(f);
          return lowerFile.endsWith(".exe") || lowerFile.endsWith(".msi");
        });

        if (windowsExecutables.length > 0) {
          if (this.detectWindowsSetupExecutable(windowsExecutables)) {
            this.logger.debug({
              message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
              reason:
                "There are windows executables in the archive that look like installers.",
              game: { id: undefined, path },
            });
            return GameType.WINDOWS_SETUP;
          }
          this.logger.debug({
            message: `Detected game type as ${GameType.WINDOWS_PORTABLE}.`,
            reason: "There are windows executables in the archive.",
            game: { id: undefined, path },
          });
          return GameType.WINDOWS_PORTABLE;
        }

        const linuxExecutables = executablesInArchive.filter((f) => {
          const lowerFile = toLower(f);
          return lowerFile.endsWith(".sh") || lowerFile.endsWith(".appimage");
        });
        if (linuxExecutables.length > 0) {
          this.logger.debug({
            message: `Detected game type as ${GameType.LINUX_PORTABLE}.`,
            reason: "There are linux executables in the archive.",
            game: { id: undefined, path },
          });
          return GameType.LINUX_PORTABLE;
        }
      }

      // More Platforms and Game Types can be added here.
      this.logger.debug({
        message: `Could not detect game type.`,
        game: { id: undefined, path },
      });
      return GameType.UNDETECTABLE;
    } catch (error) {
      this.logger.warn({
        message: `Error detecting game type.`,
        game: { id: undefined, path },
        error,
      });
      return GameType.UNDETECTABLE;
    }
  }

  /** Finds all executable files within an archive matching the given patterns. */
  private async findAllExecutablesInArchive(
    path: string,
    matchers: string[],
  ): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const executablesList: string[] = [];
      const listStream = list(path, {
        recursive: true,
        $cherryPick: matchers,
        password: configuration.GAMES.DEFAULT_ARCHIVE_PASSWORD, // ANY Password is needed so it doesn't hang up
      });

      listStream.on("data", (data) => executablesList.push(data.file));

      listStream.on("error", (error) => {
        this.logger.error({
          message: `Error extracting executables list. The archive may be encrypted or corrupted.`,
          game: { id: undefined, file_path: path },
          error,
        });
        reject(error);
      });

      listStream.on("end", () => {
        if (executablesList.length) {
          this.logger.debug({
            message: `Found ${executablesList.length} executable(s) in archive.`,
            game: { id: undefined, path: path },
            executables: executablesList,
          });
        } else {
          this.logger.warn({
            message: `Could not detect any executables in archive. Please note that the Game Type Detection algorithm does not support nested archives.`,
            game: { id: undefined, path: path },
          });
        }
        resolve(executablesList);
      });
    });
  }

  /** Creates a compressed archive of the source path. */
  private async archive(output: string, sourcePath: string): Promise<void> {
    if (!(await pathExists(sourcePath))) {
      throw new NotFoundException(
        `The game file "${sourcePath}" could not be found.`,
      );
    }
    return new Promise<void>((resolve, reject) => {
      const archiveStream = add(output, sourcePath);
      archiveStream.on("error", async (error) => {
        this.logger.error({
          message: `Error archiving game. Deleting potentially corrupted output file.`,
          input: sourcePath,
          output,
          error,
        });
        await rm(output);
        reject(error);
      });

      archiveStream.on("end", () => {
        this.logger.debug({
          message: `Archived game.`,
          input: sourcePath,
          output,
        });
        resolve();
      });
    });
  }

  /**
   * This method performs an integrity check by comparing the games in the file
   * system with the games in the database, marking the deleted games as deleted
   * in the database. Then returns the updated games in the database.
   */
  private async checkIntegrity(
    filesInFileSystem?: File[],
  ): Promise<GamevaultGame[]> {
    const gamesInFileSystem = filesInFileSystem || (await this.readAllFiles());
    const gamesInDatabase = await this.gamesService.find({
      loadDeletedEntities: false,
      loadRelations: false,
      select: [
        "id",
        "file_path",
        "version",
        "size",
        "release_date",
        "early_access",
        "type",
      ],
    });

    if (configuration.TESTING.MOCK_FILES) {
      this.logger.log({
        message: "Skipping Integrity Check.",
        reason: "TESTING_MOCK_FILES is set to true",
      });
      return gamesInDatabase;
    }
    this.logger.log({
      message: "Started Game Integrity Check.",
      count: gamesInDatabase.length,
    });

    await this.cleanupDanglingVersionsForDeletedGames();

    const fsPaths = new Set(gamesInFileSystem.map((f) => f.path));
    const checkedGames: GamevaultGame[] = [];
    for (const gameInDatabase of gamesInDatabase) {
      try {
        const persistedVersions = await this.gameVersionRepository.find({
          where: { game: { id: gameInDatabase.id } },
          relationLoadStrategy: "query",
          relations: toFindOptionsRelations<GameVersion>(["game"]),
          withDeleted: true,
        });

        const activePersistedVersions = persistedVersions.filter(
          (version) => !version.deleted_at,
        );

        const availablePersistedVersions =
          activePersistedVersions.length > 0
            ? activePersistedVersions.map((version) =>
                Object.assign(new GameVersion(), {
                  id: version.id,
                  game: version.game,
                  file_path: version.file_path,
                  version: version.version,
                  size: version.size,
                  release_date: version.release_date,
                  early_access: !!version.early_access,
                  type: version.type || GameType.UNDETECTABLE,
                  indexed_at:
                    version.indexed_at || version.updated_at || new Date(),
                }),
              )
            : persistedVersions.length > 0
              ? []
              : this.normalizeVersions(gameInDatabase);
        const existingVersions = availablePersistedVersions.filter((version) =>
          fsPaths.has(version.file_path),
        );

        // If none of the versions are available anymore, mark game as deleted.
        if (existingVersions.length === 0) {
          const activeVersionIds = activePersistedVersions.map(
            (version) => version.id,
          );
          if (activeVersionIds.length > 0) {
            await this.gameVersionRepository.softDelete(activeVersionIds);
          }

          await this.gamesService.delete(gameInDatabase.id);
          this.logger.log({
            message: `Game marked as soft-deleted.`,
            reason: "No game version file found in filesystem.",
            game: {
              id: gameInDatabase.id,
              path: gameInDatabase.file_path,
            },
          });
          continue;
        }

        const versionsChanged =
          existingVersions.length !== availablePersistedVersions.length;

        if (versionsChanged) {
          const staleVersionIds = activePersistedVersions
            .filter((version) => !fsPaths.has(version.file_path))
            .map((version) => version.id);

          if (staleVersionIds.length > 0) {
            await this.gameVersionRepository.softDelete(staleVersionIds);
          }

          const selectedVersion = selectDefaultGameVersion(existingVersions);
          const gamePatch = Object.assign(new GamevaultGame(), {
            id: gameInDatabase.id,
          });
          this.applyVersionToGame(gamePatch, selectedVersion);
          // Persist only scalar game fields to avoid relation graph side effects.
          await this.gamesService.save(gamePatch);
        }

        checkedGames.push(gameInDatabase);
      } catch (error) {
        this.logger.error({
          message: `Error checking integrity of file.`,
          game: {
            id: gameInDatabase.id,
            path: gameInDatabase.file_path,
          },
          error,
        });
      }
    }
    this.logger.log({
      message: "Finished Game Integrity Check.",
      count: gamesInDatabase.length,
    });
    return checkedGames;
  }

  /** Soft-deletes active versions that still belong to already deleted games. */
  private async cleanupDanglingVersionsForDeletedGames(): Promise<void> {
    const danglingVersions = await this.gameVersionRepository.find({
      where: {
        deleted_at: IsNull(),
        game: {
          deleted_at: Not(IsNull()),
        },
      },
      relationLoadStrategy: "query",
      relations: toFindOptionsRelations<GameVersion>(["game"]),
      withDeleted: true,
    });

    const danglingVersionIds = danglingVersions
      .map((version) => version.id)
      .filter((id): id is number => Number.isFinite(id));

    if (danglingVersionIds.length === 0) {
      return;
    }

    await this.gameVersionRepository.softDelete(danglingVersionIds);
    this.logger.log({
      message: "Soft-deleted dangling game versions for already deleted games.",
      count: danglingVersionIds.length,
    });
  }

  /** Checks whether a given filename should be included by the indexer. */
  private shouldIncludeFile(filename: string): boolean {
    const shouldExclude =
      configuration.GAMES.SEARCH_EXCLUDE_FILE_REGEX?.test(filename);
    if (shouldExclude) {
      this.logger.debug({
        message: `Indexer ignoring filename due to exclusion settings.`,
        reason: "Excluded by configuration.",
        filename,
      });
    }
    return !shouldExclude && this.isValidFilePath(filename);
  }

  /** Checks whether a given dirname should be included by the indexer. */
  private shouldIncludeDirectory(dirname: string): boolean {
    const shouldExclude =
      configuration.GAMES.SEARCH_EXCLUDE_DIR_REGEX?.test(dirname);
    if (shouldExclude) {
      this.logger.debug({
        message: `Indexer ignoring dirname due to exclusion settings.`,
        reason: "Excluded by configuration.",
        dirname,
      });
    }
    return !shouldExclude;
  }

  /**
   * This method retrieves an array of objects representing game files in the
   * file system.
   */
  private async readAllFiles(): Promise<File[]> {
    try {
      if (configuration.TESTING.MOCK_FILES) {
        return (await import("../../testing/games.mock.js")).default;
      }

      const { readdirp } = await import("readdirp");

      const stream = readdirp(configuration.VOLUMES.FILES, {
        type: "files",
        depth: configuration.GAMES.SEARCH_RECURSIVE ? undefined : 0,
        fileFilter: (entry) => this.shouldIncludeFile(entry.basename),
        directoryFilter: (entry) => this.shouldIncludeDirectory(entry.basename),
        alwaysStat: true, // ensure size is available for integrity checks
      });

      const files: File[] = [];

      return new Promise<File[]>((resolve) => {
        stream.on("data", (entry) => {
          if (!entry.stats) {
            this.logger.warn({
              message: "Skipping file without stats during indexing.",
              path: entry.fullPath,
            });
            return;
          }

          files.push({
            path: entry.fullPath,
            size: BigInt(entry.stats.size),
          });
        });

        stream.on("warn", (warning) => {
          this.logger.warn({
            message:
              "Skipping inaccessible path during file scanning. Check directory permissions.",
            path: warning?.path,
            error: warning?.message || String(warning),
          });
        });

        stream.on("error", (error) => {
          this.logger.error({
            message:
              "Error during file scanning. Continuing with files found so far.",
            error,
          });
          resolve(files);
        });

        stream.on("end", () => {
          resolve(files);
        });
      });
    } catch (error) {
      this.logger.error({ message: "Error reading files.", error });
      return [];
    }
  }

  /** Resolves a concrete version to download for this game. */
  private async resolveDownloadVersion(
    game: GamevaultGame,
    requestedVersionId: number,
  ): Promise<GameVersion> {
    const availableVersions = sortGameVersions(
      await this.listAvailableVersionsFromStorage(game),
    );
    if (availableVersions.length === 0) {
      throw new NotFoundException(
        `The game has no downloadable versions available.`,
      );
    }

    const selectedVersion = availableVersions.find(
      (version) => version.id === requestedVersionId,
    );

    if (!selectedVersion) {
      throw new NotFoundException(
        `Version with id "${requestedVersionId}" not found for game id ${game.id}.`,
      );
    }

    return selectedVersion;
  }

  /** Resolves the default/latest downloadable version for legacy clients. */
  private async resolveLatestDownloadVersion(
    game: GamevaultGame,
  ): Promise<GameVersion> {
    const availableVersions = sortGameVersions(
      await this.listAvailableVersionsFromStorage(game),
    );
    if (availableVersions.length === 0) {
      throw new NotFoundException(
        `The game has no downloadable versions available.`,
      );
    }

    return selectDefaultGameVersion(availableVersions);
  }

  /** Schedules the deletion of a temporary file after a fixed timeout. */
  private scheduleTmpFileDeletion(gameId: number, filePath: string) {
    const timeoutName = `delete-tmp-${gameId}`;

    // If a deletion is already scheduled, remove it to reset the timer
    if (this.schedulerRegistry.getTimeouts().includes(timeoutName)) {
      this.schedulerRegistry.deleteTimeout(timeoutName);
    }

    const timeout = setTimeout(
      async () => {
        try {
          if (await pathExists(filePath)) {
            await rm(filePath);
            this.logger.log(
              `Deleted temporary archive after timeout: ${filePath}`,
            );
          }
        } catch (error) {
          this.logger.error({
            message: "Error deleting scheduled tmp file.",
            filePath,
            error,
          });
        }
      },
      24 * 60 * 60 * 1000,
    );

    this.schedulerRegistry.addTimeout(timeoutName, timeout);
  }

  /** Handles the download request for a game, including on-the-fly archiving if needed. */
  public async download(
    response: Response,
    gameId: number,
    requestedVersionId?: number,
    speedlimitHeader?: number,
    rangeHeader?: string,
    filterByAge?: number,
  ): Promise<StreamableFile> {
    // Set the download speed limit if provided, otherwise use the default value from configuration.
    speedlimitHeader =
      speedlimitHeader ??
      configuration.SERVER.MAX_DOWNLOAD_BANDWIDTH_IN_KBPS ??
      0;
    speedlimitHeader *= 1024;

    // Find the game by ID.
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      filterByAge,
    });
    const selectedVersion =
      requestedVersionId != null
        ? await this.resolveDownloadVersion(game, requestedVersionId)
        : await this.resolveLatestDownloadVersion(game);
    let fileDownloadPath = selectedVersion.file_path;

    // If mocking files for testing, return a StreamableFile with random bytes.
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Returning random download data.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      return new StreamableFile(randomBytes(1000), {
        disposition: `attachment; filename="${filenameSanitizer(
          unidecode(path.basename(fileDownloadPath)),
        )}"`,
        length: 1000,
        type: "application/x-zip",
      });
    }

    // If the file format is not supported, create an archive and use it for download.
    if (!globals.ARCHIVE_FORMATS.includes(path.extname(fileDownloadPath))) {
      const sourcePath = fileDownloadPath;
      fileDownloadPath = `/tmp/${gameId}.tar`;

      // If the archive file does not exist, create it.
      if (!(await pathExists(fileDownloadPath))) {
        await this.archive(fileDownloadPath, sourcePath);
      }

      this.scheduleTmpFileDeletion(gameId, fileDownloadPath);
    }

    // If the file does not exist, throw an exception.
    if (!(await pathExists(fileDownloadPath))) {
      throw new NotFoundException(
        `The game file "${fileDownloadPath}" could not be found.`,
      );
    }

    // Apply range header if provided otherwise returns the entire file
    const range = this.calculateRange(
      rangeHeader,
      (await stat(fileDownloadPath)).size,
    );
    this.logger.debug({
      message: "Applying download range.",
      rangeHeader,
      range,
    });

    // Read the file and apply speed limit if necessary.
    let file: Readable = createReadStream(fileDownloadPath, {
      start: range.start,
      end: range.end,
    });

    response.setHeader("X-Download-Size", range.size);

    if (speedlimitHeader) {
      file = file.pipe(new Throttle({ rate: speedlimitHeader }));
    }

    // Increment the download count.
    game.download_count++;
    await this.gamesService.save(game);

    const originalFilename = path.basename(fileDownloadPath);
    const downloadFilename = globals.ARCHIVE_FORMATS.includes(
      path.extname(originalFilename),
    )
      ? originalFilename
      : `${path.basename(originalFilename, path.extname(originalFilename))}.tar`;

    const { default: mime } = await import("mime");

    return new StreamableFile(file, {
      disposition: `attachment; filename="${filenameSanitizer(
        unidecode(downloadFilename),
      )}"`,
      length: range.size,
      type: mime.getType(fileDownloadPath) ?? undefined,
    });
  }

  /**
   * Parses the range header and returns the start, end, and size of the range.
   */
  private calculateRange(
    rangeHeader: string | undefined,
    fileSize: number,
  ): RangeHeader {
    let rangeStart = 0;
    let rangeEnd = fileSize - 1;

    if (rangeHeader?.includes("-")) {
      const [start, end] = rangeHeader.replace("bytes=", "").split("-");

      if (start) {
        const parsedStart = Number(start);
        if (!Number.isNaN(parsedStart) && parsedStart < fileSize) {
          rangeStart = parsedStart;
        }
      }

      if (end) {
        const parsedEnd = Number(end);
        if (!Number.isNaN(parsedEnd) && parsedEnd < fileSize) {
          rangeEnd = parsedEnd >= rangeStart ? parsedEnd : rangeEnd;
        }
      }
    }

    const rangeSize = rangeEnd - rangeStart + 1;
    return {
      start: rangeStart,
      end: rangeEnd,
      size: rangeSize,
    };
  }
}
