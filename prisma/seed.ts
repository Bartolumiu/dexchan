import { prisma } from "../src/utils/prisma";

async function main() {
  console.log("Seeding database...");

  const sources = [
    { identifier: "mangabaka", displayName: "MangaBaka" },
    { identifier: "mangadex", displayName: "MangaDex" },
    { identifier: "namicomi", displayName: "NamiComi" },
  ];

  for (const source of sources) {
    await prisma.upstreamSource.upsert({
      where: { identifier: source.identifier },
      update: {},
      create: {
        identifier: source.identifier,
        displayName: source.displayName,
        isDefault: true,
      },
    });
  }

  const presenceCount = await prisma.botPresence.count();

  if (presenceCount === 0) {
    console.log("No presences found. Seeding default presences...");

    await prisma.botPresence.createMany({
      data: [
        {
          text: "Watching over {guildCount} servers | v{version}",
          status: "online",
          type: 4,
          enabled: true,
        },
        {
          text: "Playing with the API | v{version}",
          status: "online",
          type: 4,
          enabled: true,
        },
        {
          text: "Listening to music with Nami | v{version}",
          status: "online",
          type: 4,
          enabled: true,
        },
        {
          text: "Reading manga with {userCount} users | v{version}",
          status: "online",
          type: 4,
          enabled: true,
        },
      ],
    });
  } else {
    console.log(
      `Found ${presenceCount} existing presences. Skipping presence seed.`
    );
  }

  console.log("Database seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
