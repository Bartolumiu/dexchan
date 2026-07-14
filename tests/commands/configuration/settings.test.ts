import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import settingsCommand from "../../../src/commands/configuration/settings";
import { getInteractionContext } from "../../../src/utils/database";
import {
  getAvailableLocales,
  getTranslations,
} from "../../../src/functions/handlers/handleLocales";
import { prisma } from "../../../src/utils/prisma";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";

jest.mock("../../../src/utils/database", () => ({
  getInteractionContext: jest.fn(),
}));

jest.mock("../../../src/utils/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../../src/functions/handlers/handleLocales", () => ({
  format: jest.fn((str: string, vars: any) =>
    str
      .replace("{locale}", vars.locale || "")
      .replace("{commandName}", vars.commandName || "")
      .replace("{user}", vars.user || "")
  ),
  getAvailableLocales: jest.fn(),
  getTranslations: jest.fn(),
  translate: jest.fn((code: string) => `Translated_${code}`),
  translateAttribute: jest.fn((cb: (t: any) => void) => {
    cb({
      commands: {
        settings: {
          description: "desc",
          view: { description: "desc" },
          locale: {
            description: "desc",
            set: {
              description: "desc",
              options: { locale: "desc" },
            },
            reset: { description: "desc" },
          },
        },
      },
    });
    return { en: "mocked_localization" };
  }),
}));

jest.mock("discord.js", () => {
  const mockBuilder: any = {
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setDescriptionLocalizations: jest.fn().mockReturnThis(),
    setAutocomplete: jest.fn().mockReturnThis(),
    setRequired: jest.fn().mockReturnThis(),
    addSubcommand: jest.fn(function (this: any, cb: any) {
      cb(mockBuilder);
      return this;
    }),
    addSubcommandGroup: jest.fn(function (this: any, cb: any) {
      cb(mockBuilder);
      return this;
    }),
    addStringOption: jest.fn(function (this: any, cb: any) {
      cb(mockBuilder);
      return this;
    }),
  };

  class MockEmbedBuilder {
    setTitle = jest.fn().mockReturnThis();
    setDescription = jest.fn().mockReturnThis();
    setColor = jest.fn().mockReturnThis();
    setFooter = jest.fn().mockReturnThis();
    addFields = jest.fn().mockReturnThis();
  }

  return {
    EmbedBuilder: MockEmbedBuilder,
    SlashCommandBuilder: jest.fn(() => mockBuilder),
    Colors: { Red: "Red", Green: "Green", Blue: "Blue" },
  };
});

describe("settings command", () => {
  let mockInteraction: any;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {} as ExtendedClient;

    (getInteractionContext as jest.Mock<any>).mockResolvedValue({
      locale: "en",
    });

    (getAvailableLocales as jest.Mock<any>).mockReturnValue([
      { name: "English", code: "en", enabled: true },
      { name: "Spanish", code: "es", enabled: true },
      { name: "DisabledLang", code: "xx", enabled: false },
    ]);

    (getTranslations as jest.Mock<any>).mockReturnValue({
      common: {
        footers: { command: "Footer {commandName} {user}" },
        words: { error: "Error Title" },
        errors: { unknown: "Unknown Error" },
      },
      commands: {
        settings: {
          view: {
            embed: {
              title: "View Title",
              description: "View Desc",
              fields: { locale: "Locale Field" },
            },
          },
          locale: {
            set: {
              success: {
                title: "Set Success Title",
                description: "Set Success Desc {locale}",
              },
              error: {
                invalid_locale: "Set Invalid Title",
                no_changes: "Set No Changes Title",
              },
            },
            reset: {
              success: {
                title: "Reset Success Title",
                description: "Reset Success Desc",
              },
              error: {
                description: "Reset Error Desc",
              },
            },
          },
        },
      },
    });

    // Default interaction setup
    mockInteraction = {
      commandName: "settings",
      locale: "es-ES",
      user: {
        id: "user_123",
        username: "TestUser",
        displayAvatarURL: () => "avatar.png",
      },
      reply: jest.fn<any>().mockResolvedValue(true),
      options: {
        getSubcommandGroup: jest.fn().mockReturnValue(null),
        getSubcommand: jest.fn().mockReturnValue("view"),
        getString: jest.fn().mockReturnValue(null),
      },
    };
  });

  describe("execute router", () => {
    it("should route to viewSettings", async () => {
      mockInteraction.options.getSubcommandGroup.mockReturnValue(null);
      mockInteraction.options.getSubcommand.mockReturnValue("view");

      await settingsCommand.execute!(
        mockInteraction as ChatInputCommandInteraction,
        mockClient
      );

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it("should route to localeSettings", async () => {
      mockInteraction.options.getSubcommandGroup.mockReturnValue("locale");
      mockInteraction.options.getSubcommand.mockReturnValue("reset");
      (prisma.user.update as jest.Mock<any>).mockResolvedValue({});

      await settingsCommand.execute!(
        mockInteraction as ChatInputCommandInteraction,
        mockClient
      );

      expect(prisma.user.update).toHaveBeenCalled();
      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it("should return early if subcommand is unknown", async () => {
      mockInteraction.options.getSubcommandGroup.mockReturnValue(null);
      mockInteraction.options.getSubcommand.mockReturnValue("unknown");

      await settingsCommand.execute!(
        mockInteraction as ChatInputCommandInteraction,
        mockClient
      );

      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });
  });

  describe("localeSettings - set", () => {
    beforeEach(() => {
      mockInteraction.options.getSubcommandGroup.mockReturnValue("locale");
      mockInteraction.options.getSubcommand.mockReturnValue("set");
    });

    it("should send error if locale is invalid (not in enabled availableLocales)", async () => {
      mockInteraction.options.getString.mockReturnValue("invalid_code");

      await settingsCommand.execute!(
        mockInteraction as ChatInputCommandInteraction,
        mockClient
      );

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const embed = replyCall.embeds[0];
      expect(embed.setTitle).toHaveBeenCalledWith("Set Invalid Title");
      expect(embed.setColor).toHaveBeenCalledWith("Red");
    });

    it("should send error if user already has the requested locale", async () => {
      mockInteraction.options.getString.mockReturnValue("es");
      (prisma.user.findUnique as jest.Mock<any>).mockResolvedValue({
        preferredLocale: "es",
      });

      await settingsCommand.execute!(
        mockInteraction as ChatInputCommandInteraction,
        mockClient
      );

      expect(prisma.user.upsert).not.toHaveBeenCalled();
      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const embed = replyCall.embeds[0];
      expect(embed.setTitle).toHaveBeenCalledWith("Set No Changes Title");
      expect(embed.setColor).toHaveBeenCalledWith("Red");
    });

    it("should upsert user and send success on valid locale change", async () => {
      mockInteraction.options.getString.mockReturnValue("es");
      (prisma.user.findUnique as jest.Mock<any>).mockResolvedValue(null);
      (prisma.user.upsert as jest.Mock<any>).mockResolvedValue({});

      await settingsCommand.execute!(
        mockInteraction as ChatInputCommandInteraction,
        mockClient
      );

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { id: "user_123" },
        update: { preferredLocale: "es" },
        create: { id: "user_123", preferredLocale: "es" },
      });
      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const embed = replyCall.embeds[0];
      expect(embed.setTitle).toHaveBeenCalledWith("Set Success Title");
      expect(embed.setColor).toHaveBeenCalledWith("Green");
    });

    it("should send unknown error if database throws during set", async () => {
      mockInteraction.options.getString.mockReturnValue("es");
      (prisma.user.findUnique as jest.Mock<any>).mockRejectedValue(
        new Error("DB Failure")
      );

      await settingsCommand.execute!(
        mockInteraction as ChatInputCommandInteraction,
        mockClient
      );

      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const embed = replyCall.embeds[0];
      expect(embed.setTitle).toHaveBeenCalledWith("Error Title");
      expect(embed.setColor).toHaveBeenCalledWith("Red");
    });
  });

  describe("localeSettings - reset", () => {
    beforeEach(() => {
      mockInteraction.options.getSubcommandGroup.mockReturnValue("locale");
      mockInteraction.options.getSubcommand.mockReturnValue("reset");
    });

    it("should update user and send success on reset", async () => {
      (prisma.user.update as jest.Mock<any>).mockResolvedValue({});

      await settingsCommand.execute!(
        mockInteraction as ChatInputCommandInteraction,
        mockClient
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user_123" },
        data: { preferredLocale: null },
      });
      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const embed = replyCall.embeds[0];
      expect(embed.setTitle).toHaveBeenCalledWith("Reset Success Title");
      expect(embed.setColor).toHaveBeenCalledWith("Green");
      expect(getTranslations).toHaveBeenCalledWith("es-ES");
    });

    it("should send error if database throws during reset", async () => {
      (prisma.user.update as jest.Mock<any>).mockRejectedValue(
        new Error("DB Failure")
      );

      await settingsCommand.execute!(
        mockInteraction as ChatInputCommandInteraction,
        mockClient
      );

      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const embed = replyCall.embeds[0];
      expect(embed.setTitle).toHaveBeenCalledWith("Error Title");
      expect(embed.setColor).toHaveBeenCalledWith("Red");
    });
  });

  describe("viewSettings", () => {
    it("should populate the embed with current locale settings", async () => {
      mockInteraction.options.getSubcommandGroup.mockReturnValue(null);
      mockInteraction.options.getSubcommand.mockReturnValue("view");

      await settingsCommand.execute!(
        mockInteraction as ChatInputCommandInteraction,
        mockClient
      );

      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const embed = replyCall.embeds[0];
      expect(embed.setTitle).toHaveBeenCalledWith("View Title");
      expect(embed.addFields).toHaveBeenCalledWith({
        name: "Locale Field",
        value: "Translated_en", // Translates the 'en' from context
        inline: true,
      });
      expect(embed.setColor).toHaveBeenCalledWith("Blue");
    });
  });

  describe("autocomplete", () => {
    let mockAutocompleteInteraction: any;

    beforeEach(() => {
      mockAutocompleteInteraction = {
        options: {
          getSubcommandGroup: jest.fn().mockReturnValue("locale"),
          getSubcommand: jest.fn().mockReturnValue("set"),
          getString: jest.fn().mockReturnValue(null),
        },
        respond: jest.fn<any>().mockResolvedValue(true),
      };
    });

    it("should return all enabled locales if no input is provided", async () => {
      await settingsCommand.autocomplete!(
        mockAutocompleteInteraction as AutocompleteInteraction,
        mockClient
      );

      expect(mockAutocompleteInteraction.respond).toHaveBeenCalledWith([
        { name: "English", value: "en" },
        { name: "Spanish", value: "es" },
      ]);
    });

    it("should filter by name correctly", async () => {
      mockAutocompleteInteraction.options.getString.mockReturnValue("eng"); // Matches "English"

      await settingsCommand.autocomplete!(
        mockAutocompleteInteraction as AutocompleteInteraction,
        mockClient
      );

      expect(mockAutocompleteInteraction.respond).toHaveBeenCalledWith([
        { name: "English", value: "en" },
      ]);
    });

    it("should filter by code correctly", async () => {
      mockAutocompleteInteraction.options.getString.mockReturnValue("ES"); // Matches "es"

      await settingsCommand.autocomplete!(
        mockAutocompleteInteraction as AutocompleteInteraction,
        mockClient
      );

      expect(mockAutocompleteInteraction.respond).toHaveBeenCalledWith([
        { name: "Spanish", value: "es" },
      ]);
    });

    it("should do nothing if the subcommand is not locale > set", async () => {
      mockAutocompleteInteraction.options.getSubcommand.mockReturnValue(
        "reset"
      );

      await settingsCommand.autocomplete!(
        mockAutocompleteInteraction as AutocompleteInteraction,
        mockClient
      );

      expect(mockAutocompleteInteraction.respond).not.toHaveBeenCalled();
    });

    it("should safely handle an undefined subcommand group", async () => {
      mockAutocompleteInteraction.options.getSubcommandGroup.mockReturnValue(
        null
      );

      await settingsCommand.autocomplete!(
        mockAutocompleteInteraction as AutocompleteInteraction,
        mockClient
      );

      expect(mockAutocompleteInteraction.respond).not.toHaveBeenCalled();
    });
  });
});
