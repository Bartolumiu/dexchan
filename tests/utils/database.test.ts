import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Interaction } from "discord.js";
import { getInteractionContext } from "../../src/utils/database";
import { prisma } from "../../src/utils/prisma";
import { logMessage } from "../../src/lib/app";

jest.mock("../../src/lib/app", () => ({
  logMessage: jest.fn<any>().mockResolvedValue(undefined),
}));

jest.mock("../../src/utils/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    guildSettings: {
      findUnique: jest.fn(),
    },
    upstreamSource: {
      findMany: jest.fn(),
    },
  },
}));

describe("database utils - getInteractionContext", () => {
  const mockUserFindUnique = prisma.user.findUnique as jest.Mock<any>;
  const mockGuildSettingsFindUnique = prisma.guildSettings
    .findUnique as jest.Mock<any>;
  const mockUpstreamSourceFindMany = prisma.upstreamSource
    .findMany as jest.Mock<any>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return context with db user settings and guild specific sources", async () => {
    const interaction = {
      user: { id: "123" },
      guildId: "guild_1",
      locale: "fr",
    } as unknown as Interaction;

    mockUserFindUnique.mockResolvedValue({
      preferredLocale: "es",
      nsfwEnabled: true,
    });

    mockGuildSettingsFindUnique.mockResolvedValue({
      sources: [
        { enabled: true, source: { identifier: "custom-source-1" } },
        { enabled: false, source: { identifier: "custom-source-2" } },
      ],
    });

    const context = await getInteractionContext(interaction);

    expect(context.locale).toBe("es");
    expect(context.nsfwEnabled).toBe(true);
    expect(context.sources).toEqual(["custom-source-1"]);
    expect(mockUpstreamSourceFindMany).not.toHaveBeenCalled();
  });

  it("should fall back to interaction locale and global defaults if guild settings are missing", async () => {
    const interaction = {
      user: { id: "123" },
      guildId: "guild_1",
      locale: "fr",
    } as unknown as Interaction;

    mockUserFindUnique.mockResolvedValue(null);
    mockGuildSettingsFindUnique.mockResolvedValue(null);
    mockUpstreamSourceFindMany.mockResolvedValue([
      {
        identifier: "global-default-1",
      },
    ]);

    const context = await getInteractionContext(interaction);

    expect(context.locale).toBe("fr");
    expect(context.nsfwEnabled).toBe(false);
    expect(context.sources).toEqual(["global-default-1"]);
  });

  it("should fall back to global defaults if guild settings exist but sources array is empty", async () => {
    const interaction = {
      user: { id: "123" },
      guildId: "guild_1",
    } as unknown as Interaction;

    mockUserFindUnique.mockResolvedValue(null);
    mockGuildSettingsFindUnique.mockResolvedValue({ sources: [] });
    mockUpstreamSourceFindMany.mockResolvedValue([
      { identifier: "global-default-1" },
    ]);

    const context = await getInteractionContext(interaction);

    expect(context.sources).toEqual(["global-default-1"]);
  });

  it("should return fallback context and log error when DB query throws", async () => {
    const interaction = {
      user: { id: "123" },
      guildId: "guild_1",
      locale: "fr",
    } as unknown as Interaction;

    mockUserFindUnique.mockRejectedValue(new Error("DB connection lost"));

    const context = await getInteractionContext(interaction);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("[DB Error] getInteractionContext failed"),
      "error"
    );
    expect(context.locale).toBe("fr");
    expect(context.nsfwEnabled).toBe(false);
    expect(context.sources).toEqual(["mangadex", "namicomi", "mangabaka"]);
  });

  it("should fall back to 'en' in catch block when interaction has no locale", async () => {
    const interaction = {
      user: { id: "123" },
      guildId: "guild_1",
    } as unknown as Interaction;

    mockUserFindUnique.mockRejectedValue(new Error("DB connection lost"));

    const context = await getInteractionContext(interaction);

    expect(context.locale).toBe("en");
    expect(context.sources).toEqual(["mangadex", "namicomi", "mangabaka"]);
  });

  it("should fall back to 'en' and fetch global defaults for DMs (no guildId)", async () => {
    const interaction = {
      user: { id: "123" },
    } as unknown as Interaction;

    mockUserFindUnique.mockResolvedValue(null);
    mockUpstreamSourceFindMany.mockResolvedValue([
      { identifier: "dm-default-source" },
    ]);

    const context = await getInteractionContext(interaction);

    expect(context.locale).toBe("en");
    expect(context.nsfwEnabled).toBe(false);
    expect(context.sources).toEqual(["dm-default-source"]);
    expect(mockGuildSettingsFindUnique).not.toHaveBeenCalled();
  });

  it("should timeout and return fallback context if DB takes longer than 1000ms", async () => {
    jest.useFakeTimers();

    const interaction = {
      user: { id: "123" },
      guildId: "guild_1",
      locale: "eu",
    } as unknown as Interaction;

    mockUserFindUnique.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 2000))
    );

    const contextPromise = getInteractionContext(interaction);

    jest.runAllTimers();

    const context = await contextPromise;

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("Database check timed out"),
      "error"
    );
    expect(context.locale).toBe("eu");
    expect(context.nsfwEnabled).toBe(false);

    jest.useRealTimers();
  });
});
