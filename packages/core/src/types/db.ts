import { executions, runs } from "../db/schema";

export type Run = typeof runs.$inferInsert;
export type Execution = typeof executions.$inferInsert;
export type Benchmark = { run: Run; executions: Execution[] };
export enum Status {
  Success = "success",
  Error = "error",
}
