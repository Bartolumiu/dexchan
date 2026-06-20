import getVersion from "./getVersion";
import getChalk from "./getChalk";

export interface UpdateStatus {
  isOutdated: boolean | null;
  latestVersion: string | null;
}

interface ParsedVersion {
  version: string;
  major: number;
  minor: number;
  patch: number;
  prerelease: string;
}

export const parseVersionPart = (part?: string): number => {
  if (!part) return 0;
  const parsed = Number.parseInt(part, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default async function checkUpdates(): Promise<UpdateStatus> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/Bartolumiu/dexchan/releases/latest"
    );

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const data = (await response.json()) as { tag_name: string };
    const latestVersion = data.tag_name;
    const currentVersion = getVersion();

    const latestParts = latestVersion.split(".");
    const currentParts = currentVersion.split(".");

    const latest: ParsedVersion = {
      version: latestVersion,
      major: parseVersionPart(latestParts[0]),
      minor: parseVersionPart(latestParts[1]),
      patch: parseVersionPart(latestParts[2]),
      prerelease: latestVersion.split("-")[1] || "",
    };

    const current: ParsedVersion = {
      version: currentVersion,
      major: parseVersionPart(currentParts[0]),
      minor: parseVersionPart(currentParts[1]),
      patch: parseVersionPart(currentParts[2]),
      prerelease: currentVersion.split("-")[1] || "",
    };

    const compareVersions = (l: ParsedVersion, c: ParsedVersion): number => {
      if (l.major > c.major) return 1;
      if (l.major < c.major) return -1;
      if (l.minor > c.minor) return 1;
      if (l.minor < c.minor) return -1;
      if (l.patch > c.patch) return 1;
      if (l.patch < c.patch) return -1;
      return 0;
    };

    const versionComparison = compareVersions(latest, current);

    if (versionComparison > 0) {
      return { isOutdated: true, latestVersion };
    }

    if (versionComparison === 0) {
      if (!latest.prerelease && current.prerelease) {
        return { isOutdated: true, latestVersion };
      }
      if (latest.prerelease === "dev" && current.prerelease === "beta") {
        return { isOutdated: true, latestVersion };
      }
    }

    return { isOutdated: false, latestVersion };
  } catch (error: unknown) {
    const chalk = await getChalk();
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(
      chalk.redBright(`[GitHub] Failed to check for updates: ${errorMessage}`)
    );

    return { isOutdated: null, latestVersion: null };
  }
}
