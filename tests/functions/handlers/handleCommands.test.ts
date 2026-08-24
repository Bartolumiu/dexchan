import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { readdirSync } from "node:fs";
import handleCommands from "../../../src/functions/handlers/handleCommands";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";
import * as path from "node:path";
import { REST } from "discord.js";
import { logMessage } from "../../../src/lib/app";

jest.mock("node:fs");
jest.mock("discord.js", () => {
  const actual = jest.requireActual("discord.js") as any;
  const mockPut = jest.fn<any>().mockResolvedValue({} as any);
  const mockSetToken = jest.fn<any>().mockReturnThis();
  return {
    ...actual,
    REST: jest.fn().mockImplementation(() => ({
      setToken: mockSetToken,
      put: mockPut,
    })),
    Routes: {
      applicationCommands: jest.fn<any>().mockReturnValue("/apps/commands"),
      applicationGuildCommands: jest
        .fn<any>()
        .mockReturnValue("/apps/guilds/commands"),
    },
  };
});

jest.mock("../../../src/lib/app", () => ({
  logMessage: jest.fn(),
}));

describe("handleCommands", () => {
  let client: ExtendedClient;
  const mockReaddirSync = readdirSync as unknown as jest.Mock;

  beforeEach(() => {
    client = {
      commands: new Map(),
    } as unknown as ExtendedClient;

    jest.clearAllMocks();
    jest.resetModules();

    (REST as unknown as jest.Mock).mockImplementation(() => ({
      setToken: jest.fn<any>().mockReturnThis(),
      put: jest.fn<any>().mockResolvedValue({} as any),
    }));

    mockReaddirSync.mockReturnValue([]);
    process.env.CLIENT_ID = "test-client-id";
    process.env.DEXCHAN_TOKEN = "test-bot-token";
    delete process.env.TEST_GUILD_ID;
  });

  it("should load global commands correctly", async () => {
    const mockCommandFolders = ["utils"];
    const mockCommandFiles = ["ping.ts"];
    const mockCommand = {
      data: {
        name: "ping",
        toJSON: jest.fn().mockReturnValue({ name: "ping" }),
      },
      global: true,
      execute: jest.fn(),
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("commands")) return mockCommandFolders;
        if (dirPath.endsWith("utils")) return mockCommandFiles;
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/commands/utils/ping.ts"),
      () => ({
        __esModule: true,
        default: mockCommand,
      }),
      { virtual: true }
    );

    await handleCommands(client);

    expect(client.commands.get("ping")).toBe(mockCommand as any);
    expect(REST).toHaveBeenCalled();
    const restInstance = (REST as unknown as jest.Mock).mock.results[0]
      .value as any;
    expect(restInstance.put).toHaveBeenCalledWith("/apps/commands", {
      body: [{ name: "ping" }],
    });
  });

  it("should load guild commands correctly", async () => {
    const mockCommandFolders = ["admin"];
    const mockCommandFiles = ["test.ts"];
    const mockCommand = {
      data: {
        name: "test",
        toJSON: jest.fn().mockReturnValue({ name: "test" }),
      },
      guildId: "guild123",
      execute: jest.fn(),
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("commands")) return mockCommandFolders;
        if (dirPath.endsWith("admin")) return mockCommandFiles;
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/commands/admin/test.ts"),
      () => ({
        __esModule: true,
        default: mockCommand,
      }),
      { virtual: true }
    );

    await handleCommands(client);

    expect(client.commands.get("test")).toBe(mockCommand as any);
    const restInstance = (REST as unknown as jest.Mock).mock.results[0]
      .value as any;
    expect(restInstance.put).toHaveBeenCalledWith("/apps/guilds/commands", {
      body: [{ name: "test" }],
    });
  });

  it("should handle multiple commands mapping to the exact same guildId", async () => {
    const mockCommand1 = {
      data: {
        name: "cmd1",
        toJSON: jest.fn().mockReturnValue({ name: "cmd1" }),
      },
      guildId: "shared-guild",
    };
    const mockCommand2 = {
      data: {
        name: "cmd2",
        toJSON: jest.fn().mockReturnValue({ name: "cmd2" }),
      },
      guildId: "shared-guild",
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("commands")) return ["admin"];
        if (dirPath.endsWith("admin")) return ["cmd1.ts", "cmd2.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/commands/admin/cmd1.ts"),
      () => ({ __esModule: true, default: mockCommand1 }),
      { virtual: true }
    );
    jest.mock(
      path.join(__dirname, "../../../src/commands/admin/cmd2.ts"),
      () => ({ __esModule: true, default: mockCommand2 }),
      { virtual: true }
    );

    await handleCommands(client);

    const restInstance = (REST as unknown as jest.Mock).mock.results[0]
      .value as any;
    expect(restInstance.put).toHaveBeenCalledWith("/apps/guilds/commands", {
      body: [{ name: "cmd1" }, { name: "cmd2" }],
    });
  });

  it("should handle commands with guildId array", async () => {
    const mockCommand = {
      data: {
        name: "test-array",
        toJSON: jest.fn().mockReturnValue({ name: "test-array" }),
      },
      guildId: ["guild1", "guild2"],
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("commands")) return ["test"];
        if (dirPath.endsWith("test")) return ["test-array.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/commands/test/test-array.ts"),
      () => ({ __esModule: true, default: mockCommand }),
      { virtual: true }
    );

    await handleCommands(client);

    const restInstance = (REST as unknown as jest.Mock).mock.results[0]
      .value as any;
    expect(restInstance.put).toHaveBeenCalledTimes(3); // 1 global (empty) + 2 guild puts
  });

  it("should handle command.data as a function", async () => {
    const mockCommandData = {
      name: "ping-func",
      toJSON: jest.fn().mockReturnValue({ name: "ping-func" }),
    };
    const mockCommand = {
      data: jest.fn<any>().mockResolvedValue(mockCommandData),
      global: true,
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("commands")) return ["utils"];
        if (dirPath.endsWith("utils")) return ["ping-func.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/commands/utils/ping-func.ts"),
      () => ({ __esModule: true, default: mockCommand }),
      { virtual: true }
    );

    await handleCommands(client);

    expect(mockCommand.data).toBe(mockCommandData);
    expect(client.commands.get("ping-func")).toBe(mockCommand as any);
  });

  it("should skip duplicate command names and keep the first-loaded handler", async () => {
    const mockCommand1 = {
      data: {
        name: "duplicate",
        toJSON: jest.fn().mockReturnValue({ name: "duplicate" }),
      },
      global: true,
    };
    const mockCommand2 = {
      data: {
        name: "duplicate",
        toJSON: jest.fn().mockReturnValue({ name: "duplicate" }),
      },
      global: true,
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("commands")) return ["dup_test"];
        if (dirPath.endsWith("dup_test")) return ["cmd1.ts", "cmd2.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/commands/dup_test/cmd1.ts"),
      () => ({ __esModule: true, default: mockCommand1 }),
      { virtual: true }
    );
    jest.mock(
      path.join(__dirname, "../../../src/commands/dup_test/cmd2.ts"),
      () => ({ __esModule: true, default: mockCommand2 }),
      { virtual: true }
    );

    await handleCommands(client);

    // First one registered
    expect(client.commands.get("duplicate")).toBe(mockCommand1 as any);
    // Second one skipped — warning logged
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("registered twice"),
      "warn"
    );
  });

  it("should warn if command has no data", async () => {
    const mockCommand = { global: true };
    mockReaddirSync
      .mockReturnValueOnce(["utils"])
      .mockReturnValueOnce(["invalid.ts"]);

    jest.mock(
      path.join(__dirname, "../../../src/commands/utils/invalid.ts"),
      () => ({ __esModule: true, default: mockCommand }),
      { virtual: true }
    );

    await handleCommands(client);
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("Skipping"),
      "warn"
    );
  });

  it("should warn if command is neither global nor has guildId", async () => {
    const mockCommand = {
      data: { name: "no-scope", toJSON: jest.fn() },
    };
    mockReaddirSync
      .mockReturnValueOnce(["utils"])
      .mockReturnValueOnce(["no-scope.ts"]);

    jest.mock(
      path.join(__dirname, "../../../src/commands/utils/no-scope.ts"),
      () => ({ __esModule: true, default: mockCommand }),
      { virtual: true }
    );

    await handleCommands(client);
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("Skipping"),
      "warn"
    );
  });

  it("should handle missing CLIENT_ID or DEXCHAN_TOKEN", async () => {
    delete process.env.CLIENT_ID;

    await handleCommands(client);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("Missing CLIENT_ID or DEXCHAN_TOKEN"),
      "error"
    );
    expect(REST).not.toHaveBeenCalled();
  });

  it("should handle REST error", async () => {
    const restInstanceMock = {
      setToken: jest.fn().mockReturnThis(),
      put: jest.fn<any>().mockRejectedValue(new Error("REST Error")),
    };
    (REST as unknown as jest.Mock).mockImplementation(() => restInstanceMock);

    await handleCommands(client);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("Failed to reload application (/) commands:"),
      "error"
    );
  });

  it("should handle error during loading a command file", async () => {
    mockReaddirSync
      .mockReturnValueOnce(["utils"])
      .mockReturnValueOnce(["error.ts"]);
    // Dynamic import will throw
    jest.mock(
      path.join(__dirname, "../../../src/commands/utils/error.ts"),
      () => {
        throw new Error("Import Error");
      },
      { virtual: true }
    );

    await handleCommands(client);
    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining("Error loading error.ts"),
      "error"
    );
  });

  it("should load global commands correctly when missing a default export", async () => {
    mockReaddirSync
      .mockReturnValueOnce(["utils"])
      .mockReturnValueOnce(["ping-no-default.ts"]);

    jest.mock(
      path.join(__dirname, "../../../src/commands/utils/ping-no-default.ts"),
      () => ({
        __esModule: true,
        data: {
          name: "ping-no-default",
          toJSON: jest.fn().mockReturnValue({ name: "ping-no-default" }),
        },
        global: true,
      }),
      { virtual: true }
    );

    await handleCommands(client);

    expect(client.commands.get("ping-no-default")).toBeDefined();
    expect(client.commands.get("ping-no-default")?.global).toBe(true);
  });

  it("should abort registration and log an error if payload contains empty strings", async () => {
    const mockCommand = {
      data: {
        name: "bad-cmd",
        toJSON: jest.fn().mockReturnValue({
          name: "bad-cmd",
          description_localizations: { es: "" },
        }),
      },
      global: true,
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("commands")) return ["test"];
        if (dirPath.endsWith("test")) return ["bad-cmd.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/commands/test/bad-cmd.ts"),
      () => ({ __esModule: true, default: mockCommand }),
      { virtual: true }
    );

    await handleCommands(client);

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining(
        "[i18n Error] Empty string detected in command payload at: bad-cmd.description_localizations.es"
      ),
      "error"
    );
    expect(REST).not.toHaveBeenCalled();
  });

  it("should route globals to TEST_GUILD_ID and wipe original globals in DEV MODE", async () => {
    process.env.TEST_GUILD_ID = "dev-guild-123";

    const mockCommand = {
      data: {
        name: "dev-cmd",
        toJSON: jest.fn().mockReturnValue({ name: "dev-cmd" }),
      },
      global: true,
    };

    mockReaddirSync.mockImplementation((dirPath: any) => {
      if (typeof dirPath === "string") {
        if (dirPath.endsWith("commands")) return ["test"];
        if (dirPath.endsWith("test")) return ["dev-cmd.ts"];
      }
      return [];
    });

    jest.mock(
      path.join(__dirname, "../../../src/commands/test/dev-cmd.ts"),
      () => ({ __esModule: true, default: mockCommand }),
      { virtual: true }
    );

    await handleCommands(client);

    expect(REST).toHaveBeenCalled();
    const restInstance = (REST as unknown as jest.Mock).mock.results[0]
      .value as any;

    // 1. Verify it wiped the global commands (empty array)
    expect(restInstance.put).toHaveBeenCalledWith("/apps/commands", {
      body: [],
    });
    // 2. Verify it routed the global command to the test guild endpoint
    expect(restInstance.put).toHaveBeenCalledWith("/apps/guilds/commands", {
      body: [{ name: "dev-cmd" }],
    });
  });
});
