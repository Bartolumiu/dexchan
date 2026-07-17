import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { Collection, Events } from "discord.js";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";
import * as fs from "node:fs";
import { logMessage } from "../../../src/lib/app";

// Bypass TS1192 "no default export" error by importing as a namespace
import * as interactionCreateModule from "../../../src/events/client/interactionCreate";

const interactionCreateEvent: any =
  (interactionCreateModule as any).default || interactionCreateModule;

// Blind mock for EmbedBuilder to bypass silent Discord.js validation throws
jest.mock("discord.js", () => {
  const original = jest.requireActual("discord.js") as any;
  return {
    ...original,
    EmbedBuilder: class {
      data: any = {};
      setTitle(t: string) {
        this.data.title = t;
        return this;
      }
      setDescription(d: string) {
        this.data.description = d;
        return this;
      }
      setColor(c: any) {
        this.data.color = c;
        return this;
      }
      addFields(f: any) {
        this.data.fields = f;
        return this;
      }
      setFooter(f: any) {
        this.data.footer = f;
        return this;
      }
    },
  };
});

// Mock dependencies
jest.mock("node:fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock("../../../src/lib/app", () => ({
  logMessage: jest.fn(),
}));

jest.mock("../../../src/utils/database", () => ({
  getInteractionContext: jest.fn<any>().mockResolvedValue({ locale: "en" }),
}));

jest.mock("../../../src/functions/handlers/handleLocales", () => ({
  format: jest.fn((str: string) => str),
  getTranslations: jest.fn().mockReturnValue({
    error_embed: {
      title: "Err",
      description: "Err",
      stack: "Stack",
      message: "Msg",
      no_stack: "No Stack",
      timeout: { title: "Timeout", description: "T/O", note: "Note" },
      err_int_ch_input: "Chat",
      err_int_btn: "Btn",
      err_int_slct: "Slct",
      err_int_ctx: "Ctx",
      err_int_mod: "Mod",
      err_int_auto: "Auto",
    },
  }),
}));

describe("InteractionCreate Event", () => {
  let client: ExtendedClient;

  // Helper factory to create interaction stubs
  const createMockInteraction = (overrides = {}) => ({
    isChatInputCommand: jest.fn().mockReturnValue(false),
    isButton: jest.fn().mockReturnValue(false),
    isAnySelectMenu: jest.fn().mockReturnValue(false),
    isContextMenuCommand: jest.fn().mockReturnValue(false),
    isModalSubmit: jest.fn().mockReturnValue(false),
    isAutocomplete: jest.fn().mockReturnValue(false),
    isCommand: jest.fn().mockReturnValue(false),
    isMessageComponent: jest.fn().mockReturnValue(false),
    isRepliable: jest.fn().mockReturnValue(true),
    commandName: "test-cmd",
    customId: "test-id",
    type: 100,
    user: { tag: "User#1234", id: "123", displayAvatarURL: () => "url" },
    options: { data: { arg: "value" } },
    reply: jest.fn<any>().mockResolvedValue(true),
    followUp: jest.fn<any>().mockResolvedValue(true),
    replied: false,
    deferred: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    client = {
      user: { displayAvatarURL: () => "url" },
      commands: new Collection(),
      buttons: new Collection(),
      selectMenus: new Collection(),
      modals: new Collection(),
    } as unknown as ExtendedClient;

    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should have correct event properties", () => {
    expect(interactionCreateEvent.name).toBe(Events.InteractionCreate);
  });

  describe("Routing Interactions", () => {
    it("should route ChatInputCommand", async () => {
      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
      });
      const executeMock = jest.fn<any>();
      client.commands.set("test-cmd", { execute: executeMock } as any);

      await interactionCreateEvent.execute(client, interaction as any);
      expect(executeMock).toHaveBeenCalledWith(interaction, client);
    });

    it("should route Button", async () => {
      const interaction = createMockInteraction({
        isButton: jest.fn().mockReturnValue(true),
      });
      const executeMock = jest.fn<any>();
      client.buttons.set("test-id", { execute: executeMock } as any);

      await interactionCreateEvent.execute(client, interaction as any);
      expect(executeMock).toHaveBeenCalledWith(interaction, client);
    });

    it("should route AnySelectMenu", async () => {
      const interaction = createMockInteraction({
        isAnySelectMenu: jest.fn().mockReturnValue(true),
      });
      const executeMock = jest.fn<any>();
      client.selectMenus.set("test-id", { execute: executeMock } as any);

      await interactionCreateEvent.execute(client, interaction as any);
      expect(executeMock).toHaveBeenCalledWith(interaction, client);
    });

    it("should route ContextMenuCommand", async () => {
      const interaction = createMockInteraction({
        isContextMenuCommand: jest.fn().mockReturnValue(true),
      });
      const executeMock = jest.fn<any>();
      client.commands.set("test-cmd", { execute: executeMock } as any);

      await interactionCreateEvent.execute(client, interaction as any);
      expect(executeMock).toHaveBeenCalledWith(interaction, client);
    });

    it("should route ModalSubmit", async () => {
      const interaction = createMockInteraction({
        isModalSubmit: jest.fn().mockReturnValue(true),
      });
      const executeMock = jest.fn<any>();
      client.modals.set("test-id", { execute: executeMock } as any);

      await interactionCreateEvent.execute(client, interaction as any);
      expect(executeMock).toHaveBeenCalledWith(interaction, client);
    });

    it("should route Autocomplete", async () => {
      const interaction = createMockInteraction({
        isAutocomplete: jest.fn().mockReturnValue(true),
      });
      const autocompleteMock = jest.fn<any>();
      client.commands.set("test-cmd", {
        autocomplete: autocompleteMock,
      } as any);

      await interactionCreateEvent.execute(client, interaction as any);
      expect(autocompleteMock).toHaveBeenCalledWith(interaction, client);
    });

    it("should warn on unknown interaction type", async () => {
      const interaction = createMockInteraction();
      await interactionCreateEvent.execute(client, interaction as any);

      expect(logMessage).toHaveBeenCalledWith(
        expect.stringContaining("Unknown interaction type"),
        "warn"
      );
    });

    it("should no execute if item.execute is missing", async () => {
      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
      });

      client.commands.set("test-cmd", {} as any);

      await interactionCreateEvent.execute(client, interaction as any);
    });

    it("should not execute if interaction is not repliable", async () => {
      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isRepliable: jest.fn().mockReturnValue(false),
      });
      const executeMock = jest.fn<any>();
      client.commands.set("test-cmd", { execute: executeMock } as any);

      await interactionCreateEvent.execute(client, interaction as any);
      expect(executeMock).not.toHaveBeenCalled();
    });
  });

  describe("Regex Matching", () => {
    it("should match customId via RegExp fallback", async () => {
      const interaction = createMockInteraction({
        isButton: jest.fn().mockReturnValue(true),
        customId: "dynamic-btn-123",
      });
      const executeMock = jest.fn<any>();

      client.buttons.set(
        /dynamic-btn-\d+/ as any,
        { execute: executeMock } as any
      );

      await interactionCreateEvent.execute(client, interaction as any);
      expect(executeMock).toHaveBeenCalledWith(interaction, client);
    });

    it("should ignore non-RegExp keys and non-matching RegExp in fallback loop", async () => {
      const interaction = createMockInteraction({
        isButton: jest.fn().mockReturnValue(true),
        customId: "dynamic-btn-123",
      });
      const executeMock = jest.fn<any>();

      client.buttons.set("string-key", {} as any); // Fails instanceof RegExp
      client.buttons.set(/fail-\d+/ as any, {} as any); // Fails test(id)
      client.buttons.set(
        /dynamic-btn-\d+/ as any,
        { execute: executeMock } as any
      ); // Matches

      await interactionCreateEvent.execute(client, interaction as any);
      expect(executeMock).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should throw 'not found' error and trigger standard fallback reply", async () => {
      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isCommand: jest.fn().mockReturnValue(true),
      });

      await interactionCreateEvent.execute(client, interaction as any);

      expect(interaction.reply).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();

      const fileContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;
      expect(fileContent).toContain("Error message: input not found");
      expect(fileContent).toContain("Error origin: test-cmd");
    });

    it("should create logs directory if it does not exist", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
      });

      await interactionCreateEvent.execute(client, interaction as any);

      expect(fs.mkdirSync).toHaveBeenCalledWith("./logs", { recursive: true });
    });

    it("should handle error formatting for message components", async () => {
      const interaction = createMockInteraction({
        isButton: jest.fn().mockReturnValue(true),
        isMessageComponent: jest.fn().mockReturnValue(true),
      });

      await interactionCreateEvent.execute(client, interaction as any);

      const fileContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;
      expect(fileContent).toContain("Error origin: test-id");
    });

    it("should handle followUp if interaction is already deferred", async () => {
      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
        deferred: true,
      });

      await interactionCreateEvent.execute(client, interaction as any);

      expect(interaction.followUp).toHaveBeenCalled();
      expect(interaction.reply).not.toHaveBeenCalled();
    });

    it("should swallow reply attempts if interaction is not repliable", async () => {
      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isRepliable: jest.fn().mockReturnValue(false),
      });

      await interactionCreateEvent.execute(client, interaction as any);

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(interaction.reply).not.toHaveBeenCalled();
      expect(interaction.followUp).not.toHaveBeenCalled();
    });

    it("should log fs write failure and continue to reply attempt", async () => {
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("ENOSPC: no space left on device");
      });

      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isCommand: jest.fn().mockReturnValue(true),
      });

      await interactionCreateEvent.execute(client, interaction as any);

      expect(logMessage).toHaveBeenCalledWith(
        expect.stringContaining("[Logger] Failed to write error log to disk"),
        "error"
      );
      expect(logMessage).toHaveBeenCalledWith(
        expect.stringContaining("[Logger] Original Error:"),
        "error"
      );
      expect(interaction.reply).toHaveBeenCalled();
    });

    it("should log failure when sending error embed to Discord", async () => {
      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isCommand: jest.fn().mockReturnValue(true),
      });
      interaction.reply.mockRejectedValue(new Error("Discord API error"));

      await interactionCreateEvent.execute(client, interaction as any);

      expect(logMessage).toHaveBeenCalledWith(
        expect.stringContaining(
          "[Logger] Failed to send error embed to Discord"
        ),
        "error"
      );
    });

    it("should do nothing in catch block if interaction.reply is explicitly missing", async () => {
      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isCommand: jest.fn().mockReturnValue(true),
        reply: undefined, // Force undefined reply
      });
      // Trigger error by not registering command

      await interactionCreateEvent.execute(client, interaction as any);

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(interaction.followUp).not.toHaveBeenCalled();
      // reply won't be called because it is undefined
    });
  });

  describe("Timeout Detection", () => {
    it("should detect ECONNABORTED and trigger timeout embed", async () => {
      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
      });

      const error = new Error("Connection lost");
      (error as any).code = "ECONNABORTED"; // Force timeout code

      client.commands.set("test-cmd", {
        execute: jest.fn<any>().mockRejectedValue(error),
      } as any);

      await interactionCreateEvent.execute(client, interaction as any);

      const replyEmbeds = (interaction.reply as jest.Mock).mock
        .calls[0][0] as any;
      const errorStackEmbed = replyEmbeds.embeds[1];

      expect(errorStackEmbed.data.title).toBe("No Stack");
    });

    it("should detect 'timeout' in error stack", async () => {
      const interaction = createMockInteraction({
        isButton: jest.fn().mockReturnValue(true),
      });

      const error = new Error("Failed");
      error.stack = "Error: Failed\n    at Request.timeout (file.js:1:1)";

      client.buttons.set("test-id", {
        execute: jest.fn<any>().mockRejectedValue(error),
      } as any);

      await interactionCreateEvent.execute(client, interaction as any);

      const replyEmbeds = (interaction.reply as jest.Mock).mock
        .calls[0][0] as any;
      expect(replyEmbeds.embeds[1].data.title).toBe("No Stack");
    });

    it("should fallback gracefully if error stack is completely undefined", async () => {
      const interaction = createMockInteraction({
        isChatInputCommand: jest.fn().mockReturnValue(true),
      });

      const error = new Error("Generic execution error");
      delete error.stack;

      client.commands.set("test-cmd", {
        execute: jest.fn<any>().mockRejectedValue(error),
      } as any);

      await interactionCreateEvent.execute(client, interaction as any);

      const replyEmbeds = (interaction.reply as jest.Mock).mock
        .calls[0][0] as any;

      expect(replyEmbeds.embeds[1].data.description).toBe("No Stack");
    });
  });
});
