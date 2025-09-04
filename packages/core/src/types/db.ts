import type {
  Eval as PrismaEval,
  Run as PrismaRun,
  Status as PrismaStatus,
} from "@prisma/client/client";
import type { JsonObject } from "@prisma/client/runtime/library";
import type { Primitive } from "./config";

// Prisma types are generated from Prisma schema
export type Eval = PrismaEval;

export type Run = PrismaRun;

export type Reval = { eval: Eval; runs: Run[] };

export type Status = PrismaStatus;

export interface EvalSummary {
  id: string;
  name: string;
  timestamp: Date;
  totalRuns: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgTime: number;
  notes?: string;
}

export interface EvalDetails extends EvalSummary {
  eval: Eval;
  runs: Run[];
}

export type Score = {
  accuracy: number | Array<Primitive | JsonObject>;
  diff?: number | Array<Primitive | JsonObject>;
} | null;
