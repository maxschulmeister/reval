import { PrismaClient } from "@prisma/client";
import path from "path";
import { NAMESPACE } from "./constants";

export const dbName = `${NAMESPACE}.db`;
export const dbOut = path.resolve(
  process.env.REVAL_PROJECT_ROOT || process.cwd(),
  `.${NAMESPACE}`,
);
export const dbPath = path.join(dbOut, dbName);
export const dbSchema = `${NAMESPACE}.prisma`;

const currentFileUrl = new URL(import.meta.url);
const currentDir = path.dirname(currentFileUrl.pathname);
export const prismaPath = path.resolve(currentDir, `../${dbSchema}`);

let prisma: PrismaClient | null = null;
export const getDb = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        RevalDb: {
          url: `file:${dbPath}`,
        },
      },
    });
  }
  return prisma;
};

export const disconnectDb = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};
