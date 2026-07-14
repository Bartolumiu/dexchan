import { describe, expect, it } from "@jest/globals";
import { SEARCH_PROVIDERS } from "../../src/constants/providers";

describe("Providers Constants", () => {
  it("should export the correct list of search providers", () => {
    expect(SEARCH_PROVIDERS).toEqual(["mangabaka", "mangadex", "namicomi"]);
  });

  it("should contain exactly 3 providers", () => {
    expect(SEARCH_PROVIDERS.length).toBe(3);
  });
});
