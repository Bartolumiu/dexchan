import {
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { SlashCommand } from "../../types/Command";
import { logMessage } from "../../lib/app";

export default async function handleCommands(
  client: ExtendedClient
): Promise<void> {
  await logMessage("[Command Handler] Loading commands...", "info");

  const commandsPath = join(__dirname, "../../commands");
  const commandFolders = readdirSync(commandsPath);

  const globalCommandList: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
    [];
  const guildCommandMap = new Map<
    string,
    RESTPostAPIChatInputApplicationCommandsJSONBody[]
  >();

  for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter(
      (file) => file.endsWith(".ts") && !file.endsWith(".i18n.ts")
    );

    for (const file of commandFiles) {
      try {
        const filePath = join(folderPath, file);
        const commandModule = await import(filePath);

        const command: SlashCommand & {
          guildID?: string | string[];
          data: any;
        } = commandModule.default || commandModule;

        if (!command.data) {
          await logMessage(
            `[Command Handler] Command file ${file} in ${folder} does not have a data property. Skipping...`,
            "warn"
          );
          continue;
        }

        if (typeof command.data === "function") {
          command.data = await command.data();
        }

        client.commands.set(command.data.name, command);

        const commandJson = command.data.toJSON();

        if (command.global) {
          globalCommandList.push(commandJson);
          await logMessage(
            `[Command Handler] Global command /${command.data.name} loaded.`,
            "success"
          );
        } else if (command.guildID) {
          const targetGuilds = Array.isArray(command.guildID)
            ? command.guildID
            : [command.guildID];

          for (const guildId of targetGuilds) {
            if (!guildCommandMap.has(guildId)) {
              guildCommandMap.set(guildId, []);
            }
            guildCommandMap.get(guildId)!.push(commandJson);
            await logMessage(
              `[Command Handler] Guild command /${command.data.name} loaded for guild ${guildId}.`,
              "success"
            );
          }
        } else {
          await logMessage(
            `[Command Handler] Command /${command.data.name} does not have a guildID set and is not marked as global. Skipping...`,
            "warn"
          );
        }
      } catch (e: any) {
        await logMessage(
          `[Command Handler] Error loading ${file} in ${folder}: ${e.message}`,
          "error"
        );
      }
    }
  }

  await refreshCommands(globalCommandList, guildCommandMap);
}

async function refreshCommands(
  globalCommandList: RESTPostAPIChatInputApplicationCommandsJSONBody[],
  guildCommandMap: Map<
    string,
    RESTPostAPIChatInputApplicationCommandsJSONBody[]
  >
): Promise<void> {
  const clientID = process.env.CLIENT_ID;
  const botToken = process.env.BOT_TOKEN;

  if (!clientID || !botToken) {
    await logMessage(
      "[Command Handler] Missing CLIENT_ID or BOT_TOKEN in environment. Cannot register commands.",
      "error"
    );
    return;
  }

  const rest = new REST({ version: "10" }).setToken(botToken);

  try {
    await logMessage(
      "[Command Handler] Started refreshing global application (/) commands.",
      "info"
    );
    await rest.put(Routes.applicationCommands(clientID), {
      body: globalCommandList,
    });

    for (const [guildID, commands] of guildCommandMap) {
      await logMessage(
        `[Command Handler] Started refreshing guild (/) commands for guild ${guildID}`,
        "debug"
      );
      await rest.put(Routes.applicationGuildCommands(clientID, guildID), {
        body: commands,
      });
    }

    await logMessage(
      "[Command Handler] Successfully reloaded application (/) commands.",
      "success"
    );
  } catch (e: any) {
    await logMessage(
      `[Command Handler] Failed to reload application (/) commands: ${e.message}`,
      "error"
    );
  }
}
