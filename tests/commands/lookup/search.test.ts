import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import searchCommand from "../../../src/commands/lookup/search";
import { getInteractionContext } from "../../../src/utils/database";
import { getTranslations } from "../../../src/functions/handlers/handleLocales";
import { sendErrorEmbed } from "../../../src/functions/titles/errorEmbed";
import search from "../../../src/functions/titles/titleSearch";
import buildTitleListEmbed from "../../../src/functions/titles/titleListEmbed";
import { checkID, parseUrl } from "../../../src/functions/parsers/urlParser";
import getTitleDetails from "../../../src/functions/titles/titleDetails";
import getTitleStats from "../../../src/functions/titles/titleStats";
import buildTitleEmbed from "../../../src/functions/titles/titleEmbed";
import setImages from "../../../src/functions/titles/setImages";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";

// --- Mocking Dependencies ---

jest.mock("../../../src/utils/database", () => ({
  getInteractionContext: jest.fn(),
}));

jest.mock("../../../src/functions/handlers/handleLocales", () => ({
  format: jest.fn((str, vars: any) => `FORMATTED_${str}_${vars.commandName}`),
  getTranslations: jest.fn(),
  translateAttribute: jest.fn((cb: any) => {
    cb({
      commands: {
        search: {
          description: "desc",
          options: {
            source: { description: "desc" },
            query: "q",
            id: "id",
            url: "u",
          },
        },
      },
    });
    return { es: "busqueda" };
  }),
}));

jest.mock("../../../src/functions/titles/errorEmbed", () => ({
  sendErrorEmbed: jest.fn(),
}));

jest.mock("../../../src/functions/titles/titleSearch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../src/functions/titles/titleListEmbed", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../src/functions/parsers/urlParser", () => ({
  checkID: jest.fn(),
  parseUrl: jest.fn(),
}));

jest.mock("../../../src/functions/titles/titleDetails", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../src/functions/titles/titleStats", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../src/functions/titles/titleEmbed", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../src/functions/titles/setImages", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("discord.js", () => {
  class MockEmbedBuilder {
    setFooter = jest.fn().mockReturnThis();
  }

  class MockSlashCommandBuilder {
    setName = jest.fn().mockReturnThis();
    setDescription = jest.fn().mockReturnThis();
    setDescriptionLocalizations = jest.fn().mockReturnThis();

    addStringOption = jest.fn(function (this: any, cb: any) {
      const mockOption = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setDescriptionLocalizations: jest.fn().mockReturnThis(),
        setAutocomplete: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis(),
      };
      if (cb) cb(mockOption);
      return this; // Return the builder instance for chaining
    });
  }

  return {
    EmbedBuilder: MockEmbedBuilder,
    SlashCommandBuilder: MockSlashCommandBuilder,
  };
});

describe("search command", () => {
  let mockInteraction: any;
  let mockClient: any;
  let mockOptionsData: Record<string, string | null>;

  const mockTranslationsBase = {
    sources: { mangadex: "MangaDex" },
    error_embed: { title: "Error Title" },
    common: {
      footers: { command: "Footer" },
      words: { error: "Error" },
    },
    commands: {
      search: {
        errors: { command_disabled: false },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockOptionsData = {
      source: "mangadex",
      query: null,
      id: null,
      url: null,
    };

    mockInteraction = {
      commandName: "search",
      user: { username: "TestUser" },
      deferred: false,
      replied: false,
      deferReply: jest.fn<any>().mockResolvedValue(true),
      editReply: jest.fn<any>().mockResolvedValue(true),
      respond: jest.fn<any>().mockResolvedValue(true),
      options: {
        getString: jest.fn((name: string) => mockOptionsData[name]),
      },
    };

    mockClient = {
      user: {
        displayAvatarURL: jest.fn().mockReturnValue("https://avatar/img.png"),
      },
    };

    (getInteractionContext as jest.Mock<any>).mockResolvedValue({
      locale: "en",
      sources: ["mangadex", "missing_src"],
    });

    (getTranslations as jest.Mock).mockReturnValue(
      JSON.parse(JSON.stringify(mockTranslationsBase)) // Deep clone for isolation
    );
  });

  describe("execute", () => {
    it("should defer reply if not deferred or replied", async () => {
      await searchCommand.execute(
        mockInteraction as ChatInputCommandInteraction,
        mockClient as ExtendedClient
      );
      expect(mockInteraction.deferReply).toHaveBeenCalled();
    });

    it("should safely handle undefined client.user", async () => {
      mockClient.user = undefined; // Force optional chaining branch
      mockOptionsData.source = null; // Fast exit to check embed payload
      await searchCommand.execute(
        mockInteraction as ChatInputCommandInteraction,
        mockClient as ExtendedClient
      );

      // Grab the embed instance that was passed to sendErrorEmbed
      const passedEmbed = (sendErrorEmbed as jest.Mock<any>).mock
        .calls[0][3] as any;
      const setFooterArgs = passedEmbed.setFooter.mock.calls[0][0];

      expect(setFooterArgs.iconURL).toBeUndefined();
    });

    it("should skip deferReply if already deferred", async () => {
      mockInteraction.deferred = true;
      await searchCommand.execute(
        mockInteraction as ChatInputCommandInteraction,
        mockClient as ExtendedClient
      );
      expect(mockInteraction.deferReply).not.toHaveBeenCalled();
    });

    it("should send error 'no_source' if source is missing (command_disabled = false)", async () => {
      mockOptionsData.source = null;
      await searchCommand.execute(
        mockInteraction as ChatInputCommandInteraction,
        mockClient as ExtendedClient
      );

      expect(sendErrorEmbed).toHaveBeenCalledWith(
        mockInteraction,
        expect.anything(),
        "Error", // Ternary false branch
        expect.anything(),
        "no_source"
      );
    });

    it("should send error 'no_source' if source is missing (command_disabled = true)", async () => {
      mockOptionsData.source = null;
      const t = JSON.parse(JSON.stringify(mockTranslationsBase));
      t.commands.search.errors.command_disabled = true;
      (getTranslations as jest.Mock).mockReturnValue(t);

      await searchCommand.execute(
        mockInteraction as ChatInputCommandInteraction,
        mockClient as ExtendedClient
      );

      expect(sendErrorEmbed).toHaveBeenCalledWith(
        mockInteraction,
        expect.anything(),
        "Error Title", // Ternary true branch
        expect.anything(),
        "no_source"
      );
    });

    it("should send error 'invalid_source' if source is not in context.sources", async () => {
      mockOptionsData.source = "invalid_src";
      await searchCommand.execute(
        mockInteraction as ChatInputCommandInteraction,
        mockClient as ExtendedClient
      );

      expect(sendErrorEmbed).toHaveBeenCalledWith(
        mockInteraction,
        expect.anything(),
        "Error Title",
        expect.anything(),
        "invalid_source",
        { source: "invalid_src" }
      );
    });

    it("should send error 'empty' if query, id, and url are all missing", async () => {
      await searchCommand.execute(
        mockInteraction as ChatInputCommandInteraction,
        mockClient as ExtendedClient
      );
      expect(sendErrorEmbed).toHaveBeenCalledWith(
        mockInteraction,
        expect.anything(),
        "Error Title",
        expect.anything(),
        "empty"
      );
    });

    describe("Query Mode", () => {
      beforeEach(() => {
        mockOptionsData.query = "solo leveling";
      });

      it("should send error 'no_results' if search returns null", async () => {
        (search as jest.Mock<any>).mockResolvedValue(null);
        await searchCommand.execute(
          mockInteraction as ChatInputCommandInteraction,
          mockClient as ExtendedClient
        );

        expect(sendErrorEmbed).toHaveBeenCalledWith(
          mockInteraction,
          expect.anything(),
          "Error Title",
          expect.anything(),
          "no_results"
        );
      });

      it("should editReply with row if buildTitleListEmbed returns a row", async () => {
        const mockRow = { type: 1 };
        (search as jest.Mock<any>).mockResolvedValue(new Map([["Title", "1"]]));
        (buildTitleListEmbed as jest.Mock).mockReturnValue(mockRow);

        await searchCommand.execute(
          mockInteraction as ChatInputCommandInteraction,
          mockClient as ExtendedClient
        );

        expect(mockInteraction.editReply).toHaveBeenCalledWith({
          embeds: [expect.anything()],
          components: [mockRow],
        });
      });

      it("should editReply with empty components if buildTitleListEmbed returns null", async () => {
        (search as jest.Mock<any>).mockResolvedValue(new Map([["Title", "1"]]));
        (buildTitleListEmbed as jest.Mock).mockReturnValue(null);

        await searchCommand.execute(
          mockInteraction as ChatInputCommandInteraction,
          mockClient as ExtendedClient
        );

        expect(mockInteraction.editReply).toHaveBeenCalledWith({
          embeds: [expect.anything()],
          components: [],
        });
      });
    });

    describe("ID/URL Mode", () => {
      it("should parse url if id is missing", async () => {
        mockOptionsData.url = "https://example.com/title/123";
        (parseUrl as jest.Mock).mockReturnValue("parsed-123");
        (checkID as jest.Mock).mockReturnValue(false);

        await searchCommand.execute(
          mockInteraction as ChatInputCommandInteraction,
          mockClient as ExtendedClient
        );
        expect(parseUrl).toHaveBeenCalledWith(
          "https://example.com/title/123",
          "mangadex"
        );
        expect(checkID).toHaveBeenCalledWith("parsed-123", "mangadex");
      });

      it("should send error 'invalid_id' if checkID fails", async () => {
        mockOptionsData.id = "bad-id";
        (checkID as jest.Mock).mockReturnValue(false);

        await searchCommand.execute(
          mockInteraction as ChatInputCommandInteraction,
          mockClient as ExtendedClient
        );
        expect(sendErrorEmbed).toHaveBeenCalledWith(
          mockInteraction,
          expect.anything(),
          "Error Title",
          expect.anything(),
          "invalid_id"
        );
      });

      it("should send error 'invalid_id' if getTitleDetails or getTitleStats returns null", async () => {
        mockOptionsData.id = "valid-id";
        (checkID as jest.Mock).mockReturnValue(true);
        (getTitleDetails as jest.Mock<any>).mockResolvedValue(null);
        (getTitleStats as jest.Mock<any>).mockResolvedValue({ stats: true });

        await searchCommand.execute(
          mockInteraction as ChatInputCommandInteraction,
          mockClient as ExtendedClient
        );
        expect(sendErrorEmbed).toHaveBeenCalledWith(
          mockInteraction,
          expect.anything(),
          "Error Title",
          expect.anything(),
          "invalid_id"
        );
      });

      it("should editReply with buttons and files on complete success", async () => {
        mockOptionsData.id = "valid-id";
        (checkID as jest.Mock).mockReturnValue(true);
        (getTitleDetails as jest.Mock<any>).mockResolvedValue({ entry: true });
        (getTitleStats as jest.Mock<any>).mockResolvedValue({ stats: true });
        (buildTitleEmbed as jest.Mock).mockReturnValue({ type: "buttons" });
        (setImages as jest.Mock<any>).mockResolvedValue([
          { attachment: "file.png" },
        ]);

        await searchCommand.execute(
          mockInteraction as ChatInputCommandInteraction,
          mockClient as ExtendedClient
        );

        expect(mockInteraction.editReply).toHaveBeenCalledWith({
          embeds: [expect.anything()],
          files: [{ attachment: "file.png" }],
          components: [{ type: "buttons" }],
        });
      });

      it("should editReply with empty components if buildTitleEmbed returns null", async () => {
        mockOptionsData.id = "valid-id";
        (checkID as jest.Mock).mockReturnValue(true);
        (getTitleDetails as jest.Mock<any>).mockResolvedValue({ entry: true });
        (getTitleStats as jest.Mock<any>).mockResolvedValue({ stats: true });
        (buildTitleEmbed as jest.Mock).mockReturnValue(null);
        (setImages as jest.Mock<any>).mockResolvedValue([]);

        await searchCommand.execute(
          mockInteraction as ChatInputCommandInteraction,
          mockClient as ExtendedClient
        );

        expect(mockInteraction.editReply).toHaveBeenCalledWith({
          embeds: [expect.anything()],
          files: [],
          components: [],
        });
      });
    });
  });

  describe("autocomplete", () => {
    it("should respond with all enabled sources if input is empty", async () => {
      mockOptionsData.source = null;
      await searchCommand.autocomplete!(
        mockInteraction as AutocompleteInteraction,
        mockClient as ExtendedClient
      );

      expect(mockInteraction.respond).toHaveBeenCalledWith([
        { name: "MangaDex", value: "mangadex" },
        { name: "missing_src", value: "missing_src" },
      ]);
    });

    it("should respond with limited array capped at 25 if necessary", async () => {
      mockOptionsData.source = null;
      const massiveSources = Array.from({ length: 30 }, (_, i) => `src_${i}`);
      (getInteractionContext as jest.Mock<any>).mockResolvedValue({
        locale: "en",
        sources: massiveSources,
      });

      await searchCommand.autocomplete!(
        mockInteraction as AutocompleteInteraction,
        mockClient as ExtendedClient
      );

      const responseArg = mockInteraction.respond.mock.calls[0][0];
      expect(responseArg.length).toBe(25);
    });

    it("should filter correctly based on input string (case-insensitive name match)", async () => {
      mockOptionsData.source = "Dex";
      await searchCommand.autocomplete!(
        mockInteraction as AutocompleteInteraction,
        mockClient as ExtendedClient
      );

      expect(mockInteraction.respond).toHaveBeenCalledWith([
        { name: "MangaDex", value: "mangadex" },
      ]);
    });

    it("should filter correctly based on input string (case-insensitive value match)", async () => {
      mockOptionsData.source = "miss";
      await searchCommand.autocomplete!(
        mockInteraction as AutocompleteInteraction,
        mockClient as ExtendedClient
      );

      expect(mockInteraction.respond).toHaveBeenCalledWith([
        { name: "missing_src", value: "missing_src" },
      ]);
    });

    it("should respond with empty array if filtered yields no results", async () => {
      mockOptionsData.source = "nothingmatches";
      await searchCommand.autocomplete!(
        mockInteraction as AutocompleteInteraction,
        mockClient as ExtendedClient
      );

      expect(mockInteraction.respond).toHaveBeenCalledWith([]);
    });
  });
});
