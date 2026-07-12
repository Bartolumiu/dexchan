import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Events } from "discord.js";
import debugEvent from "../../../src/events/client/debug";
import { logMessage } from "../../../src/lib/app";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";

jest.mock("../../../src/lib/app", () => ({
  logMessage: jest.fn(),
}));

describe("Debug Event", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have a name property equal to Events.Debug", () => {
    expect(debugEvent.name).toBe(Events.Debug);
  });

  it("should log the debug message using logMessage with 'debug' level", async () => {
    const client = {} as ExtendedClient;
    const debugMessage = "Test debug message";

    await debugEvent.execute(client, debugMessage);

    expect(logMessage).toHaveBeenCalledTimes(1);
    expect(logMessage).toHaveBeenCalledWith(debugMessage, "debug");
  });
});
