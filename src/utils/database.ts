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
  try {
    const result = await Promise.race([
      (async () => {
        const [user, guildSettings] = await Promise.all([
          prisma.user.findUnique({ where: { id: interaction.user.id } }),
          interaction.guildId
            ? prisma.guildSettings.findUnique({
                where: { guildId: interaction.guildId },
                include: { sources: { include: { source: true } } },
              })
            : Promise.resolve(null),
        ]);

        const enabledGuildSources = guildSettings?.sources.filter(
          (s) => s.enabled
        );

        let sources: string[];
        if (enabledGuildSources && enabledGuildSources.length > 0) {
          sources = enabledGuildSources.map((s) => s.source.identifier);
        } else {
          const globalDefaults = await prisma.upstreamSource.findMany({
            where: { isDefault: true },
          });
          sources = globalDefaults.map((s) => s.identifier);
        }

        return { user, sources };
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database check timed out")), 1000)
      ),
    ]);

    const { user: dbUser, sources: allowedSources } = result;

    const resolvedLocale =
      dbUser?.preferredLocale || interaction.locale || "en";

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
