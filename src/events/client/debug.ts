import { Events } from "discord.js";
import { BotEvent } from "../../types/Event";
import { ExtendedClient } from "../../lib/ExtendedClient";
import getChalk from "../../functions/tools/getChalk";

const event: BotEvent<Events.Debug> = {
  name: Events.Debug,
  execute: async (client: ExtendedClient, info: string) => {
    const chalk = await getChalk();
    console.log(chalk.gray(info));
  },
};

export default event;
