import { describe, expect, it } from "@jest/globals";
import truncateString from "../../../src/functions/tools/truncateString";

describe("truncateString", () => {
  it("should return null if input is null", () => {
    expect(truncateString(null)).toBeNull();
  });

  it("should return the original string if its length is less than or equal to maxLength", () => {
    expect(truncateString("hello", 10)).toBe("hello");
    expect(truncateString("hello", 5)).toBe("hello");
  });

  it("should truncate and add (...) if length exceeds maxLength", () => {
    const str = "This is a long string that needs to be truncated";
    // maxLength 20. Truncate at 20-6 = 14. "This is a long".
    // After split(" ").slice(0,-1).join(" "): "This is a"
    // Final: "This is a (...)"
    expect(truncateString(str, 20)).toBe("This is a (...)");
  });

  it("should use default maxLength of 100", () => {
    const longStr = "a".repeat(110);
    expect(truncateString(longStr)!.length).toBeLessThan(110);
  });

  it("should return truncated string when maxLength is less than or equal to 6", () => {
    expect(truncateString("hello world", 6)).toBe("hello ");
    expect(truncateString("hello world", 3)).toBe("hel");
    expect(truncateString("hello world", 0)).toBe("");
  });
});
