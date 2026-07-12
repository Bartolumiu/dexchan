import { afterAll, beforeEach, describe, expect, it, jest, } from "@jest/globals";
import { ChatInputCommandInteraction } from "discord.js";
import pingCommand from "../../../src/commands/utils/ping";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";

jest.mock("../../../src/functions/handlers/handleLocales", () => {
  const mockTranslations = {
    common: {
      footers: {
        command: "{commandName} - Requested by {user}",
      },
      words: {
        not_ok: "Fetch failed",
      },
    },
    commands: {
      ping: {
        description: "Mocked description",
        response: {
          title: "Pong!",
          fields: {
            bot_latency: "Bot Latency",
            api: {
              discord: "Discord API",
              mangadex: "MangaDex API",
              namicomi: "NamiComi API",
            },
          },
        },
      },
    },
    sources: {},
  };

  return {
    translateAttribute: jest.fn().mockImplementation((selector: any) => {
      selector(mockTranslations);
      return { "en-GB": "translated string" };
    }),
    getTranslations: jest.fn().mockReturnValue(mockTranslations),
    format: jest.fn().mockImplementation(((str: any, vars: any) => {
      let res = str as string;
      const replacements = vars as Record<string, any>;
      for (const [key, value] of Object.entries(replacements)) {
        res = res.replace(`{${key}}`, String(value));
      }
      return res;
    }) as any),
  };
});

jest.mock("../../../src/utils/database", () => ({
  getInteractionContext: jest.fn<any>().mockResolvedValue({ locale: "en" }),
}));

describe("ping command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("data", () => {
    it("should build the slash command with correct localizations", async () => {
      expect(pingCommand.data.name).toBe("ping");
      expect(pingCommand.data.description).toBe("Check the bot's latency");
    });
  });

  describe("execute", () => {
    it("should send a ping embed", async () => {
      const mockFetch = jest
        .fn()
        .mockImplementation(() => Promise.resolve({ ok: true } as Response));
      global.fetch = mockFetch as any;

      const interaction = {
        user: { id: "000000000000000000", username: "test-user" },
        deferReply: jest
          .fn<any>()
          .mockResolvedValue({ createdTimestamp: 1000 }),
        editReply: jest.fn(),
        createdTimestamp: 500,
        commandName: "ping",
      } as unknown as ChatInputCommandInteraction;

      const client = {
        user: {
          displayAvatarURL: jest
            .fn()
            .mockReturnValue("https://example.com/avatar.png"),
        },
        ws: { ping: 100 },
      } as unknown as ExtendedClient;

      await pingCommand.execute(interaction, client);
      expect(interaction.deferReply).toHaveBeenCalled();
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
        })
      );
    });

    it("should handle fetch failure correctly", async () => {
      const mockFetch = jest
        .fn()
        .mockImplementation(() => Promise.resolve({ ok: false } as Response));
      global.fetch = mockFetch as any;

      const interaction = {
        user: { id: "000000000000000000", username: "test-user" },
        deferReply: jest
          .fn<any>()
          .mockResolvedValue({ createdTimestamp: 1000 }),
        editReply: jest.fn(),
        createdTimestamp: 500,
        commandName: "ping",
      } as unknown as ChatInputCommandInteraction;

      const client = {
        user: {
          displayAvatarURL: jest
            .fn()
            .mockReturnValue("https://example.com/avatar.png"),
        },
        ws: { ping: 100 },
      } as unknown as ExtendedClient;

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await pingCommand.execute(interaction, client);

      expect(interaction.deferReply).toHaveBeenCalled();
      expect(interaction.editReply).toHaveBeenCalled();

      expect(console.error).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
