import { describe, expect, it } from "@jest/globals";
import { capitalizeFirstLetter } from "../../../src/functions/tools/capitalizeFirstLetter";

describe("capitalizeFirstLetter", () => {
  it("should capitalize the first letter of a lowercase string", () => {
    expect(capitalizeFirstLetter("hello")).toBe("Hello");
  });

  it("should not change an already capitalized string", () => {
    expect(capitalizeFirstLetter("Hello")).toBe("Hello");
  });

  it("should handle single character strings", () => {
    expect(capitalizeFirstLetter("a")).toBe("A");
  });

  it("should return an empty string if provided", () => {
    expect(capitalizeFirstLetter("")).toBe("");
  });

  it("should handle strings with leading numbers or special characters", () => {
    expect(capitalizeFirstLetter("1abc")).toBe("1abc");
    expect(capitalizeFirstLetter("!abc")).toBe("!abc");
  });
});
