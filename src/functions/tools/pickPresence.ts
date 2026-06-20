import { ActivityType, PresenceStatusData } from "discord.js";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { prisma } from "../../utils/prisma";

interface CachedPresence {
  text: string;
  status: PresenceStatusData;
  type: ActivityType;
}

let presenceCache: CachedPresence[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5m

export default async function pickPresence(
  client: ExtendedClient
): Promise<void> {
  const currentTime = Date.now();
  const currentDate = new Date();

  if (currentTime - lastFetchTime > CACHE_TTL || presenceCache.length === 0) {
    try {
      const dbPresences = await prisma.botPresence.findMany({
        where: {
          enabled: true,
          OR: [
            { activeFrom: null, activeTo: null }, // Permanent
            {
              activeFrom: { lte: currentDate },
              activeTo: { gte: currentDate },
            }, // Strictly between dates
            { activeFrom: { lte: currentDate }, activeTo: null }, // Started, no end date
            { activeFrom: null, activeTo: { gte: currentDate } }, // Expiring soon, no start date
          ],
        },
      });

      if (dbPresences.length > 0) {
        presenceCache = dbPresences.map((p) => ({
          text: p.text,
          status: p.status as PresenceStatusData,
          type: p.type as ActivityType,
        }));
      } else {
        presenceCache = buildFallbackPresences();
      }

      lastFetchTime = currentTime;
    } catch (error) {
      console.error(
        "[Presence] Failed to fetch presences from database:",
        error
      );
      if (presenceCache.length === 0) {
        presenceCache = buildFallbackPresences();
      }
    }
  }

  if (presenceCache.length === 0) return;

  const randomIndex = Math.floor(Math.random() * presenceCache.length);
  const selected = presenceCache[randomIndex];

  const parsedText = parseDynamicReplacements(selected.text, client);

  client.user?.setPresence({
    activities: [
      {
        name: parsedText,
        type: selected.type,
      },
    ],
    status: selected.status,
  });
}

function parseDynamicReplacements(
  text: string,
  client: ExtendedClient
): string {
  const guildCount = client.guilds.cache.size.toString();
  const userCount = client.guilds.cache
    .reduce((acc, guild) => acc + guild.memberCount, 0)
    .toString();
  const version = client.version;

  return text
    .replaceAll("{version}", version)
    .replaceAll("{guildCount}", guildCount)
    .replaceAll("{userCount}", userCount);
}

function buildFallbackPresences(): CachedPresence[] {
  return [
    {
      type: ActivityType.Custom,
      text: "Watching over {guildCount} servers | v{version}",
      status: "online",
    },
    {
      type: ActivityType.Custom,
      text: "Playing with the API | v{version}",
      status: "online",
    },
    {
      type: ActivityType.Custom,
      text: "Listening to music with Nami | v{version}",
      status: "online",
    },
    {
      type: ActivityType.Custom,
      text: "Reading manga with {userCount} users | v{version}",
      status: "online",
    },
  ];
}
