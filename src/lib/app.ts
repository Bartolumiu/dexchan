import { GatewayIntentBits } from "discord.js";
import { prisma } from "../utils/prisma";
import { ExtendedClient } from "./ExtendedClient";
import pkg from "../../package.json";
import getChalk from "../functions/tools/getChalk";

/**
 * Log levels for logging messages.
 */
export type LogLevel =
  "info" | "warn" | "error" | "critical" | "debug" | "success";

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
    await logMessage(`[Database] Failed to connect: ${error}`, "critical");
    process.exit(1);
  }
}

/**
 * Logs a message with chalk styling if available, otherwise logs the message as is.
 * @param message Message to log.
 * @param level Log level.
 */
export async function logMessage(
  message: string,
  level: LogLevel = "info"
): Promise<void> {
  try {
    const chalk = await getChalk();
    switch (level) {
      case "info":
        console.log(chalk.blueBright(message));
        break;
      case "warn":
        console.warn(chalk.yellowBright(message));
        break;
      case "error":
        console.error(chalk.redBright(message));
        break;
      case "critical":
        console.error(chalk.bgRedBright.blackBright(message));
        break;
      case "debug":
        console.log(chalk.gray(message));
        break;
      case "success":
        console.log(chalk.greenBright(message));
        break;
    }
  } catch {
    switch (level) {
      case "warn":
        console.warn(message);
        break;
      case "error":
      case "critical":
        console.error(message);
        break;
      default:
        console.log(message);
    }
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

  await logMessage(`Starting Dex-chan v${client.version}...`, "info");

  const { default: handleEvents } =
    await import("../functions/handlers/handleEvents");
  const { default: handleCommands } =
    await import("../functions/handlers/handleCommands");
  const { default: handleComponents } =
    await import("../functions/handlers/handleComponents");

  await handleEvents(client);
  await handleCommands(client);
  await handleComponents(client);

  await logMessage("Connecting to Database...", "info");
  await connectDB();

  await logMessage("Logging in...", "info");
  await client.login(token);

  try {
    await client.guilds.fetch();
  } catch (error) {
    await logMessage(`Failed to fetch guilds: ${error}`, "warn");
  }

  await logMessage(
    `✅ Ready as ${client.user!.tag}! Logged in and connected to PostgreSQL.`,
    "success"
  );

  return client;
}
