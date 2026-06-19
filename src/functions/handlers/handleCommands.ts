import {
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { SlashCommand } from "../../types/Command";
import getChalk from "../tools/getChalk";

export default async function handleCommands(
  client: ExtendedClient
): Promise<void> {
  const chalk = await getChalk();

  console.log(chalk.blueBright("[Command Handler] Loading commands..."));

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
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    ); // TODO: yeet JavaScript

    for (const file of commandFiles) {
      try {
        const filePath = join(folderPath, file);
        const commandModule = await import(filePath);

        const command: SlashCommand & { guildID?: string | string[] } =
          commandModule.default || commandModule;

        if (!command.data) {
          console.warn(
            chalk.yellowBright(
              `[Command Handler] Command file ${file} in ${folder} does not have a data property. Skipping...`
            )
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
          console.log(
            chalk.greenBright(
              `[Command Handler] Global command /${command.data.name} loaded.`
            )
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
            console.log(
              chalk.greenBright(
                `[Command Handler] Guild command /${command.data.name} loaded for guild ${guildId}.`
              )
            );
          }
        } else {
          console.warn(
            chalk.yellowBright(
              `[Command Handler] Command /${command.data.name} does not have a guildID set and is not marked as global. Skipping...`
            )
          );
        }
      } catch (e: any) {
        console.error(
          chalk.redBright(
            `[Command Handler] Error loading ${file} in ${folder}: ${e.message}`
          )
        );
      }
    }
  }

  await refreshCommands(globalCommandList, guildCommandMap, chalk);
}

async function refreshCommands(
  globalCommandList: RESTPostAPIChatInputApplicationCommandsJSONBody[],
  guildCommandMap: Map<
    string,
    RESTPostAPIChatInputApplicationCommandsJSONBody[]
  >,
  chalk: any
): Promise<void> {
  const clientID = process.env.CLIENT_ID;
  const botToken = process.env.BOT_TOKEN;

  if (!clientID || !botToken) {
    console.error(
      chalk.redBright(
        "[Command Handler] Missing CLIENT_ID or BOT_TOKEN in environment. Cannot register commands."
      )
    );
    return;
  }

  const rest = new REST({ version: "10" }).setToken(botToken);

  try {
    console.log(
      chalk.blueBright(
        "[Command Handler] Started refreshing global application (/) commands."
      )
    );
    await rest.put(Routes.applicationCommands(clientID), {
      body: globalCommandList,
    });

    for (const [guildID, commands] of guildCommandMap) {
      console.log(
        chalk.gray(
          `[Command Handler] Started refreshing guild (/) commands for guild ${guildID}`
        )
      );
      await rest.put(Routes.applicationGuildCommands(clientID, guildID), {
        body: commands,
      });
    }

    console.log(
      chalk.greenBright(
        "[Command Handler] Successfully reloaded application (/) commands."
      )
    );
  } catch (e: any) {
    console.error(
      chalk.redBright(
        "[Command Handler] Failed to reload application (/) commands."
      ),
      e
    );
  }
}
