import "dotenv/config";
import { initializeApplication, logMessage } from "./lib/app";

async function bootstrap() {
  const { DEXCHAN_TOKEN } = process.env;

  if (!DEXCHAN_TOKEN) {
    await logMessage(
      "DEXCHAN_TOKEN is not defined in the environment variables.",
      "critical"
    );
    return process.exit(1);
  }

  try {
    await initializeApplication({ token: DEXCHAN_TOKEN });
  } catch (error: any) {
    await logMessage(
      `Application failed to start: ${error.message || error}`,
      "critical"
    );
    process.exit(1);
  }
}

bootstrap();
