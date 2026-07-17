import { Interaction } from "discord.js";
import { prisma } from "./prisma";
import { logMessage } from "../lib/app";

export interface InteractionContext {
  locale: string;
  nsfwEnabled: boolean;
  sources: string[];
}

export async function getInteractionContext(
  interaction: Interaction
): Promise<InteractionContext> {
  let timeoutId: NodeJS.Timeout;

  try {
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Database check timed out")), 1000)
    });

    const dbQueries = async () => {
      const user = await prisma.user.findUnique({
        where: { id: interaction.user.id },
      });

      let guildSettings = null;
      if (interaction.guildId) {
        guildSettings = await prisma.guildSettings.findUnique({
          where: { guildId: interaction.guildId },
          include: { sources: { include: { source: true } } },
        });
      }

      return { user, guildSettings };
    };

    const { user: dbUser, guildSettings } = await Promise.race([
      dbQueries(),
      timeout,
    ]);

    clearTimeout(timeoutId!);

    const resolvedLocale =
      dbUser?.preferredLocale || interaction.locale || "en";

    let allowedSources: string[];

    if (guildSettings && guildSettings.sources.length > 0) {
      allowedSources = guildSettings.sources
        .filter((s) => s.enabled)
        .map((s) => s.source.identifier);
    } else {
      const globalDefaults = await prisma.upstreamSource.findMany({
        where: { isDefault: true },
      });
      allowedSources = globalDefaults.map((s) => s.identifier);
    }

    return {
      locale: resolvedLocale,
      nsfwEnabled: dbUser?.nsfwEnabled || false,
      sources: allowedSources,
    };
  } catch (error) {
    await logMessage(
      `[DB Error] getInteractionContext failed: ${error}`,
      "error"
    );
    return {
      locale: interaction.locale || "en",
      nsfwEnabled: false,
      sources: ["mangadex", "namicomi", "mangabaka"],
    };
  }
}
