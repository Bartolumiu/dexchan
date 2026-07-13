import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  addTitleTags,
  getTitleTags,
} from "../../../src/functions/titles/titleTags";
import { ProviderType } from "../../../src/constants/providers";

// Mock EmbedBuilder to easily track addFields calls
jest.mock("discord.js", () => {
  class MockEmbedBuilder {
    addFields = jest.fn().mockReturnThis();
  }
  return { EmbedBuilder: MockEmbedBuilder };
});

describe("titleTags", () => {
  const mockTranslations: any = {
    genres: "Genres",
    tags: "Tags",
    genres_v2: "Genres V2",
    tags_v2: "Tags V2",
    format: "Format",
    themes: "Themes",
    content_warning: "Content Warnings",
    other_tags: "Other",
  };

  let mockEmbed: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmbed = new (require("discord.js").EmbedBuilder)();
  });

  describe("getTitleTags", () => {
    it("should return null if title is falsy", () => {
      expect(getTitleTags(null, "mangadex")).toBeNull();
    });

    it("should return null for an unknown provider type", () => {
      expect(getTitleTags({}, "unknown" as ProviderType)).toBeNull();
    });

    describe("MangaBaka", () => {
      it("should return N/A for all fields if arrays are missing or empty", () => {
        const result = getTitleTags({}, "mangabaka");
        expect(result).toEqual({
          tags: "N/A",
          genres: "N/A",
        });
      });

      it("should correctly map valid tags and filter out falsy/missing names", () => {
        const title = {
          tags: [
            { name: "Tag1", is_genre: false },
            { name: "Tag2", is_genre: false },
            { name: "Action", is_genre: true },
            { name: null, is_genre: false },
            { hello: "world", is_genre: true },
          ],
        };

        const result = getTitleTags(title, "mangabaka");
        expect(result).toEqual({
          tags: "Tag1, Tag2",
          genres: "Action",
        });
      });

      it("should truncate arrays to a maximum of 10 items", () => {
        const title = {
          tags: Array.from({ length: 15 }, (_, i) => ({
            name: `Tag${i}`,
            is_genre: false,
          })),
        };

        const result = getTitleTags(title, "mangabaka");
        // Should only contain 10 items
        const tagsCount = result!.tags.split(", ").length;
        expect(tagsCount).toBe(10);
        expect(result!.tags).not.toContain("Tag10"); // 11th item (0-indexed)
      });
    });

    describe("MangaDex", () => {
      it("should return N/A for all fields if attributes or tags are missing", () => {
        const result = getTitleTags({}, "mangadex");
        expect(result).toEqual({
          theme: "N/A",
          genre: "N/A",
          content: "N/A",
          format: "N/A",
        });
      });

      it("should map valid tags into their respective groups", () => {
        const title = {
          attributes: {
            tags: [
              { attributes: { group: "theme", name: { en: "Aliens" } } },
              { attributes: { group: "genre", name: { en: "Action" } } },
              { attributes: { group: "content", name: { en: "Gore" } } },
              { attributes: { group: "format", name: { en: "Full Color" } } },
            ],
          },
        };

        const result = getTitleTags(title, "mangadex");
        expect(result).toEqual({
          theme: "Aliens",
          genre: "Action",
          content: "Gore",
          format: "Full Color",
        });
      });

      it("should ignore missing groups, missing names, missing 'en' localization, and unknown groups", () => {
        const title = {
          attributes: {
            tags: [
              { attributes: { group: "theme" } }, // missing name
              { attributes: { name: { en: "Missing Group" } } }, // missing group
              { attributes: { group: "genre", name: { jp: "No English" } } }, // missing 'en'
              { attributes: { group: "unknown_group", name: { en: "Lost" } } }, // unknown group
              null, // null tag
            ],
          },
        };

        const result = getTitleTags(title, "mangadex");
        expect(result).toEqual({
          theme: "N/A",
          genre: "N/A",
          content: "N/A",
          format: "N/A",
        });
      });
    });

    describe("NamiComi", () => {
      it("should return N/A for all fields if relationships are missing", () => {
        const result = getTitleTags({}, "namicomi", "es");
        expect(result).toEqual({
          content_warning: "N/A",
          format: "N/A",
          genre: "N/A",
          theme: "N/A",
          other: "N/A",
        });
      });

      it("should map valid tags, handle 'content-warnings' exception, and map unknowns to 'other'", () => {
        const title = {
          relationships: [
            {
              type: "tag",
              attributes: { group: "genre", name: { es: "Acción" } },
            },
            {
              type: "primary_tag",
              attributes: { group: "theme", name: { es: "Magia" } },
            },
            {
              type: "secondary_tag",
              attributes: { group: "format", name: { es: "A Color" } },
            },
            {
              type: "tag",
              attributes: { group: "content-warnings", name: { es: "Gore" } },
            },
            {
              type: "tag",
              attributes: { group: "weird_group", name: { es: "Other Tag" } },
            }, // Goes to 'other'
          ],
        };

        const result = getTitleTags(title, "namicomi", "es");
        expect(result).toEqual({
          genre: "Acción",
          theme: "Magia",
          format: "A Color",
          content_warning: "Gore",
          other: "Other Tag",
        });
      });

      it("should fallback to 'en' if requested locale is missing, and skip if both are missing", () => {
        const title = {
          relationships: [
            // requested locale 'fr' is missing, falls back to 'en'
            {
              type: "tag",
              attributes: { group: "genre", name: { en: "Action" } },
            },
            // neither 'fr' nor 'en' exists, should be skipped
            {
              type: "tag",
              attributes: { group: "theme", name: { jp: "Mahou" } },
            },
          ],
        };

        const result = getTitleTags(title, "namicomi", "fr");
        expect(result!.genre).toBe("Action");
        expect(result!.theme).toBe("N/A");
      });

      it("should default locale to 'en' if locale parameter is null", () => {
        const title = {
          relationships: [
            {
              type: "tag",
              attributes: { group: "genre", name: { en: "Action EN" } },
            },
          ],
        };

        const result = getTitleTags(title, "namicomi", null);
        expect(result!.genre).toBe("Action EN");
      });

      it("should ignore invalid relationship types, missing groups, and missing name objects", () => {
        const title = {
          relationships: [
            {
              type: "author",
              attributes: { group: "genre", name: { en: "Oda" } },
            }, // Invalid type
            { type: "tag", attributes: { name: { en: "No Group" } } }, // Missing group
            { type: "tag", attributes: { group: "genre" } }, // Missing name obj
          ],
        };

        const result = getTitleTags(title, "namicomi");
        expect(result!.genre).toBe("N/A");
        expect(result!.other).toBe("N/A");
      });
    });
  });

  describe("addTitleTags", () => {
    const mockTitle = { id: "123" }; // Pass-through dummy title

    it("should return null if title, embed, or translations are missing", () => {
      expect(
        addTitleTags(null, mockEmbed, mockTranslations, "mangadex")
      ).toBeNull();
      expect(
        addTitleTags(mockTitle, null as any, mockTranslations, "mangadex")
      ).toBeNull();
      expect(
        addTitleTags(mockTitle, mockEmbed, null as any, "mangadex")
      ).toBeNull();
    });

    it("should return null for unknown provider types", () => {
      expect(
        addTitleTags(
          mockTitle,
          mockEmbed,
          mockTranslations,
          "unknown" as ProviderType
        )
      ).toBeNull();
    });

    it("should add fields for MangaBaka", () => {
      const result = addTitleTags(
        mockTitle,
        mockEmbed,
        mockTranslations,
        "mangabaka"
      );

      expect(result).toBe(true);
      expect(mockEmbed.addFields).toHaveBeenCalledWith(
        { name: "Genres", value: "N/A", inline: true },
        { name: "Tags", value: "N/A", inline: true }
      );
    });

    it("should add fields for MangaDex", () => {
      const result = addTitleTags(
        mockTitle,
        mockEmbed,
        mockTranslations,
        "mangadex"
      );

      expect(result).toBe(true);
      expect(mockEmbed.addFields).toHaveBeenCalledWith(
        { name: "Format", value: "N/A", inline: true },
        { name: "Genres", value: "N/A", inline: true },
        { name: "Themes", value: "N/A", inline: true },
        { name: "Content Warnings", value: "N/A", inline: true }
      );
    });

    it("should add fields for NamiComi with explicit locale", () => {
      const result = addTitleTags(
        mockTitle,
        mockEmbed,
        mockTranslations,
        "namicomi",
        "es"
      );

      expect(result).toBe(true);
      expect(mockEmbed.addFields).toHaveBeenCalledWith(
        { name: "Format", value: "N/A", inline: true },
        { name: "Genres", value: "N/A", inline: true },
        { name: "Themes", value: "N/A", inline: true },
        { name: "Content Warnings", value: "N/A", inline: true },
        { name: "Other", value: "N/A", inline: true }
      );
    });

    it("should add fields for NamiComi defaulting locale to 'en' when null", () => {
      const result = addTitleTags(
        mockTitle,
        mockEmbed,
        mockTranslations,
        "namicomi",
        null
      ); // triggers default fallback
      expect(result).toBe(true);
      expect(mockEmbed.addFields).toHaveBeenCalled();
    });
  });
});
