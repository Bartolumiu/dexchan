import { afterEach, beforeEach, describe, expect, it, jest, } from "@jest/globals";
import { ChatInputCommandInteraction } from "discord.js";
import helpCommand from "../../../src/commands/utils/help";
import { getInteractionContext } from "../../../src/utils/database";
import { format, getTranslations, } from "../../../src/functions/handlers/handleLocales";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";

// --- Mocking Dependencies ---

jest.mock("../../../src/utils/database", () => ({
  getInteractionContext: jest.fn(),
}));

jest.mock("../../../src/functions/handlers/handleLocales", () => ({
  format: jest.fn(
    (str, vars: any) => `FORMATTED_${str}_${vars.commandName}_${vars.user}`
  ),
  getTranslations: jest.fn(),
  translateAttribute: jest.fn((cb: any) => {
    cb({
      commands: {
        help: {
          description: "mock_description",
        },
      },
    });
    return { es: "ayuda" };
  }),
}));

jest.mock("discord.js", () => {
  class MockEmbedBuilder {
    setTitle = jest.fn().mockReturnThis();
    addFields = jest.fn().mockReturnThis();
    setColor = jest.fn().mockReturnThis();
    setFooter = jest.fn().mockReturnThis();
    setTimestamp = jest.fn().mockReturnThis();
  }

  class MockSlashCommandBuilder {
    setName = jest.fn().mockReturnThis();
    setDescription = jest.fn().mockReturnThis();
    setDescriptionLocalizations = jest.fn().mockReturnThis();
  }

  return {
    EmbedBuilder: MockEmbedBuilder,
    SlashCommandBuilder: MockSlashCommandBuilder,
    Colors: { Blurple: "Blurple" },
  };
});

describe("help command", () => {
  let mockInteraction: any;
  let mockClient: any;

  const mockT = {
    title: "Help Title",
    fields: {
      commands: { name: "Commands", value: "List of commands" },
      support: { name: "Support", value: "Support server link" },
      invite: { name: "Invite", value: "Invite link" },
      stats: { name: "Stats", value: "Bot stats" },
      uptime: { name: "Uptime", value: "Bot uptime" },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (getInteractionContext as jest.Mock<any>).mockResolvedValue({
      locale: "en",
    });
    // FIX: Removed 'utils' and added the common footer
    (getTranslations as jest.Mock).mockReturnValue({
      common: { footers: { command: "Footer text" } },
      commands: { help: { response: mockT } },
    });

    mockInteraction = {
      commandName: "help",
      user: { username: "TestUser" },
      reply: jest.fn<any>().mockResolvedValue(true),
    };

    mockClient = {
      user: {
        displayAvatarURL: jest
          .fn()
          .mockReturnValue("https://avatar.url/avatar.png"),
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should execute and build the embed correctly", async () => {
    await helpCommand.execute(
      mockInteraction as ChatInputCommandInteraction,
      mockClient as ExtendedClient
    );

    // Verify context and translations were fetched
    expect(getInteractionContext).toHaveBeenCalledWith(mockInteraction);
    expect(getTranslations).toHaveBeenCalledWith("en");
    expect(format).toHaveBeenCalledWith("Footer text", {
      commandName: "help",
      user: "TestUser",
    });

    // Verify embed construction
    expect(mockInteraction.reply).toHaveBeenCalled();
    const replyArg = mockInteraction.reply.mock.calls[0][0];
    const embed = replyArg.embeds[0];

    expect(embed.setTitle).toHaveBeenCalledWith("Help Title");
    expect(embed.addFields).toHaveBeenCalledWith(
      { name: "Commands", value: "List of commands" },
      { name: "Support", value: "Support server link" },
      { name: "Invite", value: "Invite link" },
      { name: "Stats", value: "Bot stats" },
      { name: "Uptime", value: "Bot uptime" }
    );
    expect(embed.setColor).toHaveBeenCalledWith("Blurple");
    expect(embed.setFooter).toHaveBeenCalledWith({
      text: "FORMATTED_Footer text_help_TestUser",
      iconURL: "https://avatar.url/avatar.png",
    });
    expect(embed.setTimestamp).toHaveBeenCalled();
  });

  it("should safely handle an undefined client.user object", async () => {
    mockClient.user = undefined;

    await helpCommand.execute(
      mockInteraction as ChatInputCommandInteraction,
      mockClient as ExtendedClient
    );

    const replyArg = mockInteraction.reply.mock.calls[0][0];
    const embed = replyArg.embeds[0];

    expect(embed.setFooter).toHaveBeenCalledWith({
      text: "FORMATTED_Footer text_help_TestUser",
      iconURL: undefined, // Safely returns undefined instead of crashing
    });
  });
});
