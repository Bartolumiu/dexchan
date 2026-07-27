import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { ChatInputCommandInteraction, Collection } from "discord.js";
import commandsCommand, {
  hasRolePermission,
  hasUserPermission,
} from "../../../src/commands/utils/commands";
import { getInteractionContext } from "../../../src/utils/database";
import { getTranslations } from "../../../src/functions/handlers/handleLocales";
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
    cb({ commands: { commands: { description: "mock_desc" } } });
    return { es: "comandos" };
  }),
}));

jest.mock("discord.js", () => {
  class MockEmbedBuilder {
    setTitle = jest.fn().mockReturnThis();
    setDescription = jest.fn().mockReturnThis();
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
    Collection: Map,
    ApplicationCommandPermissionType: { Role: 1, User: 2, Channel: 3 },
  };
});

describe("commands command", () => {
  let mockInteraction: any;
  let mockClient: any;

  const mockT = {
    title: "Commands List",
    description: "Here are all the available commands.",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (getInteractionContext as jest.Mock<any>).mockResolvedValue({
      locale: "en",
    });
    (getTranslations as jest.Mock).mockReturnValue({
      common: { footers: { command: "Requested by {user}" } },
      commands: {
        commands: { response: mockT },
        normal: { description: "Translated Normal Description" },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Permission Helpers", () => {
    let interactionContext: any;

    beforeEach(() => {
      interactionContext = {
        user: { id: "user_1" },
        member: {
          roles: {
            cache: [{ id: "role_1" }, { id: "role_2" }],
          },
        },
      };
    });

    describe("hasRolePermission", () => {
      it("should return true if the user has a permitted role", () => {
        const perms = [{ type: 1, permission: true, id: "role_2" }];
        expect(hasRolePermission(perms, interactionContext)).toBe(true);
      });

      it("should return false if the user lacks the permitted role", () => {
        const perms = [{ type: 1, permission: true, id: "role_3" }];
        expect(hasRolePermission(perms, interactionContext)).toBe(false);
      });

      it("should return false if the permission is not a role permission (type !== 1)", () => {
        const perms = [{ type: 2, permission: true, id: "role_1" }];
        expect(hasRolePermission(perms, interactionContext)).toBe(false);
      });

      it("should return false if the permission is explicitly set to false", () => {
        const perms = [{ type: 1, permission: false, id: "role_1" }];
        expect(hasRolePermission(perms, interactionContext)).toBe(false);
      });

      it("should safely fall back to an empty array if interaction.member is null", () => {
        interactionContext.member = null; // Edge case: DMs
        const perms = [{ type: 1, permission: true, id: "role_1" }];
        expect(hasRolePermission(perms, interactionContext)).toBe(false);
      });
    });

    describe("hasUserPermission", () => {
      it("should return true if the user matches the permitted user ID", () => {
        const perms = [{ type: 2, permission: true, id: "user_1" }];
        expect(hasUserPermission(perms, interactionContext)).toBe(true);
      });

      it("should return false if the user does not match", () => {
        const perms = [{ type: 2, permission: true, id: "user_2" }];
        expect(hasUserPermission(perms, interactionContext)).toBe(false);
      });

      it("should return false if permission is not a user permission (type !== 2)", () => {
        const perms = [{ type: 1, permission: true, id: "user_1" }];
        expect(hasUserPermission(perms, interactionContext)).toBe(false);
      });

      it("should return false if the user permission is explicitly set to false", () => {
        const perms = [{ type: 2, permission: false, id: "user_1" }];
        expect(hasUserPermission(perms, interactionContext)).toBe(false);
      });
    });
  });

  describe("execute", () => {
    beforeEach(() => {
      // Create a mock permissions map
      const mockPermsMap = new Map();
      mockPermsMap.set("cmd_override_role", [
        { type: 1, permission: true, id: "my_role" },
      ]);
      mockPermsMap.set("cmd_override_user", [
        { type: 2, permission: true, id: "my_user" },
      ]);
      mockPermsMap.set("cmd_override_fail", [
        { type: 2, permission: true, id: "other_user" },
      ]);

      mockInteraction = {
        commandName: "commands",
        user: { id: "my_user", username: "TestUser" },
        member: { roles: { cache: [{ id: "my_role" }] } },
        memberPermissions: {
          has: jest.fn((perm) => perm === "ADMIN"), // Only has ADMIN permission
        },
        guild: {
          commands: {
            fetch: jest.fn<any>().mockResolvedValue(
              new Collection([
                [
                  "cmd_override_role",
                  {
                    id: "cmd_override_role",
                    name: "role_cmd",
                    description: "Role CMD",
                  },
                ],
                [
                  "cmd_override_user",
                  {
                    id: "cmd_override_user",
                    name: "user_cmd",
                    description: "User CMD",
                  },
                ],
                [
                  "cmd_override_fail",
                  {
                    id: "cmd_override_fail",
                    name: "fail_cmd",
                    description: "Fail CMD",
                  },
                ],
                [
                  "cmd_no_desc",
                  { id: "cmd_no_desc", name: "nodesc", description: "" }, // Test fallback to name
                ],
              ])
            ),
            permissions: {
              fetch: jest.fn<any>().mockResolvedValue(mockPermsMap),
            },
          },
        },
        reply: jest.fn<any>().mockResolvedValue(true),
      };

      mockClient = {
        application: {
          commands: {
            fetch: jest.fn<any>().mockResolvedValue(
              new Collection([
                [
                  "cmd_normal",
                  { id: "cmd_normal", name: "normal", description: "Normal" },
                ],
                [
                  "cmd_perm_pass",
                  {
                    id: "cmd_perm_pass",
                    name: "pass",
                    description: "Pass",
                    defaultMemberPermissions: "ADMIN",
                  },
                ],
                [
                  "cmd_perm_fail",
                  {
                    id: "cmd_perm_fail",
                    name: "fail",
                    description: "Fail",
                    defaultMemberPermissions: "BAN_MEMBERS",
                  },
                ],
              ])
            ),
          },
        },
        user: {
          displayAvatarURL: jest
            .fn()
            .mockReturnValue("https://avatar.url/avatar.png"),
        },
      };
    });

    it("should fetch commands, filter them, and build the embed with localized descriptions", async () => {
      await commandsCommand.execute(
        mockInteraction as ChatInputCommandInteraction,
        mockClient as ExtendedClient
      );

      expect(mockClient.application.commands.fetch).toHaveBeenCalled();
      expect(mockInteraction.guild.commands.fetch).toHaveBeenCalled();
      expect(
        mockInteraction.guild.commands.permissions.fetch
      ).toHaveBeenCalledWith({});

      const replyArg = mockInteraction.reply.mock.calls[0][0];
      const embed = replyArg.embeds[0];
      const fields = embed.addFields.mock.calls[0][0];

      // "normal" should get translated description from our mock
      // The rest should fall back gracefully to their default descriptions or names
      expect(fields).toEqual([
        { name: "/normal", value: "Translated Normal Description" }, // Localized
        { name: "/pass", value: "Pass" }, // Fallback to description
        { name: "/role_cmd", value: "Role CMD" }, // Fallback to description
        { name: "/user_cmd", value: "User CMD" }, // Fallback to description
        { name: "/nodesc", value: "nodesc" }, // Fallback to name
      ]);

      expect(embed.setTitle).toHaveBeenCalledWith("Commands List");
      expect(embed.setDescription).toHaveBeenCalledWith(
        "Here are all the available commands."
      );
      expect(embed.setColor).toHaveBeenCalledWith("Blurple");
      expect(embed.setFooter).toHaveBeenCalledWith({
        text: "FORMATTED_Requested by {user}_commands_TestUser",
        iconURL: "https://avatar.url/avatar.png",
      });
      expect(embed.setTimestamp).toHaveBeenCalled();
    });

    it("should safely handle an undefined client.user object", async () => {
      mockClient.user = undefined;

      await commandsCommand.execute(
        mockInteraction as ChatInputCommandInteraction,
        mockClient as ExtendedClient
      );

      const replyArg = mockInteraction.reply.mock.calls[0][0];
      const embed = replyArg.embeds[0];

      expect(embed.setFooter).toHaveBeenCalledWith({
        text: "FORMATTED_Requested by {user}_commands_TestUser",
        iconURL: undefined,
      });
    });
  });
});
