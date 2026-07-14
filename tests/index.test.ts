import { afterEach, beforeEach, describe, expect, it, jest, } from "@jest/globals";

// Statically mock dotenv
jest.mock("dotenv/config", () => ({}));

describe("index.ts - Main Entry Point", () => {
  let processExitSpy: any;
  let mockInitializeApplication: jest.Mock<any>;
  let mockLogMessage: jest.Mock<any>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Backup environment variables
    originalEnv = { ...process.env };

    // Clear the module cache so index.ts evaluates fully on every require()
    jest.resetModules();

    // Reinitialise fresh mock functions for each test isolation
    mockInitializeApplication = jest.fn<any>().mockResolvedValue(undefined);
    mockLogMessage = jest.fn<any>().mockResolvedValue(undefined);

    // Dynamically mock the app library inside the isolated environment
    jest.doMock("../src/lib/app", () => ({
      initializeApplication: mockInitializeApplication,
      logMessage: mockLogMessage,
    }));

    processExitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    // Restore the environment and spies
    process.env = originalEnv;
    processExitSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("should successfully initialize the application", async () => {
    process.env.DEXCHAN_TOKEN = "valid-token";

    // Require the module to trigger the bootstrap() IIFE
    require("../src/index");

    // Allow the event loop to flush the async promises
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockInitializeApplication).toHaveBeenCalledWith({
      token: "valid-token",
    });
    expect(processExitSpy).not.toHaveBeenCalled();
    expect(mockLogMessage).not.toHaveBeenCalled(); // No critical errors logged
  });

  it("should log a critical error and exit if DEXCHAN_TOKEN is missing", async () => {
    delete process.env.DEXCHAN_TOKEN;

    require("../src/index");

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogMessage).toHaveBeenCalledWith(
      "DEXCHAN_TOKEN is not defined in the environment variables.",
      "critical"
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(mockInitializeApplication).not.toHaveBeenCalled();
  });

  it("should catch initialization errors, log them critically, and exit", async () => {
    process.env.DEXCHAN_TOKEN = "valid-token";
    mockInitializeApplication.mockRejectedValue(new Error("Init failed"));

    require("../src/index");

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockInitializeApplication).toHaveBeenCalledWith({
      token: "valid-token",
    });
    expect(mockLogMessage).toHaveBeenCalledWith(
      "Application failed to start: Init failed",
      "critical"
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("should gracefully handle non-Error objects thrown during initialization", async () => {
    process.env.DEXCHAN_TOKEN = "valid-token";
    mockInitializeApplication.mockRejectedValue("String-based error");

    require("../src/index");

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockLogMessage).toHaveBeenCalledWith(
      "Application failed to start: String-based error",
      "critical"
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
