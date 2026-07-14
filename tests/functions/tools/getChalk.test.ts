import { describe, expect, it, jest } from "@jest/globals";
import getChalk from "../../../src/functions/tools/getChalk";

jest.mock("chalk", () => ({
  __esModule: true,
  default: {
    blueBright: (text: string) => text,
  },
}));

describe("getChalk", () => {
  it("should return the chalk default export", async () => {
    const chalk = await getChalk();
    expect(chalk).toBeDefined();
  });
});
