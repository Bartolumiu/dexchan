import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { Client, Events } from "discord.js";
import readyEvent from "../../../src/events/client/ready";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";
import checkUpdates from "../../../src/functions/tools/checkUpdates";

jest.mock("../../../src/lib/app", () => ({
  logMessage: jest.fn(),
}));

jest.mock("../../../src/functions/tools/checkUpdates", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockPickPresence = jest.fn();
jest.mock("../../../src/functions/tools/pickPresence", () => ({
  __esModule: true,
  default: mockPickPresence,
}));

describe("Ready Event", () => {
  let client: ExtendedClient;
  let readyClient: Client<true>;
  let setIntervalSpy: jest.Spied<typeof global.setInterval>;

  beforeEach(() => {
    jest.clearAllMocks();
    setIntervalSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => ({}) as any);

    client = {
      version: "1.0.0",
    } as unknown as ExtendedClient;
    readyClient = {} as Client<true>;
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("should have correct event properties", () => {
    expect(readyEvent.name).toBe(Events.ClientReady);
    expect(readyEvent.once).toBe(true);
  });

  it("should initiate the pickPresence interval and execute it", async () => {
    (checkUpdates as jest.Mock<any>).mockResolvedValue({});
    await readyEvent.execute(client, readyClient);

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000);

    const callback = setIntervalSpy.mock.calls[0][0] as () => Promise<void>;
    await callback();

    expect(mockPickPresence).toHaveBeenCalledTimes(1);
    expect(mockPickPresence).toHaveBeenCalledWith(client);
  });

  it("should log error if checkUpdates fails", async () => {
    const { logMessage } = require("../../../src/lib/app");
    (checkUpdates as jest.Mock<any>).mockRejectedValue(
      new Error("Update check failed")
    );

    await readyEvent.execute(client, readyClient);

    expect(logMessage).toHaveBeenCalledWith(
      "[Ready] Error during initialization: Update check failed",
      "error"
    );
  });

  it("should handle non-Error rejections gracefully", async () => {
    const { logMessage } = require("../../../src/lib/app");
    (checkUpdates as jest.Mock<any>).mockRejectedValue("string error");

    await readyEvent.execute(client, readyClient);

    expect(logMessage).toHaveBeenCalledWith(
      "[Ready] Error during initialization: string error",
      "error"
    );
  });
});
