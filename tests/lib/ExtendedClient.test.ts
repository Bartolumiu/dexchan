import { describe, expect, it } from "@jest/globals";
import { Collection, GatewayIntentBits } from "discord.js";
import { ExtendedClient } from "../../src/lib/ExtendedClient";

describe("ExtendedClient", () => {
  it("should initialise with correct properties and collections", () => {
    const options = { intents: [GatewayIntentBits.Guilds] };
    const version = "1.0.0";

    const client = new ExtendedClient(options, version);

    // Verify custom version property
    expect(client.version).toBe(version);

    // Verify all collections are initialised
    expect(client.commands).toBeInstanceOf(Collection);
    expect(client.buttons).toBeInstanceOf(Collection);
    expect(client.selectMenus).toBeInstanceOf(Collection);
    expect(client.modals).toBeInstanceOf(Collection);
    expect(client.guildCommands).toBeInstanceOf(Collection);

    // Verify globalCommands array is initialised empty
    expect(Array.isArray(client.globalCommands)).toBe(true);
    expect(client.globalCommands.length).toBe(0);

    // Verify parent constructor (Client) was called correctly with options
    expect(client.options.intents).toBeDefined();
  });
});
