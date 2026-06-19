import { Client, Events } from "discord.js";
import { BotEvent } from "../../types/Event";
import { ExtendedClient } from "../../lib/ExtendedClient";
import checkUpdates from "../../functions/tools/checkUpdates";
import getChalk from "../../functions/tools/getChalk";

const event: BotEvent<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: ExtendedClient, readyClient: Client<true>) => {
    const chalk = await getChalk();

    const pickPresence = require("../../functions/tools/pickPresence");
    setInterval(pickPresence, 10 * 1000);

    console.log(chalk.blueBright("[GitHub] Checking for updates..."));
    const res = await checkUpdates();

    if (res.isOutdated) {
      console.warn(
        chalk.yellowBright(
          `[GitHub] The bot is outdated! Current version: ${client.version}, Latest version: ${res.latestVersion}`
        )
      );
      console.log(
        chalk.yellowBright(
          `[GitHub] Download the latest version at https://github.com/Bartolumiu/dexchan/releases/latest`
        )
      );
    } else if (res.isOutdated === false) {
      console.log(chalk.greenBright("[GitHub] The bot is up to date!"));
    }
  },
};

export default event;
