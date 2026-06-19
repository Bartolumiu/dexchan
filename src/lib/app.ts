import { GatewayIntentBits } from "discord.js";
import { prisma } from "../utils/prisma";
import { ExtendedClient } from "./ExtendedClient";
import pkg from "../../package.json";
import getChalk from "../functions/tools/getChalk";

/**
 * Creates and configures a new Discord client instance.
 */
export function createClient(): ExtendedClient {
  return new ExtendedClient(
    { intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] },
    pkg.version
  );
}

/**
 * Connects to PostgreSQL via Prisma.
 */
export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error("[Database] Failed to connect:", error);
    process.exit(1);
  }
}

/**
 * Logs a message with chalk styling if available, otherwise logs the message as is.
 * @param message Message to log.
 */
export async function logMessage(message: string): Promise<void> {
  try {
    const chalk = await getChalk();
    console.log(chalk.blueBright(message));
  } catch {
    console.log(message);
  }
}

interface AppConfig {
  token: string;
}

/**
 * Main application initialisation
 * @param config Configuration object
 * @param config.token Discord bot token
 */
export async function initializeApplication({
  token,
}: AppConfig): Promise<ExtendedClient> {
  const client = createClient();

  await logMessage(`Starting Dex-chan v${client.version}...`);

  const handleEvents = require("../functions/handlers/handleEvents");
  const handleCommands = require("../functions/handlers/handleCommands");
  const handleComponents = require("../functions/handlers/handleComponents");
  const handleLocales = require("../functions/handlers/handleLocales");

  await handleEvents(client);
  await handleCommands(client);
  await handleComponents(client);
  await handleLocales(client);

  await logMessage("Connecting to Database...");
  await connectDB();

  await logMessage("Logging in...");
  await client.login(token);

  await client.guilds.fetch();

  await logMessage(
    "✅ Ready as ${client.user.tag}! Logged in and connected to PostgreSQL."
  );

  return client;
}
