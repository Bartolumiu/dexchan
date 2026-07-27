import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MessageFlags } from "discord.js";
import titleStatsButton from "../../../src/components/buttons/title_stats";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";
import getTitleStats from "../../../src/functions/titles/titleStats";

// Mock dependencies
jest.mock("../../../src/functions/titles/titleStats", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../src/utils/database", () => ({
  getInteractionContext: jest.fn<any>().mockResolvedValue({ locale: "en" }),
}));

jest.mock("../../../src/functions/handlers/handleLocales", () => ({
  format: jest.fn(
    (text: string, replacements: Record<string, string | number>) =>
      Object.entries(replacements).reduce(
        (str, [key, val]) => str.replace(`{${key}}`, String(val)),
        text
      )
  ),
  getTranslations: jest.fn().mockReturnValue({
    sources: { mangadex: "MangaDex", namicomi: "NamiComi" },
    common: {
      words: { error: "Error" },
      errors: { api_failure: "API failed to fetch stats" },
      footers: { stats: "Requested by {user}" },
    },
    components: {
      title_stats: {
        response: {
          title: "Stats",
          description: "ID: {titleId} Source: {source}",
          units: { votes: "votes" },
          fields: {
            average: "Average",
            bayesian: "Bayesian",
            follows: "Follows",
            distribution: "Distribution",
            comments: "Comments",
            rating: "Rating",
            views: "Views",
            chapter_views: "Chapter Views",
            chapter_comments: "Chapter Comments",
            chapter_reactions: "Chapter Reactions",
          },
          buttons: {
            mangadex: {
              forum: { open: "Open Forum", no_thread: "No Thread" },
            },
            namicomi: {
              open: "Open on NamiComi",
            },
          },
        },
      },
    },
  }),
}));

describe("title_stats button", () => {
  let client: ExtendedClient;
  let mockInteraction: any;

  beforeEach(() => {
    jest.clearAllMocks();

    client = {
      user: { avatarURL: () => "http://avatar.url" },
    } as unknown as ExtendedClient;

    mockInteraction = {
      update: jest.fn<any>().mockResolvedValue(undefined),
      followUp: jest.fn<any>().mockResolvedValue(undefined),
      user: { username: "TestUser" },
      customId: "mangadex_title_stats_12345",
      message: {
        components: [],
      },
    };
  });

  it("should disable the clicked button and rebuild rows from message components", async () => {
    const stats = {
      title: {
        rating: { average: 7, bayesian: 6.8, count: 10, distribution: {} },
        follows: 20,
        comments: { repliesCount: 3 },
      },
    };
    (getTitleStats as jest.Mock<any>).mockResolvedValue(stats);

    mockInteraction.customId = "mangadex_title_stats_999";
    mockInteraction.message.components = [
      {
        type: 1, // ActionRow
        components: [
          {
            type: 2, // Button
            style: 1,
            custom_id: "mangadex_title_stats_999",
            customId: "mangadex_title_stats_999",
            label: "Stats",
          },
          {
            type: 2, // Button
            style: 2,
            custom_id: "other_button",
            customId: "other_button",
            label: "Other",
          },
        ],
      },
    ];

    await titleStatsButton.execute(mockInteraction, client);

    expect(mockInteraction.update).toHaveBeenCalled();
    const updatedComponents =
      mockInteraction.update.mock.calls[0][0].components;
    expect(updatedComponents).toHaveLength(1);
    expect(updatedComponents[0].components).toHaveLength(2);
    expect(updatedComponents[0].components[0].data.custom_id).toBe(
      "mangadex_title_stats_999"
    );
    expect(updatedComponents[0].components[0].data.disabled).toBe(true);
    expect(updatedComponents[0].components[1].data.disabled).toBeUndefined();
  });

  it("should preserve non-button components in a row while only disabling the matching button", async () => {
    const stats = {
      title: {
        rating: { average: 7, bayesian: 6.8, count: 10, distribution: {} },
        follows: 20,
        comments: { repliesCount: 3 },
      },
    };
    (getTitleStats as jest.Mock<any>).mockResolvedValue(stats);

    mockInteraction.customId = "mangadex_title_stats_999";
    mockInteraction.message.components = [
      {
        type: 1,
        components: [
          {
            type: 3, // SelectMenu, not Button
            custom_id: "select_menu",
            customId: "select_menu",
            options: [],
          },
          {
            type: 2, // Button
            style: 1,
            custom_id: "mangadex_title_stats_999",
            customId: "mangadex_title_stats_999",
            label: "Stats",
          },
        ],
      },
    ];

    await titleStatsButton.execute(mockInteraction, client);

    const updatedComponents =
      mockInteraction.update.mock.calls[0][0].components;
    expect(updatedComponents).toHaveLength(1);
    expect(updatedComponents[0].components).toHaveLength(2);
    expect(updatedComponents[0].components[0].data.custom_id).toBe(
      "select_menu"
    );
    expect(updatedComponents[0].components[0].data.disabled).toBeUndefined();
    expect(updatedComponents[0].components[1].data.custom_id).toBe(
      "mangadex_title_stats_999"
    );
    expect(updatedComponents[0].components[1].data.disabled).toBe(true);
  });

  it("should preserve an action row that has no matching button untouched", async () => {
    const stats = {
      title: {
        rating: { average: 7, bayesian: 6.8, count: 10, distribution: {} },
        follows: 20,
        comments: { repliesCount: 3 },
      },
    };
    (getTitleStats as jest.Mock<any>).mockResolvedValue(stats);

    mockInteraction.customId = "mangadex_title_stats_999";
    mockInteraction.message.components = [
      {
        type: 1,
        components: [
          {
            type: 3, // SelectMenu, not Button
            custom_id: "select_menu",
            customId: "select_menu",
            options: [],
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2, // Button
            style: 1,
            custom_id: "mangadex_title_stats_999",
            customId: "mangadex_title_stats_999",
            label: "Stats",
          },
        ],
      },
    ];

    await titleStatsButton.execute(mockInteraction, client);

    const updatedComponents =
      mockInteraction.update.mock.calls[0][0].components;
    expect(updatedComponents).toHaveLength(2);
    expect(updatedComponents[0].components).toHaveLength(1);
    expect(updatedComponents[0].components[0].data.custom_id).toBe(
      "select_menu"
    );
    expect(updatedComponents[1].components[0].data.custom_id).toBe(
      "mangadex_title_stats_999"
    );
    expect(updatedComponents[1].components[0].data.disabled).toBe(true);
  });

  it("should pass through non-ActionRow top-level components unchanged", async () => {
    const stats = {
      title: {
        rating: { average: 7, bayesian: 6.8, count: 10, distribution: {} },
        follows: 20,
        comments: { repliesCount: 3 },
      },
    };
    (getTitleStats as jest.Mock<any>).mockResolvedValue(stats);

    mockInteraction.customId = "mangadex_title_stats_999";
    const textDisplay = { type: 10, content: "Hello" };
    mockInteraction.message.components = [
      textDisplay,
      {
        type: 1,
        components: [
          {
            type: 2, // Button
            style: 1,
            custom_id: "mangadex_title_stats_999",
            customId: "mangadex_title_stats_999",
            label: "Stats",
          },
        ],
      },
    ];

    await titleStatsButton.execute(mockInteraction, client);

    const updatedComponents =
      mockInteraction.update.mock.calls[0][0].components;
    expect(updatedComponents[0]).toBe(textDisplay);
    expect(updatedComponents[1].components[0].data.disabled).toBe(true);
  });

  it("should have correct regex customId data", () => {
    expect(titleStatsButton.data.customId).toEqual(/_title_stats_/);
  });

  it("should return null immediately if customId does not match the regex structure", async () => {
    mockInteraction.customId = "invalid_button_id";
    const result = await titleStatsButton.execute(mockInteraction, client);
    expect(result).toBeNull();
    expect(getTitleStats).not.toHaveBeenCalled();
  });

  it("should send an ephemeral error embed if stats are not found", async () => {
    (getTitleStats as jest.Mock<any>).mockResolvedValue(null);

    await titleStatsButton.execute(mockInteraction, client);

    expect(mockInteraction.followUp).toHaveBeenCalledWith(
      expect.objectContaining({
        flags: [MessageFlags.Ephemeral],
      })
    );
    const followUpCall = mockInteraction.followUp.mock.calls[0][0];
    expect(followUpCall.embeds[0].data.title).toBe("Error");
  });

  it("should fallback to undefined footer iconURL in error embed if avatarURL is null", async () => {
    (getTitleStats as jest.Mock<any>).mockResolvedValue(null);
    client.user!.avatarURL = () => null;

    await titleStatsButton.execute(mockInteraction, client);

    const followUpCall = mockInteraction.followUp.mock.calls[0][0];
    expect(followUpCall.embeds[0].data.footer.icon_url).toBeUndefined();
  });

  describe("MangaDex Provider", () => {
    const mockMangaDexStats = {
      title: {
        rating: {
          average: 8.5,
          bayesian: 8.2,
          count: 100,
          distribution: {
            "10": 50,
            "9": 0,
            "8": 50,
          },
        },
        follows: 500,
        comments: { threadId: 987, repliesCount: 12 },
      },
    };

    it("should build MangaDex embed and action buttons (with thread)", async () => {
      (getTitleStats as jest.Mock<any>).mockResolvedValue(mockMangaDexStats);
      mockInteraction.customId = "mangadex_title_stats_123";

      await titleStatsButton.execute(mockInteraction, client);

      const followUpArgs = mockInteraction.followUp.mock.calls[0][0];
      const embed = followUpArgs.embeds[0];
      const components = followUpArgs.components[0];

      expect(embed.data.description).toContain("ID: 123 Source: MangaDex");
      expect(embed.data.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ value: "8.5/10.00 (100 votes)" }),
          expect.objectContaining({ value: "8.2/10.00" }),
          expect.objectContaining({ value: "500" }),
          expect.objectContaining({ value: "12" }),
        ])
      );

      const distributionField = embed.data.fields.find(
        (f: any) => f.name === "Distribution"
      );
      expect(distributionField.value).toContain("10/10: `50` · (50.00%)");
      expect(distributionField.value).not.toContain("9/10");

      expect(components.components[0].data.label).toBe("Open Forum");
      expect(components.components[0].data.url).toBe(
        "https://forums.mangadex.org/threads/987"
      );
    });

    it("should disable MangaDex forum button if threadId is missing", async () => {
      const statsNoThread = {
        title: {
          rating: { distribution: {}, count: 0 },
          follows: 0,
          comments: { repliesCount: 0 },
        },
      };
      (getTitleStats as jest.Mock<any>).mockResolvedValue(statsNoThread);
      mockInteraction.customId = "mangadex_title_stats_123";

      await titleStatsButton.execute(mockInteraction, client);

      const components =
        mockInteraction.followUp.mock.calls[0][0].components[0];
      expect(components.components[0].data.disabled).toBe(true);
      expect(components.components[0].data.label).toBe("No Thread");
    });

    it("should output 'N/A' for MangaDex distribution if all counts are 0", async () => {
      const statsEmptyDist = {
        title: {
          rating: { distribution: { "10": 0 }, count: 0 },
          follows: 0,
          comments: { repliesCount: 0 },
        },
      };
      (getTitleStats as jest.Mock<any>).mockResolvedValue(statsEmptyDist);
      mockInteraction.customId = "mangadex_title_stats_123";

      await titleStatsButton.execute(mockInteraction, client);

      const embed = mockInteraction.followUp.mock.calls[0][0].embeds[0];
      const distributionField = embed.data.fields.find(
        (f: any) => f.name === "Distribution"
      );
      expect(distributionField.value).toBe("N/A");
    });
  });

  describe("NamiComi Provider", () => {
    const mockNamiComiStats = {
      title: {
        rating: { bayesian: 4.8, count: 50 },
        views: 1000,
        follows: 200,
        comments: { repliesCount: 5 },
      },
      chapters: {
        views: 5000,
        comments: 20,
        reactions: 100,
      },
    };

    it("should build NamiComi embed with correct fields and NO buttons", async () => {
      (getTitleStats as jest.Mock<any>).mockResolvedValue(mockNamiComiStats);
      mockInteraction.customId = "namicomi_title_stats_456";

      await titleStatsButton.execute(mockInteraction, client);

      const followUpArgs = mockInteraction.followUp.mock.calls[0][0];
      const embed = followUpArgs.embeds[0];

      expect(embed.data.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Rating",
            value: "4.8/5.00 (50 votes)",
          }),
          expect.objectContaining({ name: "Views", value: "1000" }),
          expect.objectContaining({ name: "Follows", value: "200" }),
          expect.objectContaining({ name: "Comments", value: "5" }),
          expect.objectContaining({ name: "Chapter Views", value: "5000" }),
          expect.objectContaining({ name: "Chapter Comments", value: "20" }),
          expect.objectContaining({ name: "Chapter Reactions", value: "100" }),
        ])
      );

      expect(followUpArgs.components).toEqual([]);
    });
  });

  describe("Default Fallback", () => {
    it("should fall back to empty fields and no buttons for unknown source", async () => {
      (getTitleStats as jest.Mock<any>).mockResolvedValue({ dummy: "data" });
      mockInteraction.customId = "unknownsource_title_stats_999";

      await titleStatsButton.execute(mockInteraction, client);

      const followUpArgs = mockInteraction.followUp.mock.calls[0][0];
      const embed = followUpArgs.embeds[0];

      expect(embed.data.description).toContain("Source: unknownsource");

      expect(embed.data.fields).toEqual([]);

      expect(followUpArgs.components).toEqual([]);
    });

    it("should fallback to undefined footer iconURL in success embed if avatarURL is null", async () => {
      (getTitleStats as jest.Mock<any>).mockResolvedValue({ dummy: "data" });
      mockInteraction.customId = "unknownsource_title_stats_999";
      client.user!.avatarURL = () => null;

      await titleStatsButton.execute(mockInteraction, client);

      const followUpArgs = mockInteraction.followUp.mock.calls[0][0];
      expect(followUpArgs.embeds[0].data.footer.icon_url).toBeUndefined();
    });
  });
});
