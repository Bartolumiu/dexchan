import { describe, expect, it } from "@jest/globals";
import getTitleCreators from "../../../src/functions/titles/titleCreators";
import { ProviderType } from "../../../src/constants/providers";

describe("getTitleCreators", () => {
  it("should return null immediately if title is falsey", () => {
    expect(getTitleCreators(null as any, "mangadex")).toBeNull();
  });

  it("should return null for an unknown provider type", () => {
    expect(getTitleCreators({}, "unknown" as ProviderType)).toBeNull();
  });

  describe("MangaBaka Provider", () => {
    it("should return joined authors and artists with duplicates removed", () => {
      const title = { authors: ["Alice", "Bob"], artists: ["Bob", "Charlie"] };
      expect(getTitleCreators(title, "mangabaka")).toBe("Alice, Bob, Charlie");
    });

    it("should return null if authors and artists are empty or missing", () => {
      expect(getTitleCreators({}, "mangabaka")).toBeNull();
      expect(
        getTitleCreators({ authors: [], artists: [] }, "mangabaka")
      ).toBeNull();
    });
  });

  describe("MangaDex Provider", () => {
    it("should filter author/artist types, extract names, and remove duplicates", () => {
      const title = {
        relationships: [
          { type: "author", attributes: { name: "Alice" } },
          { type: "artist", attributes: { name: "Bob" } },
          { type: "author", attributes: { name: "Alice" } }, // Duplicate
          { type: "cover_art", attributes: { name: "Charlie" } }, // Ignored type
          { type: "author" }, // Missing attributes
          { type: "artist", attributes: {} }, // Missing name
        ],
      };
      expect(getTitleCreators(title, "mangadex")).toBe("Alice, Bob");
    });

    it("should return null if relationships array is missing or empty", () => {
      expect(getTitleCreators({}, "mangadex")).toBeNull();
      expect(getTitleCreators({ relationships: [] }, "mangadex")).toBeNull();
    });
  });

  describe("NamiComi Provider", () => {
    it("should filter organization types, extract names, and remove duplicates", () => {
      const title = {
        relationships: [
          { type: "organization", attributes: { name: "Org A" } },
          { type: "organization", attributes: { name: "Org B" } },
          { type: "organization", attributes: { name: "Org A" } }, // Duplicate
          { type: "author", attributes: { name: "Org C" } }, // Ignored type
        ],
      };
      expect(getTitleCreators(title, "namicomi")).toBe("Org A, Org B");
    });

    it("should return null if relationships array is missing or empty", () => {
      expect(getTitleCreators({}, "namicomi")).toBeNull();
      expect(getTitleCreators({ relationships: [] }, "namicomi")).toBeNull();
    });
  });
});
