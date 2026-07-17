import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { Collection } from "discord.js";
import { Component } from "../../types/Component";
import { logMessage } from "../../lib/app";

function isSameCustomId(a: string | RegExp, b: string | RegExp): boolean {
  if (typeof a === "string" || typeof b === "string") return a === b;
  return a.source === b.source && a.flags === b.flags;
}

export default async function handleComponents(
  client: ExtendedClient
): Promise<void> {
  await logMessage("[Component Handler] Loading components...", "info");

  const componentsPath = join(__dirname, "../../components");

  let componentFolders: string[];
  try {
    componentFolders = readdirSync(componentsPath);
  } catch {
    await logMessage(
      "[Component Handler] No components folder found. Skipping...",
      "warn"
    );
    return;
  }

  const componentMap: Record<string, Collection<string | RegExp, any>> = {
    buttons: client.buttons,
    selectMenus: client.selectMenus,
    modals: client.modals,
  };

  for (const folder of componentFolders) {
    const collection = componentMap[folder];

    if (!collection) {
      await logMessage(
        `[Component Handler] Error: ${folder} is not a valid component folder.`,
        "error"
      );
      continue;
    }

    const folderPath = join(componentsPath, folder);
    const componentFiles = readdirSync(folderPath).filter(
      (file) => file.endsWith(".ts") && !file.endsWith(".i18n.ts")
    );

    for (const file of componentFiles) {
      const filePath = join(folderPath, file);

      try {
        const componentModule = await import(filePath);

        const component: Component = componentModule.default || componentModule;

        if (!component.data?.customId) {
          await logMessage(
            `[Component Handler] Component file ${file} in ${folder} is missing data.customId. Skipping.`,
            "warn"
          );
          continue;
        }

        const duplicateKey = [...collection.keys()].find((existingKey) =>
          isSameCustomId(existingKey, component.data.customId)
        );
        if (duplicateKey !== undefined) {
          await logMessage(
            `[Component Handler] Component ${file} in ${folder} registers customId ${component.data.customId}, which duplicates an already-loaded component. It will shadow the previous one.`,
            "warn"
          );
        }

        collection.set(component.data.customId, component);

        await logMessage(
          `[Component Handler] Component ${component.data.customId} loaded from ${file} in ${folder}.`,
          "success"
        );
      } catch (e: unknown) {
        const error = e as Error;
        await logMessage(
          `[Component Handler] Error loading ${file} in ${folder}: ${error.message}`,
          "error"
        );
      }
    }
  }
}
