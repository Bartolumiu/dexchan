import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { BotEvent } from "../../types/Event";
import { logMessage } from "../../lib/app";

export default async function handleEvents(
  client: ExtendedClient
): Promise<void> {
  await logMessage("[Event Loader] Loading events...", "info");

  const eventsPath = join(__dirname, "../../events");
  const eventFolders = readdirSync(eventsPath);

  for (const folder of eventFolders) {
    const folderPath = join(eventsPath, folder);
    const eventFiles = readdirSync(folderPath).filter(
      (file) => file.endsWith(".ts") && !file.endsWith(".i18n.ts")
    );

    for (const file of eventFiles) {
      const filePath = join(folderPath, file);
      const eventModule = await import(filePath);
      const event: BotEvent<any> = eventModule.default || eventModule;

      if (event.name && typeof event.execute === "function") {
        const execute = (...args: unknown[]) => {
          const result = event.execute(client, ...args);
          if (result instanceof Promise) {
            result.catch((error: unknown) => {
              const message = error instanceof Error ? error.message : String(error);
              logMessage(
                `[Event Handler] Unhandled error in ${event.name}: ${message}`,
                "error"
              );
            });
          }
        };

        if (event.once) {
          client.once(event.name, execute);
        } else {
          client.on(event.name, execute);
        }
        await logMessage(
          `[Event Loader] Loaded ${event.name} event.`,
          "success"
        );
      } else {
        await logMessage(
          `[Event Loader] Error: ${file} is missing a required 'name' or 'execute' property.`,
          "error"
        );
      }
    }
  }
}
