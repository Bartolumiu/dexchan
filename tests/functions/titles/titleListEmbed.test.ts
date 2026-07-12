import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import buildTitleListEmbed from "../../../src/functions/titles/titleListEmbed";
import { ProviderType } from "../../../src/constants/providers";

// --- Mocking Dependencies ---

jest.mock("../../../src/functions/tools/truncateString", () => ({
  __esModule: true,
  default: jest.fn((str: string, limit: number) => {
    if (!str) return ""; // allow empty strings to pass through for fallback testing
    return str.length > limit ? str.substring(0, limit - 3) + "..." : str;
  }),
}));

jest.mock("../../../src/functions/parsers/urlParser", () => ({
  urlFormats: {
    mangabaka: { primary: "https://mb.test/{id}/{title}" },
    mangadex: { primary: "https://md.test/{id}/{title}" },
    namicomi: { primary: "https://nc.test/{id}" },
  },
}));

describe("buildTitleListEmbed", () => {
  let mockEmbed: EmbedBuilder;

  const mockTranslations: any = {
    common: {
      words: { unknown: "Unknown Title" },
    },
    sources: {
      mangabaka: "MangaBaka",
      mangadex: "MangaDex",
      namicomi: "NamiComi",
    },
    utils: {
      title_list_embed: {
        title: "Search Results",
        description: "Found results for **{query}** on {source}.",
        view: "View on {source}",
        placeholder: "Select a title...",
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmbed = new EmbedBuilder();
  });

  describe("Early Returns & Edge Cases", () => {
    it("should return null if embed is missing", () => {
      const titles = new Map([["Title", "1"]]);
      expect(
        buildTitleListEmbed(
          null as any,
          mockTranslations,
          titles,
          "mangadex",
          "query"
        )
      ).toBeNull();
    });

    it("should return null if translations are missing", () => {
      const titles = new Map([["Title", "1"]]);
      expect(
        buildTitleListEmbed(mockEmbed, null as any, titles, "mangadex", "query")
      ).toBeNull();
    });

    it("should return null if titles map is missing or empty", () => {
      expect(
        buildTitleListEmbed(
          mockEmbed,
          mockTranslations,
          null as any,
          "mangadex",
          "query"
        )
      ).toBeNull();
      expect(
        buildTitleListEmbed(
          mockEmbed,
          mockTranslations,
          new Map(),
          "mangadex",
          "query"
        )
      ).toBeNull();
    });

    it("should return null if sourceName is undefined (unknown provider)", () => {
      const titles = new Map([["Title", "1"]]);
      expect(
        buildTitleListEmbed(
          mockEmbed,
          mockTranslations,
          titles,
          "unknown" as ProviderType,
          "query"
        )
      ).toBeNull();
    });
  });

  describe("Provider Implementations", () => {
    it("should build MangaBaka list embed correctly", () => {
      const titles = new Map([["Solo Leveling", "mb-123"]]);

      const actionRow = buildTitleListEmbed(
        mockEmbed,
        mockTranslations,
        titles,
        "mangabaka",
        "solo leveling"
      );

      // Verify Embed
      const embedData = mockEmbed.toJSON();
      expect(embedData.title).toBe("Search Results");
      expect(embedData.description).toBe(
        "Found results for **solo leveling** on MangaBaka."
      );
      expect(embedData.fields).toEqual([
        {
          name: "Solo Leveling",
          value: "[View on MangaBaka](https://mb.test/mb-123/)",
        },
      ]);

      // Verify Menu
      expect(actionRow).toBeInstanceOf(ActionRowBuilder);
      const menu = actionRow!.components[0] as StringSelectMenuBuilder;
      const menuData = menu.toJSON();
      expect(menuData.custom_id).toBe("search_select");
      expect(menuData.placeholder).toBe("Select a title...");
      expect(menuData.options).toEqual([
        { label: "Solo Leveling", value: "mangabaka:mb-123" },
      ]);
    });

    it("should build MangaDex list embed correctly", () => {
      const titles = new Map([["Naruto", "md-456"]]);

      buildTitleListEmbed(
        mockEmbed,
        mockTranslations,
        titles,
        "mangadex",
        "naruto"
      );

      const embedData = mockEmbed.toJSON();
      expect(embedData.fields).toEqual([
        {
          name: "Naruto",
          value: "[View on MangaDex](https://md.test/md-456/)",
        },
      ]);
    });

    it("should build NamiComi list embed correctly", () => {
      const titles = new Map([["Bleach", "nc-789"]]);

      buildTitleListEmbed(
        mockEmbed,
        mockTranslations,
        titles,
        "namicomi",
        "bleach"
      );

      const embedData = mockEmbed.toJSON();
      expect(embedData.fields).toEqual([
        {
          name: "Bleach",
          value: "[View on NamiComi](https://nc.test/nc-789)",
        },
      ]);
    });

    it("should fallback to unknown strings if title is empty", () => {
      // Create a map with an empty string key to force the `|| translations.unknown` branch
      const titles = new Map([["", "empty-1"]]);

      const actionRow = buildTitleListEmbed(
        mockEmbed,
        mockTranslations,
        titles,
        "mangadex",
        "test"
      );

      const embedData = mockEmbed.toJSON();
      expect(embedData.fields![0].name).toBe("Unknown Title"); // Embed Field Fallback

      const menu = actionRow!.components[0] as StringSelectMenuBuilder;
      const menuData = menu.toJSON();
      expect(menuData.options![0].label).toBe("Unknown Title"); // Menu Option Fallback
    });

    it("should return empty string for URL if type is somehow bypassed into getProviderUrl", () => {
      const titles = new Map([["Ghost Title", "ghost-1"]]);

      // Inject a fake source name to bypass the first check, forcing the switch to hit default
      const translationsWithGhost = {
        ...mockTranslations,
        sources: { ghost_type: "Ghost Source" },
      };

      buildTitleListEmbed(
        mockEmbed,
        translationsWithGhost,
        titles,
        "ghost_type" as any,
        "ghost"
      );

      const embedData = mockEmbed.toJSON();
      expect(embedData.fields![0].value).toBe("[View on Ghost Source]()"); // Empty URL returned by default branch
    });
  });
});
