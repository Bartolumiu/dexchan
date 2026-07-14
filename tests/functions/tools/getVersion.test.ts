import { describe, expect, it, jest } from "@jest/globals";
import getVersion from "../../../src/functions/tools/getVersion";

// Mock the package.json
jest.mock(
  "../../../package.json",
  () => ({
    version: "1.2.3",
  }),
  { virtual: true }
);

describe("getVersion", () => {
  it("should return the version from package.json", () => {
    expect(getVersion()).toBe("1.2.3");
  });
});
