import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";

const connectionString = process.env.DATABASE_URL?.replace(
  /^(["'])(.*?)\1$/,
  "$2"
);

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return new PrismaClient({
    adapter,
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
