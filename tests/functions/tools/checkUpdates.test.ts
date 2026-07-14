import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import checkUpdates, {
  parseVersionPart,
} from "../../../src/functions/tools/checkUpdates";
import getVersion from "../../../src/functions/tools/getVersion";
import { logMessage } from "../../../src/lib/app";

jest.mock("../../../src/functions/tools/getVersion");
jest.mock("../../../src/lib/app", () => ({
  logMessage: jest.fn(),
}));

describe("checkUpdates", () => {
  const getMockFetch = () => global.fetch as unknown as jest.Mock<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    global.fetch = jest.fn<any>();
  });

  describe("parseVersionPart", () => {
    it("should parse valid numbers", () => {
      expect(parseVersionPart("1")).toBe(1);
      expect(parseVersionPart("10")).toBe(10);
    });

    it("should return 0 for invalid or missing parts", () => {
      expect(parseVersionPart(undefined)).toBe(0);
      expect(parseVersionPart("abc")).toBe(0);
      expect(parseVersionPart("")).toBe(0);
    });
  });

  it("should return isOutdated: true when a newer major version exists", async () => {
    (getVersion as jest.Mock<any>).mockReturnValue("1.0.0");
    getMockFetch().mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tag_name: "2.0.0" }),
      })
    );

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: true, latestVersion: "2.0.0" });
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("The bot is outdated!"),
      "warn"
    );
  });

  it("should return isOutdated: true when a newer minor version exists", async () => {
    (getVersion as jest.Mock<any>).mockReturnValue("1.0.0");
    getMockFetch().mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tag_name: "1.1.0" }),
      })
    );

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: true, latestVersion: "1.1.0" });
  });

  it("should return isOutdated: true when a newer patch version exists", async () => {
    (getVersion as jest.Mock<any>).mockReturnValue("1.0.0");
    getMockFetch().mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tag_name: "1.0.1" }),
      })
    );

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: true, latestVersion: "1.0.1" });
  });

  it("should return isOutdated: false when versions are the same", async () => {
    (getVersion as jest.Mock<any>).mockReturnValue("1.0.0");
    getMockFetch().mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tag_name: "1.0.0" }),
      })
    );

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: false, latestVersion: "1.0.0" });
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("The bot is up to date!"),
      "success"
    );
  });

  it("should return isOutdated: false when current major version is newer", async () => {
    (getVersion as jest.Mock<any>).mockReturnValue("2.0.0");
    getMockFetch().mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tag_name: "1.0.0" }),
      })
    );

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: false, latestVersion: "1.0.0" });
  });

  it("should return isOutdated: false when current minor version is newer", async () => {
    (getVersion as jest.Mock<any>).mockReturnValue("1.1.0");
    getMockFetch().mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tag_name: "1.0.0" }),
      })
    );

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: false, latestVersion: "1.0.0" });
  });

  it("should return isOutdated: false when current patch version is newer", async () => {
    (getVersion as jest.Mock<any>).mockReturnValue("1.0.1");
    getMockFetch().mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tag_name: "1.0.0" }),
      })
    );

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: false, latestVersion: "1.0.0" });
  });

  it("should handle prerelease: current is prerelease, latest is stable (outdated)", async () => {
    (getVersion as jest.Mock<any>).mockReturnValue("1.0.0-beta");
    getMockFetch().mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tag_name: "1.0.0" }),
      })
    );

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: true, latestVersion: "1.0.0" });
  });

  it("should handle prerelease: current is beta, latest is dev (outdated)", async () => {
    (getVersion as jest.Mock<any>).mockReturnValue("1.0.0-beta");
    getMockFetch().mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tag_name: "1.0.0-dev" }),
      })
    );

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: true, latestVersion: "1.0.0-dev" });
  });

  it("should return isOutdated: null on fetch failure (not ok)", async () => {
    getMockFetch().mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 404,
      })
    );

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: null, latestVersion: null });
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("Failed to check for updates: HTTP status 404"),
      "error"
    );
  });

  it("should return isOutdated: null on fetch exception", async () => {
    getMockFetch().mockReturnValue(Promise.reject(new Error("Network Error")));

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: null, latestVersion: null });
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("Failed to check for updates: Network Error"),
      "error"
    );
  });

  it("should return isOutdated: null and parse string errors on fetch exception", async () => {
    getMockFetch().mockReturnValue(Promise.reject("Network Error"));

    const status = await checkUpdates();
    expect(status).toEqual({ isOutdated: null, latestVersion: null });
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("Failed to check for updates: Network Error"),
      "error"
    );
  });
});
