import { Client, Events } from "discord.js";
import { BotEvent } from "../../types/Event";
import { ExtendedClient } from "../../lib/ExtendedClient";
import checkUpdates from "../../functions/tools/checkUpdates";
import { logMessage } from "../../lib/app";

const event: BotEvent<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: ExtendedClient, readyClient: Client<true>) => {
    const { default: pickPresence } =
      await import("../../functions/tools/pickPresence");
    setInterval(() => pickPresence(client), 10 * 1000);

    await logMessage("[GitHub] Checking for updates...", "info");
    await checkUpdates();
  },
};

export default event;
