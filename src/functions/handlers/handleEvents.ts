import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { BotEvent } from "../../types/Event";
import getChalk from "../tools/getChalk";

export default async function handleEvents(
  client: ExtendedClient
): Promise<void> {
  const chalk = await getChalk();

  console.log(chalk.blueBright("[Event Loader] Loading events..."));

  const eventsPath = join(__dirname, "../../events");
  const eventFolders = readdirSync(eventsPath);

  for (const folder of eventFolders) {
    if (folder === "mongo") continue; // Skip legacy mongo folder (deprecated)

    const folderPath = join(eventsPath, folder);
    const eventFiles = readdirSync(folderPath).filter((file) =>
      file.endsWith(".ts")
    );

    for (const file of eventFiles) {
      const filePath = join(folderPath, file);
      const eventModule = await import(filePath);
      const event: BotEvent<any> = eventModule.default || eventModule;

      if (event.name && typeof event.execute === "function") {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(client, ...args));
        } else {
          client.on(event.name, (...args) => event.execute(client, ...args));
        }
        console.log(
          chalk.greenBright(`[Event Loader] Loaded ${event.name} event.`)
        );
      } else {
        console.error(
          chalk.redBright(
            `[Event Loader] Error: ${file} is missing a required 'name' or 'execute' property.`
          )
        );
      }
    }
  }
}
