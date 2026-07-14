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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    client = {
      version: "1.0.0",
    } as unknown as ExtendedClient;
    readyClient = {} as Client<true>;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("should have correct event properties", () => {
    expect(readyEvent.name).toBe(Events.ClientReady);
    expect(readyEvent.once).toBe(true);
  });

  it("should initiate the pickPresence interval and execute it", async () => {
    (checkUpdates as jest.Mock<any>).mockResolvedValue({});
    await readyEvent.execute(client, readyClient);

    expect(mockPickPresence).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10 * 1000);

    expect(mockPickPresence).toHaveBeenCalledTimes(1);
    expect(mockPickPresence).toHaveBeenCalledWith(client);
  });
});
