import { describe, expect, it } from "@jest/globals";
import getLocalizedTitle from "../../../src/functions/titles/localizedTitle";
import { ProviderType } from "../../../src/constants/providers";

describe("getLocalizedTitle", () => {
  describe("General Routing & Edge Cases", () => {
    it("should return null if title is falsely", () => {
      expect(getLocalizedTitle(null as any, "mangadex", "en")).toBeNull();
      expect(getLocalizedTitle(undefined as any, "namicomi", "es")).toBeNull();
    });

    it("should return null for an unknown provider type", () => {
      const title = { attributes: { title: { en: "Test" } } };
      expect(
        getLocalizedTitle(title, "unknown" as ProviderType, "en")
      ).toBeNull();
    });

    it("should map Discord locales to short locales using languageMap", () => {
      const title = { attributes: { title: { es: "Spanish Title" } } };
      // 'es-ES' maps to 'es' in the language map
      expect(getLocalizedTitle(title, "mangadex", "es-ES")).toBe(
        "Spanish Title"
      );
    });
  });

  describe("MangaBaka Logic", () => {
    it("should fallback to data.title if titles array is missing", () => {
      const title = { title: "Base Title", romanized_title: "Rom Title" };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBe("Base Title");
    });

    it("should fallback to romanized_title if title is missing", () => {
      const title = { romanized_title: "Rom Title", native_title: "Nat Title" };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBe("Rom Title");
    });

    it("should fallback to native_title if title and romanized are missing", () => {
      const title = { native_title: "Nat Title" };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBe("Nat Title");
    });

    it("should return null if no titles array and no fallback fields exist", () => {
      const title = {};
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBeNull();
    });

    it("should match 'es-la' or 'es-es' if locale is 'es' and no 'es' exists", () => {
      const title = {
        titles: [
          {
            language: "es-la",
            title: "LatAm Title",
            traits: [],
            is_primary: false,
          },
        ],
      };
      expect(getLocalizedTitle(title, "mangabaka", "es-ES")).toBe(
        "LatAm Title"
      );
    });

    it("should prioritize 'is_primary' over everything else", () => {
      const title = {
        titles: [
          {
            language: "en",
            title: "Official Title",
            traits: ["official"],
            is_primary: false,
          },
          {
            language: "en",
            title: "Primary Title",
            traits: [],
            is_primary: true,
          },
        ],
      };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBe("Primary Title");
    });

    it("should prioritize 'official' trait if no primary exists", () => {
      const title = {
        titles: [
          {
            language: "en",
            title: "Native Title",
            traits: ["native"],
            is_primary: false,
          },
          {
            language: "en",
            title: "Official Title",
            traits: ["official"],
            is_primary: false,
          },
        ],
      };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBe(
        "Official Title"
      );
    });

    it("should prioritize 'native' trait if no official or primary exists", () => {
      const title = {
        titles: [
          {
            language: "en",
            title: "Alt Title",
            traits: ["some_trait"],
            is_primary: false,
          },
          {
            language: "en",
            title: "Native Title",
            traits: ["native"],
            is_primary: false,
          },
        ],
      };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBe("Native Title");
    });

    it("should prioritize any trait over no traits", () => {
      const title = {
        titles: [
          {
            language: "en",
            title: "No Trait Title",
            traits: [],
            is_primary: false,
          },
          {
            language: "en",
            title: "Trait Title",
            traits: ["random"],
            is_primary: false,
          },
        ],
      };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBe("Trait Title");
    });

    it("should fallback to a title with no traits if no traits exist", () => {
      const title = {
        titles: [
          {
            language: "en",
            title: "No Trait Title",
            traits: [],
            is_primary: false,
          },
        ],
      };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBe(
        "No Trait Title"
      );
    });

    it("should hit the absolute final fallback if traits is somehow undefined", () => {
      const title = {
        titles: [
          // Force traits to be undefined to bypass the length checks
          {
            language: "en",
            title: "Final Fallback",
            traits: undefined as any,
            is_primary: false,
          },
        ],
      };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBe(
        "Final Fallback"
      );
    });

    it("should fallback to legacy fields if titles array is empty or no locale matches", () => {
      const title = {
        title: "Legacy Fallback",
        titles: [
          {
            language: "fr",
            title: "French Title",
            traits: [],
            is_primary: false,
          },
        ],
      };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBe(
        "Legacy Fallback"
      );
    });

    it("should return null from final fallback if titles array has no matches and legacy fields are missing", () => {
      const title = {
        titles: [
          {
            language: "fr",
            title: "French Title",
            traits: [],
            is_primary: false,
          },
        ],
      };
      expect(getLocalizedTitle(title, "mangabaka", "en")).toBeNull();
    });
  });

  describe("MangaDex Logic", () => {
    it("should match locale directly from titleObj", () => {
      const title = { attributes: { title: { en: "English Title" } } };
      expect(getLocalizedTitle(title, "mangadex", "en")).toBe("English Title");
    });

    it("should match locale from altTitles if not in titleObj", () => {
      const title = {
        attributes: {
          title: { jp: "Japanese Title" },
          altTitles: [{ en: "English Alt" }, { fr: "French Alt" }],
        },
      };
      expect(getLocalizedTitle(title, "mangadex", "en")).toBe("English Alt");
    });

    it("should fallback 'es' to 'es-la' in titleObj", () => {
      const title = { attributes: { title: { "es-la": "LatAm Title" } } };
      expect(getLocalizedTitle(title, "mangadex", "es")).toBe("LatAm Title");
    });

    it("should fallback 'es' to 'es-la' in altTitles", () => {
      const title = {
        attributes: {
          title: { en: "English" },
          altTitles: [{ "es-la": "LatAm Alt" }],
        },
      };
      expect(getLocalizedTitle(title, "mangadex", "es")).toBe("LatAm Alt");
    });

    it("should fallback to the first key in titleObj if locale is completely missing", () => {
      const title = { attributes: { title: { fr: "French", jp: "Japanese" } } };
      expect(getLocalizedTitle(title, "mangadex", "en")).toBe("French");
    });

    it("should return null if absolutely no matches and titleObj is empty", () => {
      const title = {
        attributes: {
          altTitles: [{ fr: "French" }],
        },
      };
      expect(getLocalizedTitle(title, "mangadex", "en")).toBeNull();
    });
  });

  describe("NamiComi Logic", () => {
    it("should return null if titleObj is missing", () => {
      const title = { attributes: {} };
      expect(getLocalizedTitle(title, "namicomi", "en")).toBeNull();
    });

    it("should match exact locale", () => {
      const title = { attributes: { title: { fr: "French Title" } } };
      expect(getLocalizedTitle(title, "namicomi", "fr")).toBe("French Title");
    });

    it("should strictly map 'es' to 'es-es'", () => {
      const title = {
        attributes: {
          title: { "es-es": "Spain Title", "es-419": "LatAm Title" },
        },
      };
      expect(getLocalizedTitle(title, "namicomi", "es-ES")).toBe("Spain Title");
    });

    it("should fallback 'es-es' to 'es-419' if 'es-es' is missing", () => {
      const title = {
        attributes: { title: { "es-419": "LatAm Title", en: "English Title" } },
      };
      expect(getLocalizedTitle(title, "namicomi", "es-ES")).toBe("LatAm Title");
    });

    it("should fallback to 'en' if requested locale is missing", () => {
      const title = {
        attributes: { title: { jp: "Japanese", en: "English Title" } },
      };
      expect(getLocalizedTitle(title, "namicomi", "fr")).toBe("English Title");
    });

    it("should fallback to the first key in titleObj if 'en' is also missing", () => {
      const title = {
        attributes: { title: { jp: "Japanese", fr: "French" } },
      };
      expect(getLocalizedTitle(title, "namicomi", "de")).toBe("Japanese");
    });

    it("should return null if titleObj is completely empty", () => {
      const title = { attributes: { title: {} } };
      expect(getLocalizedTitle(title, "namicomi", "en")).toBeNull();
    });
  });
});
