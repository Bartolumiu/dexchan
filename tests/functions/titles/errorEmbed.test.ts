import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { Colors, RepliableInteraction } from "discord.js";
import { sendErrorEmbed } from "../../../src/functions/titles/errorEmbed";
import { logMessage } from "../../../src/lib/app";

// Mock the app logger
jest.mock("../../../src/lib/app", () => ({
  logMessage: jest.fn(),
}));

describe("sendErrorEmbed", () => {
  let mockInteraction: any;
  let mockEmbed: any;
  let commandErrors: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInteraction = {
      isMessageComponent: jest.fn().mockReturnValue(false),
      reply: jest.fn<any>().mockResolvedValue(undefined),
      editReply: jest.fn<any>().mockResolvedValue(undefined),
    };

    mockEmbed = {
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setColor: jest.fn().mockReturnThis(),
    };

    commandErrors = {
      api: "An API error occurred.",
      not_found: "The requested title '{id}' was not found in {source}.",
      no_replacements: "Just a generic error.",
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return early and do nothing if embed is null or undefined", async () => {
    await sendErrorEmbed(
      mockInteraction as RepliableInteraction,
      commandErrors,
      "Error",
      null,
      "not_found"
    );

    expect(mockInteraction.reply).not.toHaveBeenCalled();
    expect(mockInteraction.editReply).not.toHaveBeenCalled();
  });

  it("should return early if the calculated description is undefined", async () => {
    // Providing a key that does not exist in commandErrors
    await sendErrorEmbed(
      mockInteraction as RepliableInteraction,
      commandErrors,
      "Error",
      mockEmbed as any,
      "missing_key"
    );

    expect(mockEmbed.setTitle).not.toHaveBeenCalled();
    expect(mockInteraction.editReply).not.toHaveBeenCalled();
  });

  it("should use commandErrors.api and interaction.reply if interaction is a MessageComponent", async () => {
    mockInteraction.isMessageComponent.mockReturnValue(true);

    await sendErrorEmbed(
      mockInteraction as RepliableInteraction,
      commandErrors,
      "Global Error",
      mockEmbed as any,
      "not_found" // Should ignore this and use 'api' instead
    );

    expect(mockEmbed.setDescription).toHaveBeenCalledWith(
      "An API error occurred."
    );
    expect(mockInteraction.reply).toHaveBeenCalledWith({
      embeds: [mockEmbed],
      ephemeral: true,
    });
    expect(mockInteraction.editReply).not.toHaveBeenCalled();
  });

  it("should use commandErrors[errorKey] and interaction.editReply if interaction is NOT a MessageComponent", async () => {
    mockInteraction.isMessageComponent.mockReturnValue(false);

    await sendErrorEmbed(
      mockInteraction as RepliableInteraction,
      commandErrors,
      "Global Error",
      mockEmbed as any,
      "no_replacements"
    );

    expect(mockEmbed.setDescription).toHaveBeenCalledWith(
      "Just a generic error."
    );
    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      embeds: [mockEmbed],
      ephemeral: true,
    });
    expect(mockInteraction.reply).not.toHaveBeenCalled();
  });

  it("should correctly perform string replacements", async () => {
    await sendErrorEmbed(
      mockInteraction as RepliableInteraction,
      commandErrors,
      "Global Error",
      mockEmbed as any,
      "not_found",
      { id: 12345, source: "MangaDex" } // Mix of number and string to test casting
    );

    expect(mockEmbed.setTitle).toHaveBeenCalledWith("Global Error");
    expect(mockEmbed.setDescription).toHaveBeenCalledWith(
      "The requested title '12345' was not found in MangaDex."
    );
    expect(mockEmbed.setColor).toHaveBeenCalledWith(Colors.Red);
  });

  it("should catch and log error if sending the reply fails (with Error object)", async () => {
    mockInteraction.editReply.mockRejectedValue(new Error("Timeout"));

    await sendErrorEmbed(
      mockInteraction as RepliableInteraction,
      commandErrors,
      "Global Error",
      mockEmbed as any,
      "no_replacements"
    );

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining(
        "[ErrorEmbed] Failed to send or edit reply. Interaction may have expired: Timeout"
      ),
      "error"
    );
  });

  it("should catch and log error if sending the reply fails (with string primitive)", async () => {
    mockInteraction.isMessageComponent.mockReturnValue(true);
    mockInteraction.reply.mockRejectedValue("Unknown Discord API error");

    await sendErrorEmbed(
      mockInteraction as RepliableInteraction,
      commandErrors,
      "Global Error",
      mockEmbed as any,
      "api"
    );

    expect(logMessage).toHaveBeenCalledWith(
      expect.stringContaining(
        "[ErrorEmbed] Failed to send or edit reply. Interaction may have expired: Unknown Discord API error"
      ),
      "error"
    );
  });
});
