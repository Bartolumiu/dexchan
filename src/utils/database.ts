import { Interaction } from "discord.js";
import { prisma } from "./prisma";

export interface InteractionContext {
  locale: string;
  nsfwEnabled: boolean;
  sources: string[];
}

export async function getInteractionContext(
  interaction: Interaction
): Promise<InteractionContext> {
  const dbUser = await prisma.user.findUnique({
    where: { id: interaction.user.id },
  });

  const resolvedLocale = dbUser?.preferredLocale || interaction.locale || "en";

  let allowedSources: string[] = [];

  if (interaction.guildId) {
    const guildSettings = await prisma.guildSettings.findUnique({
      where: { guildId: interaction.guildId },
      include: {
        sources: { include: { source: true } },
      },
    });

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
}
