import "dotenv/config";
import { initializeApplication } from "./lib/app";

const { BOT_TOKEN } = process.env;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is not defined in the environment variables.");
  process.exit(1);
}

initializeApplication({ token: BOT_TOKEN }).catch((error: Error) => {
  console.error("Application failed to start:", error);
  process.exit(1);
});
