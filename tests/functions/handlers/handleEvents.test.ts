import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { readdirSync } from "node:fs";
import handleEvents from "../../../src/functions/handlers/handleEvents";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";
import * as path from "node:path";
import { logMessage } from "../../../src/lib/app";

jest.mock("node:fs");

jest.mock("../../../src/lib/app", () => ({
  logMessage: jest.fn(),
}));

describe("handleEvents", () => {
  let client: ExtendedClient;
  const mockReaddirSync = readdirSync as unknown as jest.Mock;

  beforeEach(() => {
    client = {
      on: jest.fn(),
      once: jest.fn(),
    } as unknown as ExtendedClient;
    jest.clearAllMocks();
    mockReaddirSync.mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should load events and register them on the client", async () => {
    const mockEventFolders = ["client"];
    const mockEventFiles = ["ready.ts"];
    const mockEvent = {
      name: "ready",
      once: true,
      execute: jest.fn(),
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("events")) return mockEventFolders;
        if (dirPath.endsWith("client")) return mockEventFiles;
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/events/client/ready.ts"),
      () => ({
        __esModule: true,
        default: mockEvent,
      }),
      { virtual: true }
    );

    await handleEvents(client);

    expect(client.once).toHaveBeenCalledWith("ready", expect.any(Function));

    const callback = (client.once as jest.Mock).mock.calls[0][1] as (
      ...args: any[]
    ) => Promise<any>;
    await callback("arg1", "arg2");
    expect(mockEvent.execute).toHaveBeenCalledWith(client, "arg1", "arg2");
  });

  it("should register non-once events using client.on", async () => {
    const mockEventFolders = ["client"];
    const mockEventFiles = ["interactionCreate.ts"];
    const mockEvent = {
      name: "interactionCreate",
      once: false,
      execute: jest.fn(),
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("events")) return mockEventFolders;
        if (dirPath.endsWith("client")) return mockEventFiles;
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/events/client/interactionCreate.ts"),
      () => ({
        __esModule: true,
        default: mockEvent,
      }),
      { virtual: true }
    );

    await handleEvents(client);

    expect(client.on).toHaveBeenCalledWith(
      "interactionCreate",
      expect.any(Function)
    );

    const callback = (client.on as jest.Mock).mock.calls[0][1] as (
      ...args: any[]
    ) => Promise<any>;
    await callback("interaction-data");
    expect(mockEvent.execute).toHaveBeenCalledWith(client, "interaction-data");
  });

  it("should log an error if event is missing name or execute", async () => {
    const mockEventFolders = ["client"];
    const mockEventFiles = ["invalid.ts"];
    const mockEvent = {};

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("events")) return mockEventFolders;
        if (dirPath.endsWith("client")) return mockEventFiles;
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/events/client/invalid.ts"),
      () => ({
        __esModule: true,
        default: mockEvent,
      }),
      { virtual: true }
    );

    await handleEvents(client);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining(
        "is missing a required 'name' or 'execute' property"
      ),
      "error"
    );
    expect(client.on).not.toHaveBeenCalled();
    expect(client.once).not.toHaveBeenCalled();
  });

  it("should filter out non-ts and .i18n.ts files", async () => {
    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("events")) return ["client"];
        if (dirPath.endsWith("client"))
          return ["ready.ts", "ready.js", "ready.i18n.ts", "other.txt"];
      }
      return [];
    });

    const mockEvent = { name: "ready", execute: jest.fn() };
    jest.mock(
      path.join(__dirname, "../../../src/events/client/ready.ts"),
      () => ({
        __esModule: true,
        default: mockEvent,
      }),
      { virtual: true }
    );

    await handleEvents(client);
  });

  it("should load events and register them on the client when missing a default export", async () => {
    const mockEventFolders = ["client"];
    const mockEventFiles = ["ready-no-default.ts"];
    const mockEvent = {
      name: "ready-no-default",
      once: true,
      execute: jest.fn(),
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("events")) return mockEventFolders;
        if (dirPath.endsWith("client")) return mockEventFiles;
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/events/client/ready-no-default.ts"),
      () => {
        const moduleObj = { ...mockEvent, __esModule: true };
        Object.defineProperty(moduleObj, "default", {
          get: () => undefined,
        });
        return moduleObj;
      },
      { virtual: true }
    );

    await handleEvents(client);

    expect(client.once).toHaveBeenCalledWith(
      "ready-no-default",
      expect.any(Function)
    );
  });
});
