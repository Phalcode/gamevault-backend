import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs-extra";
import { extractFull } from "node-7z";
import * as streamWeb from "node:stream/web";
import { join } from "path";
import * as semver from "semver";
import { Readable } from "stream";
import { AppConfiguration } from "../../configuration";
import { InjectGamevaultConfig } from "../../decorators/inject-gamevault-config.decorator";

interface GitHubRelease {
  tag_name: string;
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
   * Prepares the frontend for serving based on unstable mode and cache status.
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
      this.compatibleVersion = forcedVersion
        ? forcedVersion
        : this.getCompatibleOrFallbackRelease(
            serverVersion,
            await this.fetchReleases(),
          ).tag_name;

      if (await this.isCached(this.compatibleVersion)) {
        this.logger.log({
          message: "Using cached frontend version",
          version: this.compatibleVersion,
          cachePath: this.cachePath,
        });
      } else {
        this.logger.log({
          message: "Cached frontend not found, downloading",
          version: this.compatibleVersion,
          cachePath: this.cachePath,
        });
        await this.ensureFrontendCached(this.compatibleVersion);
      }

      this.logger.log({
        message: "Frontend is ready",
        version: this.compatibleVersion,
        cachePath: this.cachePath,
      });
    } catch (error) {
      this.logger.error("Error fetching or preparing frontend", error);
      // TODO: Implement "Frontend Broken" Page
    }
  }

  /**
   * Fetches all releases from GitHub, including 'unstable' or any non-semver releases,
   * then returns a sorted list with semver-valid releases first followed by non-semver releases.
   */
  private async fetchReleases(): Promise<GitHubRelease[]> {
    const defaultReleases = [{ tag_name: "unstable" }];
    const response = await fetch(this.githubApiUrl, {
      headers: { "User-Agent": "GameVault-Backend" },
    });
    if (!response.ok) {
      this.logger.error({
        message:
          "Error fetching releases from GitHub. Falling back to unstable release.",
        status: response.status,
        statusText: response.statusText,
      });
      return defaultReleases;
    }

    const rawReleases: GitHubRelease[] = await response.json();

    // Separate semver-valid and non-semver releases
    const semverReleases = rawReleases.filter(
      (r) => semver.valid(r.tag_name) !== null,
    );
    const nonSemverReleases = rawReleases.filter(
      (r) => semver.valid(r.tag_name) === null,
    );

    // Sort semver releases descending
    semverReleases.sort((a, b) => semver.rcompare(a.tag_name, b.tag_name));
    // Optionally, keep non-semver releases (e.g., 'unstable') at end or start - here appended after semver releases
    const combinedReleases = [...semverReleases, ...nonSemverReleases];

    return combinedReleases;
  }

  /**
   * Selects the most compatible stable release for the given server version,
   * or falls back to the latest unstable release.
   */
  private getCompatibleOrFallbackRelease(
    serverVersion: string,
    releases: GitHubRelease[],
  ): GitHubRelease {
    const compatible = this.selectCompatibleRelease(serverVersion, releases);
    if (!compatible) {
      const nearestNewer = this.selectNearestNewerRelease(
        serverVersion,
        releases,
      );
      if (nearestNewer) {
        this.logger.warn({
          message:
            "No compatible stable release found, falling back to nearest newer stable release",
          release: nearestNewer.tag_name,
        });
        return nearestNewer;
      }

      this.logger.warn(
        "No compatible stable release found, falling back to latest unstable",
      );
      const fallback = releases.find((r) => r.tag_name === "unstable");
      if (!fallback) throw new Error("No unstable release found");
      return fallback;
    }
    return compatible;
  }

  /**
   * Finds the most compatible stable release based on major, minor, and patch version.
   *
   * Selection matrix (when `WEB_UI.VERSION` is not forced):
   * +------------------------------+--------+-------------------------------------+----------+-----------------------------------------------+
   * | Case                         | Server | Frontend releases (desc)            | Selected | Why                                           |
   * +------------------------------+--------+-------------------------------------+----------+-----------------------------------------------+
   * | Same minor latest patch      | 2.4.0  | 3.0.0, 2.5.0, 2.4.7, unstable       | 2.4.7    | Same major+minor picks the latest patch.      |
   * | Only newer stable releases   | 2.4.0  | 3.0.0, 2.5.0, unstable              | 2.5.0    | No compatible stable; nearest newer is used.  |
   * | Lower minor compatibility    | 2.4.0  | 2.3.9, 2.3.1, unstable              | 2.3.9    | Lower minor is compatible; first match wins.  |
   * | No stable releases available | 2.4.0  | unstable                            | unstable | No stable candidate exists, so unstable wins. |
   * +------------------------------+--------+-------------------------------------+----------+-----------------------------------------------+
   *
   * Rule summary:
   * - `WEB_UI.VERSION` set: always use forced version directly (no compatibility check).
   * - Auto mode: pick first stable release where major matches and
   *   `release.minor <= server.minor`.
   * - Because releases are sorted descending, same major+minor always picks the
   *   latest available patch.
   * - If no compatible stable match is found, use the nearest newer stable release.
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
      if (release.tag_name === "unstable" || !semver.valid(release.tag_name))
        continue;

      const parsedRelease = semver.parse(release.tag_name);
      if (!parsedRelease) continue;

      const isCompatibleMajor = parsedRelease.major === parsedServer.major;
      const isCompatibleVersion = parsedRelease.minor <= parsedServer.minor;

      if (isCompatibleMajor && isCompatibleVersion) {
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

  /**
   * Finds the nearest newer stable release (smallest semver greater than server).
   */
  private selectNearestNewerRelease(
    serverVersion: string,
    releases: GitHubRelease[],
  ): GitHubRelease | null {
    const parsedServer = semver.parse(serverVersion);
    if (!parsedServer) return null;

    const newerStableReleases = releases
      .filter((release) => semver.valid(release.tag_name) !== null)
      .filter((release) => semver.gt(release.tag_name, parsedServer.version))
      .sort((a, b) => semver.compare(a.tag_name, b.tag_name));

    return newerStableReleases[0] ?? null;
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
    const indexPath = join(this.cachePath, "dist", "index.html");
    const versionFilePath = join(this.cachePath, ".version");

    const indexExists = await fs.pathExists(indexPath);
    const versionExists = await fs.pathExists(versionFilePath);

    if (!indexExists || !versionExists) {
      this.logger.debug(
        "Cache missing index or version file",
        indexExists,
        versionExists,
      );
      return false;
    }

    const cachedVersion = (await fs.readFile(versionFilePath, "utf-8")).trim();
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
