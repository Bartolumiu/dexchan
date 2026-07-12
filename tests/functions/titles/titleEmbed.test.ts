import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import buildTitleEmbed from "../../../src/functions/titles/titleEmbed";
import getLocalizedTitle from "../../../src/functions/titles/localizedTitle";
import { getLocalizedDescription } from "../../../src/functions/titles/localizedDescription";
import { addTitleTags } from "../../../src/functions/titles/titleTags";
import { ProviderType } from "../../../src/constants/providers";

// --- Mocking Dependencies ---

jest.mock("../../../src/functions/titles/localizedTitle", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../src/functions/titles/localizedDescription", () => ({
  getLocalizedDescription: jest.fn(),
}));

jest.mock("../../../src/functions/tools/truncateString", () => ({
  __esModule: true,
  default: jest.fn((str) => str), // Pass-through
}));

jest.mock("../../../src/functions/tools/capitalizeFirstLetter", () => ({
  __esModule: true,
  capitalizeFirstLetter: jest.fn((str) => `[Caps] ${str}`), // Named export fix
}));

jest.mock("../../../src/functions/titles/titleTags", () => ({
  addTitleTags: jest.fn(),
}));

jest.mock("../../../src/functions/parsers/urlParser", () => ({
  urlFormats: {
    mangabaka: { primary: "https://mb.test/{id}/{title}" },
    mangadex: { primary: "https://md.test/{id}/{title}" },
    namicomi: { shortened: "https://nc.test/{id}" },
  },
}));

// Blind mock for discord.js classes and enums
jest.mock("discord.js", () => {
  class MockEmbedBuilder {
    setTitle = jest.fn().mockReturnThis();
    setURL = jest.fn().mockReturnThis();
    setDescription = jest.fn().mockReturnThis();
    addFields = jest.fn().mockReturnThis();
    setColor = jest.fn().mockReturnThis();
  }

  class MockActionRowBuilder {
    addComponents = jest.fn().mockReturnThis();
  }

  class MockButtonBuilder {
    setLabel = jest.fn().mockReturnThis();
    setURL = jest.fn().mockReturnThis();
    setStyle = jest.fn().mockReturnThis();
    setCustomId = jest.fn().mockReturnThis();
    setEmoji = jest.fn().mockReturnThis();
    setDisabled = jest.fn().mockReturnThis();
  }

  return {
    EmbedBuilder: MockEmbedBuilder,
    ActionRowBuilder: MockActionRowBuilder,
    ButtonBuilder: MockButtonBuilder,
    Colors: { Blurple: "Blurple" },
    ButtonStyle: { Link: 1, Secondary: 2 },
  };
});

describe("buildTitleEmbed", () => {
  let mockEmbed: any;

  const mockTranslations: any = {
    common: {
      words: {
        unknown: "Unknown Title Fallback",
      },
    },
    sources: {
      mangabaka: "MangaBaka",
      mangadex: "MangaDex",
      namicomi: "NamiComi",
    },
    utils: {
      title_embed: {
        description: { no_description: "No Description Fallback" },
        fields: {
          rating: "Rating",
          follows: "Follows",
          year: "Year",
          pub_status: {
            name: "Status",
            value: { ongoing: "Ongoing Localized" },
          },
          demographic: {
            name: "Demo",
            value: { shounen: "Shounen Localized" },
          },
          content_rating: {
            name: "Content",
            value: { safe: "Safe Localized" },
          },
          type: { name: "Type", value: { manga: "Manga Localized" } },
          reading_mode: {
            name: "Reading Mode",
            value: {
              vertical: "Vertical",
              horizontal: { right_to_left: "RTL", left_to_right: "LTR" },
            },
          },
        },
        button: { open: "Open {source}", stats: "Stats" },
      },
      title_tags: {},
    },
  };

  const mockStats: any = {
    title: {
      rating: { average: "8.50", bayesian: "8.20" },
      follows: 100,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmbed = new (require("discord.js").EmbedBuilder)();
  });

  describe("General Routing", () => {
    it("should return null for an unknown provider type", () => {
      const result = buildTitleEmbed(
        mockEmbed,
        "en",
        {},
        mockStats,
        mockTranslations,
        "unknown" as ProviderType
      );
      expect(result).toBeNull();
    });
  });

  describe("MangaBaka Provider", () => {
    it("should build embed with full data and valid stats", () => {
      (getLocalizedTitle as jest.Mock).mockReturnValue("MB Title");

      const title = {
        id: "mb-1",
        description: "Valid description",
        year: 2023,
        status: "ongoing",
        content_rating: "safe",
      };

      const actionRow = buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "mangabaka"
      );

      expect(mockEmbed.setTitle).toHaveBeenCalledWith("MB Title");
      expect(mockEmbed.setURL).toHaveBeenCalledWith("https://mb.test/mb-1/");
      expect(mockEmbed.setDescription).toHaveBeenCalledWith(
        "Valid description"
      );

      const addFieldsCall = mockEmbed.addFields.mock.calls[0][0];
      expect(addFieldsCall).toEqual([
        { name: "Rating", value: "8.50/100.00", inline: true },
        { name: "Follows", value: "N/A", inline: true },
        { name: "Year", value: "2023", inline: true },
        { name: "Status", value: "[Caps] Ongoing Localized", inline: true },
        { name: "Demo", value: "N/A", inline: true },
        { name: "Content", value: "[Caps] Safe Localized", inline: true },
      ]);

      expect(addTitleTags).toHaveBeenCalledWith(
        title,
        mockEmbed,
        expect.anything(),
        "mangabaka",
        "en"
      );

      const button1 = (actionRow as any).addComponents.mock.calls[0][0];
      const button2 = (actionRow as any).addComponents.mock.calls[0][1];
      expect(button1.setLabel).toHaveBeenCalledWith("Open MangaBaka");
      expect(button2.setDisabled).toHaveBeenCalledWith(true);
    });

    it("should handle missing data, fallbacks, and 0.00 average rating", () => {
      (getLocalizedTitle as jest.Mock).mockReturnValue(null);

      const title = {
        id: "mb-2",
        description: null,
        year: null,
        status: "unknown_status",
        content_rating: null,
      };

      const noRatingStats = { title: { rating: { average: "0.00" } } };

      buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        noRatingStats as any,
        mockTranslations,
        "mangabaka"
      );

      expect(mockEmbed.setTitle).toHaveBeenCalledWith("Unknown Title Fallback");
      expect(mockEmbed.setDescription).toHaveBeenCalledWith(
        "No Description Fallback"
      );

      const addFieldsCall = mockEmbed.addFields.mock.calls[0][0];
      expect(addFieldsCall).toEqual(
        expect.arrayContaining([
          { name: "Rating", value: "N/A", inline: true },
          { name: "Year", value: "N/A", inline: true },
          { name: "Status", value: "[Caps] unknown_status", inline: true },
          { name: "Content", value: "[Caps] N/A", inline: true },
        ])
      );
    });

    it("should sanitize nasty descriptions correctly (HTML, breaks, entities)", () => {
      const title = {
        id: "mb-3",
        description: `&quot;&#39;/&apos;&nbsp; & <br><br/><br /> <b>bold</b> \n\n\n \t\t spaces`,
      };

      buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "mangabaka"
      );

      const descriptionSet = mockEmbed.setDescription.mock.calls[0][0];
      expect(descriptionSet).toBe(
        `"'' &amp; \n &lt;b&gt;bold&lt;/b&gt; \n spaces`
      );
    });

    it("should return null from sanitizeDescription if description is a number (invalid type)", () => {
      const title = { id: "mb-4", description: 12345 };
      buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "mangabaka"
      );
      expect(mockEmbed.setDescription).toHaveBeenCalledWith(
        "No Description Fallback"
      );
    });
  });

  describe("MangaDex Provider", () => {
    it("should build embed with full data", () => {
      (getLocalizedTitle as jest.Mock).mockReturnValue("MD Title");
      (getLocalizedDescription as jest.Mock).mockReturnValue("MD Desc");

      const title = {
        id: "md-1",
        attributes: {
          year: 2021,
          status: "ongoing",
          publicationDemographic: "shounen",
          contentRating: "safe",
        },
      };

      const actionRow = buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "mangadex"
      );

      expect(mockEmbed.setTitle).toHaveBeenCalledWith("MD Title");
      expect(mockEmbed.setURL).toHaveBeenCalledWith("https://md.test/md-1/");
      expect(mockEmbed.setDescription).toHaveBeenCalledWith("MD Desc");

      const addFieldsCall = mockEmbed.addFields.mock.calls[0][0];
      expect(addFieldsCall).toEqual([
        { name: "Rating", value: "8.20/10.00", inline: true },
        { name: "Follows", value: "100", inline: true },
        { name: "Year", value: "2021", inline: true },
        { name: "Status", value: "[Caps] Ongoing Localized", inline: true },
        { name: "Demo", value: "[Caps] Shounen Localized", inline: true },
        { name: "Content", value: "[Caps] Safe Localized", inline: true },
      ]);

      const button2 = (actionRow as any).addComponents.mock.calls[0][1];
      expect(button2.setCustomId).toHaveBeenCalledWith(
        "mangadex_title_stats_md-1"
      );
    });

    it("should handle completely missing attributes safely", () => {
      (getLocalizedTitle as jest.Mock).mockReturnValue(null);
      (getLocalizedDescription as jest.Mock).mockReturnValue(null);

      const title = { id: "md-2" };

      buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "mangadex"
      );

      const addFieldsCall = mockEmbed.addFields.mock.calls[0][0];
      expect(addFieldsCall).toEqual(
        expect.arrayContaining([
          { name: "Year", value: "N/A", inline: true },
          { name: "Status", value: "[Caps] N/A", inline: true },
          { name: "Demo", value: "N/A", inline: true },
          { name: "Content", value: "[Caps] N/A", inline: true },
        ])
      );
    });

    it("should fallback to raw demographic if not found in translations", () => {
      (getLocalizedTitle as jest.Mock).mockReturnValue("MD Title");

      const title = {
        id: "md-3",
        attributes: {
          publicationDemographic: "seinen",
        },
      };

      buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "mangadex"
      );

      const addFieldsCall = mockEmbed.addFields.mock.calls[0][0];
      expect(addFieldsCall).toContainEqual({
        name: "Demo",
        value: "[Caps] seinen",
        inline: true,
      });
    });
  });

  describe("NamiComi Provider", () => {
    it("should build embed with full data and readingMode = vls", () => {
      (getLocalizedTitle as jest.Mock).mockReturnValue("NC Title");
      (getLocalizedDescription as jest.Mock).mockReturnValue("NC Desc");

      const title = {
        id: "nc-1",
        attributes: {
          year: 2022,
          publicationStatus: "ongoing",
          demographic: "shounen",
          contentRating: "safe",
          type: "manga",
          readingMode: "vls",
        },
      };

      buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "namicomi"
      );

      expect(mockEmbed.setURL).toHaveBeenCalledWith("https://nc.test/nc-1");

      const addFieldsCall = mockEmbed.addFields.mock.calls[0][0];
      expect(addFieldsCall).toContainEqual({
        name: "Status",
        value: "[Caps] Ongoing Localized",
        inline: true,
      });
      expect(addFieldsCall).toContainEqual({
        name: "Type",
        value: "[Caps] Manga Localized",
        inline: true,
      });

      expect(mockEmbed.addFields).toHaveBeenCalledWith({
        name: "Reading Mode",
        value: "Vertical",
      });
    });

    it("should handle readingMode = rtl", () => {
      const title = {
        id: "nc-2",
        attributes: { readingMode: "rtl" },
      };
      buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "namicomi"
      );
      expect(mockEmbed.addFields).toHaveBeenCalledWith({
        name: "Reading Mode",
        value: "RTL",
      });
    });

    it("should handle readingMode = ltr", () => {
      const title = {
        id: "nc-3",
        attributes: { readingMode: "ltr" },
      };
      buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "namicomi"
      );
      expect(mockEmbed.addFields).toHaveBeenCalledWith({
        name: "Reading Mode",
        value: "LTR",
      });
    });

    it("should handle missing readingMode and missing attributes", () => {
      const title = { id: "nc-4" };
      buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "namicomi"
      );

      expect(mockEmbed.addFields).toHaveBeenCalledTimes(1);
    });

    it("should handle missing data, fallbacks, and unknown demographics", () => {
      (getLocalizedTitle as jest.Mock).mockReturnValue(null);
      (getLocalizedDescription as jest.Mock).mockReturnValue(null);

      const title = {
        id: "nc-5",
        attributes: {
          demographic: "josei",
        },
      };

      buildTitleEmbed(
        mockEmbed,
        "en",
        title,
        mockStats,
        mockTranslations,
        "namicomi"
      );

      expect(mockEmbed.setTitle).toHaveBeenCalledWith("Unknown Title Fallback");
      expect(mockEmbed.setDescription).toHaveBeenCalledWith(
        "No Description Fallback"
      );

      const addFieldsCall = mockEmbed.addFields.mock.calls[0][0];
      expect(addFieldsCall).toContainEqual({
        name: "Demo",
        value: "[Caps] josei",
        inline: true,
      });
    });
  });
});
