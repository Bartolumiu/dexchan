import { prisma } from "../utils/prisma";
import { getAvailableLocales } from "../functions/handlers/handleLocales";

/**
 * Syncs the bot's i18n locale availability into the `Bot` table (row keyed by
 * the bot's CLIENT_ID). Called on startup so the website can read the available
 * locales (and their enabled state) without hardcoding them. Best-effort: the
 * caller is expected to swallow errors so startup is never blocked.
 */
export async function syncBotLocales(): Promise<void> {
  const clientId = process.env.CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("CLIENT_ID is not defined; cannot sync bot locales.");
  }

  const locales = getAvailableLocales()
    .filter((l) => l.code.length > 0)
    .map((l) => ({ code: l.code, enabled: l.enabled }));

  await prisma.bot.upsert({
    where: { id: clientId },
    create: { id: clientId, locales },
    update: { locales },
  });
}
