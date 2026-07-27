import { Events } from "discord.js";
import { BotEvent } from "../../types/Event";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { logMessage } from "../../lib/app";

const event: BotEvent<Events.Debug> = {
  name: Events.Debug,
  execute: async (client: ExtendedClient, info: string) => {
    if (!process.env.DEBUG) return;
    await logMessage(info, "debug");
  },
};

export default event;
