import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

jest.mock("@prisma/adapter-pg", () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("../../prisma/generated/prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

describe("prisma singleton", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
    delete (globalThis as any).prisma;
  });

  afterEach(() => {
    process.env = originalEnv;
    delete (globalThis as any).prisma;
  });

  it("should throw an error if DATABASE_URL is not defined", () => {
    delete process.env.DATABASE_URL;

    expect(() => {
      require("../../src/utils/prisma");
    }).toThrow("DATABASE_URL is not defined in the environment variables.");
  });

  it("should initialise a new PrismaClient when DATABASE_URL is present", () => {
    process.env.DATABASE_URL = '"postgresql://user:pass@localhost:5432/db"';

    const { prisma } = require("../../src/utils/prisma");

    expect(prisma).toBeDefined();
    expect((globalThis as any).prisma).toBeDefined();
    expect((globalThis as any).prisma).toBe(prisma);
  });

  it("should reuse the existing globalThis.prisma if it is already defined", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

    const dummyPrisma = { isMock: true };
    (globalThis as any).prisma = dummyPrisma;

    const { prisma } = require("../../src/utils/prisma");

    expect(prisma).toBe(dummyPrisma);
  });

  it("should not set globalThis.prisma in production", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.NODE_ENV = "production";

    const { prisma } = require("../../src/utils/prisma");

    expect(prisma).toBeDefined();
    expect((globalThis as any).prisma).toBeUndefined();
  });
});
