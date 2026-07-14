import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StringSelectMenuInteraction } from "discord.js";
import searchSelectMenu from "../../../src/components/selectMenus/search_select";
import { ExtendedClient } from "../../../src/lib/ExtendedClient";

describe("search_select select menu", () => {
  let client: ExtendedClient;
  let mockInteraction: any;
  let mockCommand: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCommand = {
      execute: jest.fn<any>().mockResolvedValue(undefined),
    };

    client = {
      commands: {
        get: jest.fn().mockReturnValue(mockCommand),
      },
    } as unknown as ExtendedClient;

    mockInteraction = {
      deferUpdate: jest.fn<any>().mockResolvedValue(undefined),
      editReply: jest.fn<any>().mockResolvedValue(undefined),
      values: ["mangadex:12345"],
      isRepliable: jest.fn().mockReturnValue(true),
      someProp: "test-value",
    };
  });

  it("should have correct data customId", () => {
    expect(searchSelectMenu.data.customId).toBe("search_select");
  });

  it("should defer update, clear components, and execute the search command via Proxy", async () => {
    await searchSelectMenu.execute(
      mockInteraction as StringSelectMenuInteraction,
      client
    );

    expect(mockInteraction.deferUpdate).toHaveBeenCalled();
    expect(mockInteraction.editReply).toHaveBeenCalledWith({ components: [] });
    expect(mockCommand.execute).toHaveBeenCalled();

    const proxiedInteraction = mockCommand.execute.mock.calls[0][0];
    expect(proxiedInteraction.commandName).toBe("search");
    expect(proxiedInteraction.deferred).toBe(true);

    await expect(proxiedInteraction.deferReply()).resolves.toBeUndefined();
    expect(proxiedInteraction.options.getString("id")).toBe("12345");
    expect(proxiedInteraction.options.getString("source")).toBe("mangadex");
    expect(proxiedInteraction.options.getString("unknown")).toBeNull();
    expect(proxiedInteraction.isRepliable()).toBe(true);
    expect(proxiedInteraction.someProp).toBe("test-value");
  });

  it("should silently exit if the search command is not found in client collection", async () => {
    (client.commands.get as jest.Mock).mockReturnValue(undefined);

    await searchSelectMenu.execute(
      mockInteraction as StringSelectMenuInteraction,
      client
    );

    expect(mockInteraction.deferUpdate).toHaveBeenCalled();
    expect(mockInteraction.editReply).not.toHaveBeenCalled();
    expect(mockCommand.execute).not.toHaveBeenCalled();
  });
});
