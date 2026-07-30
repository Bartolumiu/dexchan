import { describe, expect, it } from "@jest/globals";
import {
  format,
  getAvailableLocales,
  getTranslations,
  translate,
  translateAttribute,
} from "../../../src/functions/handlers/handleLocales";
import en from "../../../src/i18n/locales/en";
import es from "../../../src/i18n/locales/es";

describe("handleLocales", () => {
  describe("format", () => {
    it("should replace placeholders with values", () => {
      const text = "Hello {name}, welcome to {place}!";
      const replacements = { name: "John", place: "Dex-chan" };
      expect(format(text, replacements)).toBe(
        "Hello John, welcome to Dex-chan!"
      );
    });

    it("should handle multiple occurrences of the same placeholder", () => {
      const text = "{val} {val} {val}";
      const replacements = { val: "test" };
      expect(format(text, replacements)).toBe("test test test");
    });

    it("should return original text if no replacements provided", () => {
      const text = "Hello {name}!";
      expect(format(text)).toBe("Hello {name}!");
    });
  });

  describe("translate", () => {
    it("should translate a key in English", () => {
      const result = translate("en", "commands.ping.description" as any);
      expect(result).toBe(en.commands.ping.description);
    });

    it("should translate a key in Spanish", () => {
      const result = translate("es", "commands.ping.description" as any);
      expect(result).toBe(es.commands?.ping?.description);
    });

    it("should fallback to English if locale not found", () => {
      const result = translate("fr", "commands.ping.description" as any);
      expect(result).toBe(en.commands.ping.description);
    });

    it("should fallback to English if key missing in specified locale", () => {
      // Temporarily remove a Spanish translation to test fallback
      const original = es.commands?.ping?.description;
      (es.commands as any).ping.description = undefined;

      const result = translate("es", "commands.ping.description" as any);

      expect(result).toBe(en.commands.ping.description);

      // Restore using 'any' to bypass TS literal type constraints
      if (es.commands?.ping) {
        (es.commands.ping as any).description = original;
      }
    });

    it("should return the key if it cannot find it in English either", () => {
      const result = translate("en", "non.existent.key" as any);
      expect(result).toBe("non.existent.key");
    });

    it("should handle replacements in translation", () => {
      // We use the common footer since we removed formatting from the ping latency fields
      const result = translate("en", "common.footers.command" as any, {
        commandName: "ping",
        user: "Bartolumiu",
      });
      expect(result).toBe("/ping - Requested by Bartolumiu");
    });

    it("should traverse nested English object before failing on missing key", () => {
      // We ask for Spanish ("es"), but target a deeply nested key that does not exist.
      // This forces the code to fall back to English ("en") and loop through
      // the existing keys ("commands", "ping") to assign `translation = ...[k]`
      // before ultimately returning the raw key string when it fails at "does_not_exist".
      const result = translate("es", "commands.ping.does_not_exist" as any);
      expect(result).toBe("commands.ping.does_not_exist");
    });

    it("should fallback to English if key is an empty string", () => {
      // Temporarily inject an empty string
      const original = es.commands?.ping?.description;
      (es.commands as any).ping.description = "";

      const result = translate("es", "commands.ping.description" as any);

      expect(result).toBe(en.commands.ping.description);

      // Restore
      if (es.commands?.ping) {
        (es.commands.ping as any).description = original;
      }
    });
  });

  describe("getTranslations", () => {
    it("should return English translations when requested", () => {
      expect(getTranslations("en")).toBe(en);
    });

    it("should return merged translations for other locales", () => {
      const translations = getTranslations("es");
      expect(translations.sources.mangadex).toBe(es.sources?.mangadex);
    });

    it("should fall back to base string if override value is explicitly undefined", () => {
      const originalDesc = es.commands?.ping?.description;
      (es.commands as any).ping.description = undefined;

      const translations = getTranslations("es");

      expect(translations.commands.ping.description).toBe(
        en.commands.ping.description
      );

      if (es.commands?.ping) {
        (es.commands.ping as any).description = originalDesc;
      }
    });

    it("should fall back to base string if override value is an empty string", () => {
      const originalDesc = es.commands?.ping?.description;
      (es.commands as any).ping.description = "";

      const translations = getTranslations("es");

      expect(translations.commands.ping.description).toBe(
        en.commands.ping.description
      );

      if (es.commands?.ping) {
        (es.commands.ping as any).description = originalDesc;
      }
    });
  });

  describe("translateAttribute", () => {
    it("should return a record of translations for all discord locales", () => {
      const result = translateAttribute((t) => t.commands.ping.description);
      expect(result["en-US"]).toBe(en.commands.ping.description);
      expect(result["es-ES"]).toBe(es.commands?.ping?.description);
      expect(Object.keys(result).length).toBeGreaterThan(1);
    });
  });

  describe("getAvailableLocales", () => {
    it("should return a list of enabled/available locales", () => {
      const available = getAvailableLocales();
      expect(available).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "en" }),
          expect.objectContaining({ code: "es" }),
        ])
      );
    });

    it("should default enabled to false if loc.enabled is undefined", () => {
      const originalEnabled = es.locale?.enabled;

      (es.locale as any).enabled = undefined;

      const available = getAvailableLocales();
      const esLocale = available.find((l) => l.code === "es");

      expect(esLocale?.enabled).toBe(false);

      if (es.locale) {
        (es.locale as any).enabled = originalEnabled;
      }
    });
  });
});
