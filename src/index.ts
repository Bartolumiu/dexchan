import "dotenv/config";
import { initializeApplication, logMessage } from "./lib/app";

async function bootstrap() {
  const { BOT_TOKEN } = process.env;

  if (!BOT_TOKEN) {
    await logMessage(
      "BOT_TOKEN is not defined in the environment variables.",
      "critical"
    );
    return process.exit(1);
  }

  try {
    await initializeApplication({ token: BOT_TOKEN });
  } catch (error: any) {
    await logMessage(
      `Application failed to start: ${error.message || error}`,
      "critical"
    );
    process.exit(1);
  }
}

bootstrap();
