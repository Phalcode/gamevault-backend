import { Injectable, Logger } from "@nestjs/common";
import fs from "fs-extra";
import node7z from "node-7z";
import { join } from "node:path";
import { Readable } from "node:stream";
import * as streamWeb from "node:stream/web";
import * as semver from "semver";
import type { AppConfiguration } from "../../configuration.js";
import { InjectGamevaultConfig } from "../../decorators/inject-gamevault-config.decorator.js";
const { extractFull } = node7z;

/** Moving release tags that are not stable semver releases. */
const PRE_RELEASE_TAGS = ["unstable", "early-access"] as const;

/** Maps a `WEB_UI_VERSION` value to a moving pre-release tag, if it is one. */
function resolvePreReleaseTag(
  version: string,
): (typeof PRE_RELEASE_TAGS)[number] | null {
  const normalized = version.trim().toLowerCase();
  return PRE_RELEASE_TAGS.find((tag) => tag === normalized) ?? null;
}

interface GitHubRelease {
  tag_name: string;
  prerelease?: boolean;
  draft?: boolean;
}

/**
 * Service to handle fetching, caching, and serving the frontend bundle.
 */
@Injectable()
export class WebUIService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly githubApiUrl =
    "https://api.github.com/repos/Phalcode/gamevault-frontend/releases";
  private compatibleVersion = "";

  constructor(
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
  ) {}

  private get cachePath(): string {
    return join(this.config.VOLUMES.CONFIG, "frontend");
  }

  /**
   * Prepares the frontend for serving based on the selected version and cache status.
   *
   * A server that cannot reach GitHub or cannot find a suitable release keeps
   * serving the build that is already cached. It never replaces a working Web
   * UI with a development build on its own.
   */
  async prepareFrontend(): Promise<void> {
    const serverVersion = this.config.SERVER.VERSION;
    const forcedVersion = this.config.WEB_UI.VERSION;

    this.logger.log({
      message: "Preparing frontend",
      serverVersion,
      forcedVersion,
      cachePath: this.cachePath,
    });

    await fs.ensureDir(this.cachePath);

    try {
      const version = await this.resolveVersion();
      if (!version) {
        this.logger.error({
          message:
            "No usable Web UI release found and no cached build available. The Web UI stays unavailable until the next restart or admin restart.",
          serverVersion,
        });
        return;
      }

      this.compatibleVersion = version;

      if (await this.isCached(version)) {
        this.logger.log({
          message: "Using cached frontend version",
          version,
          cachePath: this.cachePath,
        });
      } else {
        this.logger.log({
          message: "Cached frontend not found, downloading",
          version,
          cachePath: this.cachePath,
        });
        await this.ensureFrontendCached(version);
      }

      this.logger.log({
        message: "Frontend is ready",
        version,
        cachePath: this.cachePath,
      });
    } catch (error) {
      this.logger.error("Error fetching or preparing frontend", error);
      // TODO: Implement "Frontend Broken" Page
    }
  }

  /**
   * Fetches the stable releases from GitHub, newest first.
   *
   * Returns `null` when the list cannot be read (network error, GitHub down,
   * API rate limit), so callers can fall back to the cached build instead of
   * silently selecting a development release.
   */
  private async fetchReleases(): Promise<GitHubRelease[] | null> {
    try {
      const response = await fetch(this.githubApiUrl, {
        headers: {
          "User-Agent": "GameVault-Backend",
          Accept: "application/vnd.github+json",
        },
      });
      if (!response.ok) {
        this.logger.warn({
          message:
            "Error fetching releases from GitHub. Keeping the cached frontend.",
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const rawReleases: unknown = await response.json();
      if (!Array.isArray(rawReleases)) {
        this.logger.warn({
          message:
            "Unexpected release list from GitHub. Keeping the cached frontend.",
        });
        return null;
      }

      // Drafts, prereleases and non-semver tags (`unstable`, `early-access`)
      // are not part of the stable channel, even if they are valid semver.
      const stableReleases = (rawReleases as GitHubRelease[]).filter(
        (release) =>
          !release.draft &&
          !release.prerelease &&
          semver.valid(release.tag_name) !== null,
      );

      stableReleases.sort((a, b) => semver.rcompare(a.tag_name, b.tag_name));
      return stableReleases;
    } catch (error) {
      this.logger.warn({
        message:
          "Failed to fetch releases from GitHub. Keeping the cached frontend.",
        error: String(error),
      });
      return null;
    }
  }

  /**
   * Resolves the Web UI version to serve.
   *
   * Order of precedence:
   * 1. `WEB_UI_VERSION` set to `unstable` or `early-access` serves that moving
   *    pre-release tag, every other value is used as an exact release tag.
   * 2. Newest stable release with the same major version as the server.
   * 3. The last build that is already cached, when the release list or a
   *    suitable release is unavailable.
   *
   * Returns `null` only when nothing can be served at all.
   */
  private async resolveVersion(): Promise<string | null> {
    const forcedVersion = this.config.WEB_UI.VERSION?.trim();
    if (forcedVersion) {
      const preReleaseTag = resolvePreReleaseTag(forcedVersion);
      if (preReleaseTag) {
        this.logger.warn({
          message: "Serving an opted-in Web UI pre-release",
          version: preReleaseTag,
        });
        return preReleaseTag;
      }
      return forcedVersion;
    }

    const serverVersion = this.config.SERVER.VERSION;
    const releases = await this.fetchReleases();

    if (releases) {
      const compatible = this.selectCompatibleRelease(serverVersion, releases);
      if (compatible) return compatible.tag_name;
      this.logger.warn({
        message: "No stable Web UI release found for this server version",
        serverVersion,
      });
    }

    const cachedVersion = await this.getCachedVersion();
    if (cachedVersion) {
      this.logger.warn({
        message: "Falling back to the last working Web UI build from the cache",
        cachedVersion,
      });
      return cachedVersion;
    }

    return null;
  }

  /**
   * Finds the newest stable release with the same major version as the server.
   *
   * The major version is the compatibility boundary: the desktop client talks
   * to every server of the same major, so the Web UI does too. Minor versions
   * are not compared, which lets a new feature release reach the Web UI without
   * a matching server release.
   *
   * The release list is already sorted newest first, so the first match wins.
   */
  private selectCompatibleRelease(
    serverVersion: string,
    releases: GitHubRelease[],
  ): GitHubRelease | null {
    const parsedServer = semver.parse(serverVersion);
    if (!parsedServer) {
      this.logger.warn({ message: "Invalid server semver", serverVersion });
      return null;
    }

    for (const release of releases) {
      const parsedRelease = semver.parse(release.tag_name);
      if (!parsedRelease) continue;

      if (parsedRelease.major === parsedServer.major) {
        this.logger.debug({
          message: "Compatible frontend release selected",
          release: release.tag_name,
        });
        return release;
      }
    }

    this.logger.warn("No compatible frontend release found");
    return null;
  }

  /** Version of the unpacked build in the cache, or `null` when there is none. */
  private async getCachedVersion(): Promise<string | null> {
    const indexPath = join(this.cachePath, "dist", "index.html");
    const versionFilePath = join(this.cachePath, ".version");

    const [indexExists, versionExists] = await Promise.all([
      fs.pathExists(indexPath),
      fs.pathExists(versionFilePath),
    ]);
    if (!indexExists || !versionExists) {
      this.logger.debug("Cache missing index or version file", {
        indexExists,
        versionExists,
      });
      return null;
    }

    const cachedVersion = (await fs.readFile(versionFilePath, "utf-8")).trim();
    return cachedVersion || null;
  }

  /**
   * Ensures the frontend is downloaded, extracted, and cached for the given version.
   */
  private async ensureFrontendCached(
    version: string,
    forceRedownload = false,
  ): Promise<void> {
    const downloadUrl = `https://github.com/Phalcode/gamevault-frontend/releases/download/${version}/gamevault-frontend.zip`;
    const zipPath = join(this.cachePath, "gamevault-frontend.zip");

    if (!forceRedownload && (await this.isCached(version))) {
      this.logger.log({
        message: "Frontend already cached and version matches",
        version,
      });
      return;
    }

    this.logger.log({
      message: "Downloading frontend zip",
      downloadUrl,
    });
    await this.downloadFile(downloadUrl, zipPath);

    await this.cleanCacheExceptZip();

    this.logger.log({ message: "Starting zip extraction", zipPath });
    await this.extractZip(zipPath);

    this.logger.debug({
      message: "Removing zip file after extraction",
      zipPath,
    });
    await fs.remove(zipPath);

    await this.writeVersionFile(version);
  }

  /**
   * Cleans the cache directory by removing all files except the zip.
   */
  public async cleanCacheExceptZip(): Promise<void> {
    const cacheFiles = await fs.readdir(this.cachePath);
    for (const file of cacheFiles) {
      if (file !== "gamevault-frontend.zip") {
        await fs.remove(join(this.cachePath, file));
      }
    }
    this.logger.debug("Cache cleaned except zip file");
  }

  /**
   * Extracts the zip archive in the cache directory.
   */
  private extractZip(zipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const unzip = extractFull(zipPath, this.cachePath, { $progress: true });
      unzip.on("end", () => {
        this.logger.log("Zip extraction completed");
        resolve();
      });
      unzip.on("error", (err) => {
        this.logger.error("Zip extraction error", err);
        reject(err);
      });
    });
  }

  /**
   * Writes the current version to a .version file in the cache.
   */
  private async writeVersionFile(version: string): Promise<void> {
    const versionFile = join(this.cachePath, ".version");
    await fs.writeFile(versionFile, version, "utf-8");
    this.logger.debug({ message: "Version file written", version });
  }

  /**
   * Checks if the frontend cache is valid for the given version.
   */
  private async isCached(version: string): Promise<boolean> {
    const cachedVersion = await this.getCachedVersion();
    if (!cachedVersion) return false;

    const matches = cachedVersion === version;
    this.logger.debug({
      message: "Cache version validation",
      cachedVersion,
      requestedVersion: version,
      matches,
    });
    return matches;
  }

  /**
   * Downloads a file from a URL and saves it locally.
   */
  private async downloadFile(url: string, dest: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`);
    if (!res.body) throw new Error("Response body is empty");

    const nodeStream = Readable.fromWeb(
      res.body as streamWeb.ReadableStream<Uint8Array>,
    );
    await new Promise<void>((resolve, reject) => {
      const fileStream = fs.createWriteStream(dest);
      nodeStream.pipe(fileStream);
      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
    });

    this.logger.debug({ message: "Downloaded file saved", dest });
  }
}
