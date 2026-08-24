import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

jest.mock("../../src/utils/prisma", () => ({
  prisma: {
    bot: {
      upsert: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    },
  },
}));

jest.mock("../../src/functions/handlers/handleLocales", () => ({
  getAvailableLocales: jest.fn(() => [
    { code: "en", name: "English (en)", enabled: true },
    { code: "es", name: "Español (es)", enabled: true },
    { code: "eu", name: "Euskara (eu)", enabled: true },
    { code: "", name: "Japanese ()", enabled: false },
  ]),
}));

import { syncBotLocales } from "../../src/i18n/syncBotLocales";
import { prisma } from "../../src/utils/prisma";

describe("syncBotLocales", () => {
  const originalClientId = process.env.CLIENT_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLIENT_ID = "1234567890";
  });

  afterAll(() => {
    if (originalClientId === undefined) delete process.env.CLIENT_ID;
    else process.env.CLIENT_ID = originalClientId;
  });

  it("upserts a single Bot row keyed by CLIENT_ID with [{code, enabled}]", async () => {
    await syncBotLocales();

    const upsert = prisma.bot.upsert as any;
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith({
      where: { id: "1234567890" },
      create: {
        id: "1234567890",
        locales: [
          { code: "en", enabled: true },
          { code: "es", enabled: true },
          { code: "eu", enabled: true },
        ],
      },
      update: { locales: expect.any(Array) },
    });
  });

  it("excludes locales with an empty code", async () => {
    await syncBotLocales();

    const locales = (prisma.bot.upsert as any).mock.calls[0][0].create
      .locales as Array<{ code: string; enabled: boolean }>;
    expect(locales).toHaveLength(3);
    expect(locales.find((l) => l.code === "")).toBeUndefined();
  });

  it("throws if CLIENT_ID is missing", async () => {
    delete process.env.CLIENT_ID;
    await expect(syncBotLocales()).rejects.toThrow("CLIENT_ID is not defined");
  });
});
