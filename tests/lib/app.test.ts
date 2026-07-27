import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  connectDB,
  createClient,
  initializeApplication,
  logMessage,
} from "../../src/lib/app";
import { ExtendedClient } from "../../src/lib/ExtendedClient";
import { GatewayIntentBits } from "discord.js";
import { prisma } from "../../src/utils/prisma";

jest.mock("../../src/utils/prisma", () => ({
  prisma: {
    $connect: jest.fn(),
  },
}));

jest.mock("../../src/functions/tools/getChalk", () => {
  return jest.fn<any>().mockResolvedValue({
    blueBright: jest.fn((text: string) => text),
    yellowBright: jest.fn((text: string) => text),
    redBright: jest.fn((text: string) => text),
    gray: jest.fn((text: string) => text),
    greenBright: jest.fn((text: string) => text),
    // Mock the chained chalk properties correctly
    bgRedBright: {
      blackBright: jest.fn((text: string) => text),
    },
  });
});

jest.mock("../../src/functions/handlers/handleEvents", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../src/functions/handlers/handleCommands", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../src/functions/handlers/handleComponents", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../src/lib/ExtendedClient", () => {
  return {
    ExtendedClient: jest.fn().mockImplementation(() => ({
      version: "1.0.0",
      login: jest.fn<any>().mockResolvedValue("token"),
      user: { tag: "Bot#1234" },
      guilds: { fetch: jest.fn<any>().mockResolvedValue(undefined) },
    })),
  };
});

describe("app.ts", () => {
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("createClient", () => {
    it("should instantiate an ExtendedClient with correct intents", () => {
      const client = createClient();
      expect(client).toBeDefined();
      expect(ExtendedClient).toHaveBeenCalledWith(
        {
          intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
        },
        expect.any(String)
      );
    });
  });

  describe("connectDB", () => {
    it("should connect to Prisma successfully", async () => {
      (prisma.$connect as jest.Mock<any>).mockResolvedValue(undefined);
      await connectDB();
      expect(prisma.$connect).toHaveBeenCalled();
    });

    it("should exit process if connection fails", async () => {
      const exitSpy = jest
        .spyOn(process, "exit")
        .mockImplementation((() => {}) as any);
      (prisma.$connect as jest.Mock<any>).mockRejectedValue(
        new Error("Connection Error")
      );

      await connectDB();

      // Expect the single interpolated string outputted by logMessage
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Database] Failed to connect: Error: Connection Error"
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe("logMessage (Chalk Success)", () => {
    it("should log info (default)", async () => {
      await logMessage("Info msg");
      expect(consoleLogSpy).toHaveBeenCalledWith("Info msg");
    });

    it("should log warn", async () => {
      await logMessage("Warn msg", "warn");
      expect(consoleWarnSpy).toHaveBeenCalledWith("Warn msg");
    });

    it("should log error", async () => {
      await logMessage("Error msg", "error");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error msg");
    });

    it("should log critical", async () => {
      await logMessage("Critical msg", "critical");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Critical msg");
    });

    it("should log debug", async () => {
      await logMessage("Debug msg", "debug");
      expect(consoleLogSpy).toHaveBeenCalledWith("Debug msg");
    });

    it("should log success", async () => {
      await logMessage("Success msg", "success");
      expect(consoleLogSpy).toHaveBeenCalledWith("Success msg");
    });
  });

  describe("logMessage (Chalk Failure Fallback)", () => {
    beforeEach(() => {
      const getChalk = require("../../src/functions/tools/getChalk");
      (getChalk as jest.Mock<any>).mockRejectedValueOnce(
        new Error("Module not found")
      );
    });

    it("should fallback to basic console.log for info", async () => {
      await logMessage("Fallback info", "info");
      expect(consoleLogSpy).toHaveBeenCalledWith("Fallback info");
    });

    it("should fallback to basic console.warn for warn", async () => {
      await logMessage("Fallback warn", "warn");
      expect(consoleWarnSpy).toHaveBeenCalledWith("Fallback warn");
    });

    it("should fallback to basic console.error for error", async () => {
      await logMessage("Fallback error", "error");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Fallback error");
    });

    it("should fallback to basic console.error for critical", async () => {
      await logMessage("Fallback critical", "critical");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Fallback critical");
    });
  });

  describe("initializeApplication", () => {
    it("should run the full app initialization lifecycle", async () => {
      (prisma.$connect as jest.Mock).mockResolvedValue(undefined as never);
      const client = await initializeApplication({ token: "test-token" });

      expect(client.login).toHaveBeenCalledWith("test-token");
      expect(client.guilds.fetch).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("✅ Ready as")
      );
    });

    it("should log a warning if guilds.fetch fails", async () => {
      (prisma.$connect as jest.Mock).mockResolvedValue(undefined as never);
      const ExtendedClientMock =
        require("../../src/lib/ExtendedClient").ExtendedClient;
      ExtendedClientMock.mockImplementation(() => ({
        version: "1.0.0",
        login: jest.fn<any>().mockResolvedValue("token"),
        user: { tag: "Bot#1234" },
        guilds: {
          fetch: jest.fn<any>().mockRejectedValue(new Error("Rate limited")),
        },
      }));

      const client = await initializeApplication({ token: "test-token" });

      expect(client.guilds.fetch).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to fetch guilds: Error: Rate limited"
      );
      expect(client.login).toHaveBeenCalledWith("test-token");
    });
  });
});
