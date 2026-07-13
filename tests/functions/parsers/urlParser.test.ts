import { describe, expect, it } from "@jest/globals";
import { checkID, parseUrl } from "../../../src/functions/parsers/urlParser";

describe("urlParser", () => {
  describe("parseUrl", () => {
    it("should return null for null, undefined, or non-string inputs", () => {
      expect(parseUrl(null, "mangadex")).toBeNull();
      expect(parseUrl(undefined, "mangadex")).toBeNull();
      // @ts-ignore
      expect(parseUrl(123, "mangadex")).toBeNull();
    });

    it("should parse MangaBaka URLs", () => {
      expect(parseUrl("https://mangabaka.org/12345", "mangabaka")).toBe(
        "12345"
      );
      expect(parseUrl("https://mangabaka.org/12345/slug", "mangabaka")).toBe(
        "12345"
      );
      expect(parseUrl("https://dev.mangabaka.dev/12345", "mangabaka")).toBe(
        "12345"
      );
      expect(parseUrl("https://mangabaka.org/notanid", "mangabaka")).toBeNull();
    });

    it("should parse MangaDex URLs", () => {
      const id = "a2f1a6f0-6c9f-4d9f-8f8f-8f8f8f8f8f8f";
      expect(parseUrl(`https://mangadex.org/title/${id}`, "mangadex")).toBe(id);
      expect(
        parseUrl(`https://mangadex.org/title/${id}/slug`, "mangadex")
      ).toBe(id);
      expect(
        parseUrl(`https://canary.mangadex.dev/title/${id}`, "mangadex")
      ).toBe(id);
      expect(
        parseUrl("https://mangadex.org/title/invalid-id", "mangadex")
      ).toBeNull();
    });

    it("should parse NamiComi URLs", () => {
      const id = "abc12345";
      // Primary
      expect(
        parseUrl(`https://namicomi.com/en/title/${id}/slug`, "namicomi")
      ).toBe(id);
      expect(
        parseUrl(`https://namicomi.com/es-ES/title/${id}/slug`, "namicomi")
      ).toBe(id);
      // Semi-shortened
      expect(parseUrl(`https://namicomi.com/t/${id}`, "namicomi")).toBe(id);
      // Shortened
      expect(parseUrl(`https://nami.moe/t/${id}`, "namicomi")).toBe(id);

      expect(
        parseUrl("https://namicomi.com/title/too-short", "namicomi")
      ).toBeNull();
    });

    it("should return null for unknown provider type", () => {
      // @ts-ignore
      expect(parseUrl("https://example.com", "unknown")).toBeNull();
    });
  });

  describe("checkID", () => {
    it("should return null for null, undefined, or non-string inputs", () => {
      expect(checkID(null, "mangadex")).toBeNull();
      expect(checkID(undefined, "mangadex")).toBeNull();
      // @ts-ignore
      expect(checkID(123, "mangadex")).toBeNull();
    });

    it("should validate MangaBaka IDs", () => {
      expect(checkID("12345", "mangabaka")).toBe(true);
      expect(checkID("abc", "mangabaka")).toBe(false);
    });

    it("should validate MangaDex IDs", () => {
      expect(checkID("a2f1a6f0-6c9f-4d9f-8f8f-8f8f8f8f8f8f", "mangadex")).toBe(
        true
      );
      expect(checkID("invalid-uuid", "mangadex")).toBe(false);
    });

    it("should validate NamiComi IDs", () => {
      expect(checkID("abc12345", "namicomi")).toBe(true);
      expect(checkID("too-short", "namicomi")).toBe(false);
      expect(checkID("too-loooooong", "namicomi")).toBe(false);
    });

    it("should return null for unknown provider type", () => {
      // @ts-ignore
      expect(checkID("123", "unknown")).toBeNull();
    });
  });
});
