import { ClientEvents } from "discord.js";
import { ExtendedClient } from "../lib/ExtendedClient";

export interface BotEvent<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (
    client: ExtendedClient,
    ...args: ClientEvents[K]
  ) => Promise<void> | void;
}
