import type {
  Execution as PrismaExecution,
  Run as PrismaRun,
  Status as PrismaStatus,
} from "@prisma/client/client";

// Prisma types are generated from Prisma schema
export type Run = PrismaRun;

export type Execution = PrismaExecution;

export type Benchmark = { run: Run; executions: Execution[] };

export type Status = PrismaStatus;
