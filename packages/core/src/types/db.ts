import type {
  Eval as PrismaEval,
  Run as PrismaRun,
  Status as PrismaStatus,
} from "@prisma/client/client";
import type { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import { diff } from "json-diff-ts";
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
  accuracy: number | JsonObject;
  diff?: {
    score: number;
    object: Diff;
  };
} | null;

export interface Diff {
  old: JsonValue;
  new: JsonValue;
  changes: ReturnType<typeof diff>;
}
