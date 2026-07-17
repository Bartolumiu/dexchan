import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { readdirSync } from "node:fs";
import handleComponents from "../../../src/functions/handlers/handleComponents";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";
import * as path from "node:path";
import { Collection } from "discord.js";
import { logMessage } from "../../../src/lib/app";

jest.mock("node:fs");

jest.mock("../../../src/lib/app", () => ({
  logMessage: jest.fn(),
}));

describe("handleComponents", () => {
  let client: ExtendedClient;
  const mockReaddirSync = readdirSync as unknown as jest.Mock;

  beforeEach(() => {
    client = {
      buttons: new Collection(),
      selectMenus: new Collection(),
      modals: new Collection(),
    } as unknown as ExtendedClient;
    jest.clearAllMocks();
    mockReaddirSync.mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should warn and return if components folder does not exist", async () => {
    mockReaddirSync.mockImplementation(() => {
      throw new Error("Folder not found");
    });

    await handleComponents(client);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("No components folder found"),
      "warn"
    );
  });

  it("should log an error for invalid component folders", async () => {
    mockReaddirSync.mockReturnValueOnce(["invalid_folder"]);

    await handleComponents(client);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("is not a valid component folder"),
      "error"
    );
  });

  it("should load buttons correctly", async () => {
    const mockComponent = {
      data: { customId: "test-button" },
      execute: jest.fn(),
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("components")) return ["buttons"];
        if (dirPath.endsWith("buttons")) return ["testButton.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/testButton.ts"),
      () => ({ __esModule: true, default: mockComponent }),
      { virtual: true }
    );

    await handleComponents(client);

    expect(client.buttons.get("test-button")).toBe(mockComponent as any);
  });

  it("should store a RegExp customId as an actual RegExp key, not a stringified one", async () => {
    const mockComponent = {
      data: { customId: /_title_stats_/ },
      execute: jest.fn(),
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("components")) return ["buttons"];
        if (dirPath.endsWith("buttons")) return ["titleStats.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/titleStats.ts"),
      () => ({ __esModule: true, default: mockComponent }),
      { virtual: true }
    );

    await handleComponents(client);

    const [storedKey] = [...client.buttons.keys()];
    expect(storedKey).toBeInstanceOf(RegExp);
    expect(client.buttons.get(storedKey as unknown as string)).toBe(
      mockComponent as any
    );
    // A regex-keyed component must never be reachable by its stringified form:
    // that would mean the loader coerced the RegExp into a string somewhere.
    expect(client.buttons.has("/_title_stats_/" as unknown as RegExp)).toBe(
      false
    );
  });

  it("should load selectMenus correctly when missing a default export", async () => {
    const mockComponent = {
      data: { customId: "test-menu" },
      execute: jest.fn(),
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("components")) return ["selectMenus"];
        if (dirPath.endsWith("selectMenus")) return ["testMenu.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/components/selectMenus/testMenu.ts"),
      () => {
        const moduleObj = { ...mockComponent, __esModule: true };
        Object.defineProperty(moduleObj, "default", {
          get: () => undefined,
        });
        return moduleObj;
      },
      { virtual: true }
    );

    await handleComponents(client);

    expect(client.selectMenus.get("test-menu")).toBeDefined();
    expect(client.selectMenus.get("test-menu")?.data.customId).toBe(
      "test-menu"
    );
  });

  it("should load modals correctly", async () => {
    const mockComponent = {
      data: { customId: "test-modal" },
      execute: jest.fn(),
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("components")) return ["modals"];
        if (dirPath.endsWith("modals")) return ["testModal.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/components/modals/testModal.ts"),
      () => ({ __esModule: true, default: mockComponent }),
      { virtual: true }
    );

    await handleComponents(client);

    expect(client.modals.get("test-modal")).toBe(mockComponent as any);
  });

  it("should warn if component is missing customId", async () => {
    const mockComponent = {
      data: {},
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("components")) return ["buttons"];
        if (dirPath.endsWith("buttons")) return ["invalid.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/invalid.ts"),
      () => ({ __esModule: true, default: mockComponent }),
      { virtual: true }
    );

    await handleComponents(client);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("is missing data.customId"),
      "warn"
    );
  });

  it("should handle error during loading a component file", async () => {
    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("components")) return ["buttons"];
        if (dirPath.endsWith("buttons")) return ["error.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/error.ts"),
      () => {
        throw new Error("Import Error");
      },
      { virtual: true }
    );

    await handleComponents(client);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("Error loading error.ts"),
      "error"
    );
  });

  it("should warn when two components register the same string customId", async () => {
    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("components")) return ["buttons"];
        if (dirPath.endsWith("buttons")) return ["firstA.ts", "firstB.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/firstA.ts"),
      () => ({
        __esModule: true,
        default: { data: { customId: "dup" }, execute: jest.fn() },
      }),
      { virtual: true }
    );
    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/firstB.ts"),
      () => ({
        __esModule: true,
        default: { data: { customId: "dup" }, execute: jest.fn() },
      }),
      { virtual: true }
    );

    await handleComponents(client);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("duplicates an already-loaded component"),
      "warn"
    );
    expect(client.buttons.size).toBe(1);
  });

  it("should warn when two components register an equivalent RegExp customId", async () => {
    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("components")) return ["buttons"];
        if (dirPath.endsWith("buttons")) return ["secondA.ts", "secondB.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/secondA.ts"),
      () => ({
        __esModule: true,
        default: { data: { customId: /_dup_/ }, execute: jest.fn() },
      }),
      { virtual: true }
    );
    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/secondB.ts"),
      () => ({
        __esModule: true,
        default: { data: { customId: /_dup_/ }, execute: jest.fn() },
      }),
      { virtual: true }
    );

    await handleComponents(client);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("duplicates an already-loaded component"),
      "warn"
    );
  });

  it("should not warn when two components register different customIds", async () => {
    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("components")) return ["buttons"];
        if (dirPath.endsWith("buttons")) return ["thirdA.ts", "thirdB.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/thirdA.ts"),
      () => ({
        __esModule: true,
        default: { data: { customId: "a" }, execute: jest.fn() },
      }),
      { virtual: true }
    );
    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/thirdB.ts"),
      () => ({
        __esModule: true,
        default: { data: { customId: "b" }, execute: jest.fn() },
      }),
      { virtual: true }
    );

    await handleComponents(client);

    expect(logMessage).not.toHaveBeenCalledWith(
      expect.stringContaining("duplicates an already-loaded component"),
      "warn"
    );
    expect(client.buttons.size).toBe(2);
  });

  it("should filter out non-ts and .i18n.ts files", async () => {
    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("components")) return ["buttons"];
        if (dirPath.endsWith("buttons"))
          return ["b1.ts", "b1.js", "b1.i18n.ts", "other.txt"];
      }
      return [];
    });

    const mockComponent = {
      data: { customId: "b1" },
      execute: jest.fn(),
    };

    jest.mock(
      path.join(__dirname, "../../../src/components/buttons/b1.ts"),
      () => ({ __esModule: true, default: mockComponent }),
      { virtual: true }
    );

    await handleComponents(client);

    expect(client.buttons.size).toBe(1);
    expect(client.buttons.has("b1")).toBe(true);
  });
});
