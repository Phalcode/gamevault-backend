import semver from "semver";

export interface VersionLike {
  file_path: string;
  version?: string;
  indexed_at?: Date;
}

interface VersionSignals {
  strictSemver?: string;
  comparabilityScore: number;
  dateValue?: number;
  numericParts: number[];
  isPreReleaseLike: boolean;
}

/**
 * Sorts game versions from newest/most relevant to oldest/least relevant.
 *
 * Priority order:
 * 1) strict semver (descending)
 * 2) comparability score (semver-like > date-like > numeric > plain)
 * 3) extracted date value
 * 4) numeric parts comparison
 * 5) pre-release hints
 * 6) indexed_at recency
 * 7) version string lexical fallback
 */
export function sortGameVersions<T extends VersionLike>(versions: T[]): T[] {
  // Keep only one entry per file path to avoid duplicate records skewing ranking.
  const uniqueVersions = Array.from(
    new Map(versions.map((version) => [version.file_path, version])).values(),
  );

  return uniqueVersions.sort((a, b) => {
    const aSignals = extractVersionSignals(a.version);
    const bSignals = extractVersionSignals(b.version);

    if (aSignals.strictSemver && bSignals.strictSemver) {
      const semverCompare = semver.rcompare(
        aSignals.strictSemver,
        bSignals.strictSemver,
      );
      if (semverCompare !== 0) {
        return semverCompare;
      }
    }

    if (aSignals.comparabilityScore !== bSignals.comparabilityScore) {
      return bSignals.comparabilityScore - aSignals.comparabilityScore;
    }

    if (aSignals.dateValue != null && bSignals.dateValue != null) {
      if (aSignals.dateValue !== bSignals.dateValue) {
        return bSignals.dateValue - aSignals.dateValue;
      }
    } else if (aSignals.dateValue != null || bSignals.dateValue != null) {
      return bSignals.dateValue != null ? 1 : -1;
    }

    const numericCompare = compareNumericParts(
      aSignals.numericParts,
      bSignals.numericParts,
    );
    if (numericCompare !== 0) {
      return numericCompare;
    }

    if (aSignals.isPreReleaseLike !== bSignals.isPreReleaseLike) {
      return aSignals.isPreReleaseLike ? 1 : -1;
    }

    const aIndexedAt = new Date(a.indexed_at || 0).getTime();
    const bIndexedAt = new Date(b.indexed_at || 0).getTime();
    if (aIndexedAt !== bIndexedAt) {
      return bIndexedAt - aIndexedAt;
    }

    return (b.version || "").localeCompare(a.version || "");
  });
}

/**
 * Selects the default version for download.
 *
 * When no version string is comparable, prefers the legacy file path anchor to
 * preserve stable behavior for unversioned collections.
 */
export function selectDefaultGameVersion<T extends VersionLike>(
  versions: T[],
  preferredFilePath?: string,
): T {
  const sortedVersions = sortGameVersions(versions);
  const hasComparableVersions = sortedVersions.some(
    (version) => extractVersionSignals(version.version).comparabilityScore > 0,
  );

  if (!hasComparableVersions && preferredFilePath) {
    const preferred = sortedVersions.find(
      (version) => version.file_path === preferredFilePath,
    );
    if (preferred) {
      return preferred;
    }
  }

  return sortedVersions[0];
}

/**
 * Extracts comparison-relevant signals from a version string.
 */
function extractVersionSignals(version?: string): VersionSignals {
  const normalized = (version || "")
    .trim()
    .replace(/^v\.?\s*/i, "")
    .replace(/[_\s]+/g, " ");

  const strictSemver = semver.valid(normalized, {
    loose: true,
  });

  const dateValue = extractDateVersionValue(normalized);
  const numericParts = (normalized.match(/\d+/g) || []).map(Number);
  const hasDotSeparatedNumeric = /\d+\.\d+/.test(normalized);
  const isPreReleaseLike =
    /(alpha|beta|pre|preview|rc|test|dev|hotfix|patch|build)/i.test(normalized);

  let comparabilityScore = 0;
  if (strictSemver) {
    comparabilityScore = 4;
  } else if (hasDotSeparatedNumeric && numericParts.length > 1) {
    comparabilityScore = 3;
  } else if (dateValue != null) {
    comparabilityScore = 2;
  } else if (numericParts.length > 1) {
    comparabilityScore = 2;
  } else if (numericParts.length === 1) {
    comparabilityScore = 1;
  }

  return {
    strictSemver,
    comparabilityScore,
    dateValue,
    numericParts,
    isPreReleaseLike,
  };
}

/**
 * Compares two arrays of numeric parts in descending order.
 */
function compareNumericParts(a: number[], b: number[]): number {
  const maxLength = Math.max(a.length, b.length);
  for (let i = 0; i < maxLength; i++) {
    const aPart = a[i] ?? 0;
    const bPart = b[i] ?? 0;

    if (aPart !== bPart) {
      return bPart - aPart;
    }
  }

  return 0;
}

/**
 * Attempts to parse a date-like version into a UTC timestamp for ranking.
 */
function extractDateVersionValue(version: string): number | undefined {
  const patterns = [
    /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
    /(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/,
    /(^|\D)(\d{4})(\d{2})(\d{2})(\D|$)/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(version);
    if (!match) {
      continue;
    }

    let year: number;
    let month: number;
    let day: number;

    if (pattern === patterns[0]) {
      year = Number(match[1]);
      month = Number(match[2]);
      day = Number(match[3]);
    } else if (pattern === patterns[1]) {
      day = Number(match[1]);
      month = Number(match[2]);
      year = Number(match[3]);
    } else {
      year = Number(match[2]);
      month = Number(match[3]);
      day = Number(match[4]);
    }

    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      continue;
    }

    return Date.UTC(year, month - 1, day);
  }

  return undefined;
}
