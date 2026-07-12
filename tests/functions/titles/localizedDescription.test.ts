import { describe, expect, it } from "@jest/globals";
import {
  getLocalizedDescription,
  TitleWithDescription,
} from "../../../src/functions/titles/localizedDescription";
import { ProviderType } from "../../../src/constants/providers";

describe("localizedDescription", () => {
  describe("General Routing", () => {
    it("should return null for an unknown provider type", () => {
      const title: TitleWithDescription = {
        attributes: { description: { en: "Desc" } },
      };
      expect(
        getLocalizedDescription(title, "unknown" as ProviderType, "en-US")
      ).toBeNull();
    });

    it("should map Discord locales to short locales using languageMap", () => {
      const title: TitleWithDescription = {
        attributes: { description: { en: "English Desc" } },
      };
      // "en-US" maps to "en"
      expect(getLocalizedDescription(title, "mangadex", "en-US")).toBe(
        "English Desc"
      );
    });

    it("should fall back to the provided locale if not in languageMap", () => {
      const title: TitleWithDescription = {
        attributes: { description: { fr: "French Desc" } },
      };
      // "fr" is not in languageMap, so it remains "fr"
      expect(getLocalizedDescription(title, "mangadex", "fr")).toBe(
        "French Desc"
      );
    });
  });

  describe("MangaDex Logic", () => {
    it("should return null if title has no attributes", () => {
      const title: TitleWithDescription = {};
      expect(getLocalizedDescription(title, "mangadex", "en")).toBeNull();
    });

    it("should return null if title has attributes but no description", () => {
      const title: TitleWithDescription = { attributes: {} };
      expect(getLocalizedDescription(title, "mangadex", "en")).toBeNull();
    });

    it("should return the exact locale match", () => {
      const title: TitleWithDescription = {
        attributes: { description: { it: "Italian Desc" } },
      };
      expect(getLocalizedDescription(title, "mangadex", "it")).toBe(
        "Italian Desc"
      );
    });

    it("should fallback 'es' to 'es-la' if 'es' is missing", () => {
      const title: TitleWithDescription = {
        attributes: { description: { "es-la": "LATAM Desc" } },
      };
      expect(getLocalizedDescription(title, "mangadex", "es-ES")).toBe(
        "LATAM Desc"
      );
    });

    it("should fallback 'es' to 'en' if both 'es' and 'es-la' are missing", () => {
      const title: TitleWithDescription = {
        attributes: { description: { en: "English Desc" } },
      };
      expect(getLocalizedDescription(title, "mangadex", "es")).toBe(
        "English Desc"
      );
    });

    it("should fallback any missing locale directly to 'en'", () => {
      const title: TitleWithDescription = {
        attributes: { description: { en: "English Desc" } },
      };
      expect(getLocalizedDescription(title, "mangadex", "de")).toBe(
        "English Desc"
      );
    });

    it("should return null if the locale is missing and 'en' is also missing", () => {
      const title: TitleWithDescription = {
        attributes: { description: { jp: "Japanese Desc" } },
      };
      expect(getLocalizedDescription(title, "mangadex", "fr")).toBeNull();
    });
  });

  describe("NamiComi Logic", () => {
    it("should return null if title has no description object", () => {
      const title: TitleWithDescription = {};
      expect(getLocalizedDescription(title, "namicomi", "en")).toBeNull();
    });

    it("should return exact match for non-Spanish locales", () => {
      const title: TitleWithDescription = {
        attributes: { description: { fr: "French Desc" } },
      };
      expect(getLocalizedDescription(title, "namicomi", "fr")).toBe(
        "French Desc"
      );
    });

    it("should map 'es' strictly to 'es-es'", () => {
      const title: TitleWithDescription = {
        attributes: {
          description: { "es-es": "Spain Desc", "es-419": "LATAM Desc" },
        },
      };
      expect(getLocalizedDescription(title, "namicomi", "es-ES")).toBe(
        "Spain Desc"
      );
    });

    it("should fallback 'es-es' to 'es-419' if 'es-es' is missing", () => {
      const title: TitleWithDescription = {
        attributes: {
          description: { "es-419": "LATAM Desc", en: "English Desc" },
        },
      };
      expect(getLocalizedDescription(title, "namicomi", "es")).toBe(
        "LATAM Desc"
      );
    });

    it("should fallback 'es-es' to 'en' if 'es-es' and 'es-419' are missing", () => {
      const title: TitleWithDescription = {
        attributes: { description: { en: "English Desc" } },
      };
      expect(getLocalizedDescription(title, "namicomi", "es")).toBe(
        "English Desc"
      );
    });

    it("should fallback any missing locale directly to 'en'", () => {
      const title: TitleWithDescription = {
        attributes: { description: { en: "English Desc" } },
      };
      expect(getLocalizedDescription(title, "namicomi", "de")).toBe(
        "English Desc"
      );
    });

    it("should return null if the locale is missing and 'en' is also missing", () => {
      const title: TitleWithDescription = {
        attributes: { description: { jp: "Japanese Desc" } },
      };
      expect(getLocalizedDescription(title, "namicomi", "fr")).toBeNull();
    });
  });
});
