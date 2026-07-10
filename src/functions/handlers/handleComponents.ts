import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ExtendedClient } from "../../lib/ExtendedClient";
import getChalk from "../tools/getChalk";
import { Collection } from "discord.js";
import { Component } from "../../types/Component";

export default async function handleComponents(
  client: ExtendedClient
): Promise<void> {
  const chalk = await getChalk();
  console.log(chalk.blueBright("[Component Handler] Loading components..."));

  const componentsPath = join(__dirname, "../../components");

  let componentFolders: string[];
  try {
    componentFolders = readdirSync(componentsPath);
  } catch (e) {
    console.warn(
      chalk.yellowBright(
        "[Component Handler] No components folder found. Skipping..."
      )
    );
    return;
  }

  const componentMap: Record<string, Collection<string, any>> = {
    buttons: client.buttons,
    selectMenus: client.selectMenus,
    modals: client.modals,
  };

  for (const folder of componentFolders) {
    const collection = componentMap[folder];

    if (!collection) {
      console.error(
        chalk.redBright(
          `[Component Handler] Error: ${folder} is not a valid component folder.`
        )
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

        if (!component.data || !component.data.customId) {
          console.warn(
            chalk.yellowBright(
              `[Component Handler] Component file ${file} in ${folder} is missing data.customId. Skipping.`
            )
          );
          continue;
        }

        collection.set(component.data.customId.toString(), component);

        console.log(
          chalk.greenBright(
            `[Component Handler] Component ${component.data.customId} loaded from ${file} in ${folder}.`
          )
        );
      } catch (e: unknown) {
        const error = e as Error;
        console.error(
          chalk.redBright(
            `[Component Handler] Error loading ${file} in ${folder}: ${error.message}`
          )
        );
      }
    }
  }
}
