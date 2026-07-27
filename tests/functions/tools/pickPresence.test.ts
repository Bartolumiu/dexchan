import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { ActivityType } from "discord.js";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";
import { prisma } from "../../../src/utils/prisma";
import { logMessage } from "../../../src/lib/app";

jest.mock("../../../src/utils/prisma", () => ({
  prisma: {
    botPresence: {
      findMany: jest.fn<any>().mockResolvedValue([]),
    },
  },
}));

jest.mock("../../../src/lib/app", () => ({
  logMessage: jest.fn(),
}));

describe("pickPresence", () => {
  let client: ExtendedClient;
  let pickPresence: any;
  let clearPresenceCache: any;

  const getMockFindMany = () =>
    prisma.botPresence.findMany as unknown as jest.Mock<() => Promise<any>>;

  beforeEach(async () => {
    const module = await import("../../../src/functions/tools/pickPresence");
    pickPresence = module.default;
    clearPresenceCache = module.clearPresenceCache;
    if (clearPresenceCache) clearPresenceCache();

    const mockGuilds = [{ memberCount: 50 }, { memberCount: 150 }];
    client = {
      user: {
        setPresence: jest.fn(),
      },
      guilds: {
        cache: {
          size: mockGuilds.length,
          reduce: (fn: any, initial: number) => mockGuilds.reduce(fn, initial),
        },
      },
      version: "1.0.0",
    } as unknown as ExtendedClient;
    getMockFindMany().mockClear();
    getMockFindMany().mockResolvedValue([]);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should fetch presences from database and set one on the client", async () => {
    const mockPresences = [
      {
        text: "Testing {version}",
        status: "online",
        type: ActivityType.Custom,
        enabled: true,
      },
    ];
    getMockFindMany().mockResolvedValue(mockPresences);

    await pickPresence(client);

    expect(getMockFindMany()).toHaveBeenCalled();
    expect(client.user?.setPresence).toHaveBeenCalledWith({
      activities: [
        {
          name: "Testing 1.0.0",
          type: ActivityType.Custom,
        },
      ],
      status: "online",
    });
  });

  it("should use fallback presences if database is empty", async () => {
    getMockFindMany().mockResolvedValue([]);

    await pickPresence(client);

    expect(client.user?.setPresence).toHaveBeenCalledWith(
      expect.objectContaining({
        activities: [
          expect.objectContaining({
            name: expect.stringContaining("1.0.0"),
          }),
        ],
      })
    );
  });

  it("should fallback to an empty array if database returns a falsy value", async () => {
    getMockFindMany().mockResolvedValue(null as any); // Forces `|| []` branch

    await pickPresence(client);

    expect(client.user?.setPresence).toHaveBeenCalled();
  });

  it("should use fallback presences if database fetch fails and cache is empty", async () => {
    const error = new Error("DB Error");
    getMockFindMany().mockRejectedValue(error);

    await pickPresence(client);

    expect(logMessage).toHaveBeenCalledWith(
      "[Presence] Failed to fetch presences from database: DB Error",
      "error"
    );
    expect(client.user?.setPresence).toHaveBeenCalled();
  });

  it("should retain existing cache if database fetch fails and cache is populated", async () => {
    getMockFindMany().mockResolvedValue([
      { text: "Cached Presence", status: "online", type: ActivityType.Custom },
    ]);
    await pickPresence(client);

    jest.advanceTimersByTime(6 * 60 * 1000);

    getMockFindMany().mockRejectedValue(new Error("DB Failure"));
    await pickPresence(client);

    expect(client.user?.setPresence).toHaveBeenCalledWith(
      expect.objectContaining({
        activities: [expect.objectContaining({ name: "Cached Presence" })],
      })
    );
  });

  it("should use cache within TTL", async () => {
    const mockPresences = [
      {
        text: "Cached",
        status: "online",
        type: ActivityType.Custom,
      },
    ];
    getMockFindMany().mockResolvedValue(mockPresences);

    await pickPresence(client); // Initial fetch
    expect(getMockFindMany()).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2 * 60 * 1000); // 2 minutes, TTL is 5 minutes

    await pickPresence(client); // Should use cache
    expect(getMockFindMany()).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(4 * 60 * 1000); // 4 more minutes, total 6, exceeds TTL

    await pickPresence(client); // Should fetch again
    expect(getMockFindMany()).toHaveBeenCalledTimes(2);
  });

  it("should correctly parse dynamic replacements", async () => {
    getMockFindMany().mockResolvedValue([
      {
        text: "v{version} g{guildCount} u{userCount}",
        status: "online",
        type: ActivityType.Custom,
      },
    ]);

    await pickPresence(client);

    expect(client.user?.setPresence).toHaveBeenCalledWith(
      expect.objectContaining({
        activities: [
          expect.objectContaining({
            name: "v1.0.0 g2 u200",
          }),
        ],
      })
    );
  });
});
