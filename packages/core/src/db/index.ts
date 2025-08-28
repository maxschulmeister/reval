import { PrismaClient } from "@prisma/client";
import { dbPath } from "../../drizzle.config";

export * from "./save-run";

// Prisma Client instance
let prisma: PrismaClient | null = null;

export const getDb = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`,
        },
      },
    });
  }
  return prisma;
};

// Clean disconnect function
export const disconnectDb = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};
