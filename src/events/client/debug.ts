import { Events } from "discord.js";
import { BotEvent } from "../../types/Event";
import { ExtendedClient } from "../../lib/ExtendedClient";

const event: BotEvent<Events.Debug> = {
  name: Events.Debug,
  execute: async (client: ExtendedClient, info: string) => {
    const getChalk = require("../../functions/tools/getChalk");
    const chalk = await getChalk();
    console.log(chalk.gray(info));
  },
};

export default event;
