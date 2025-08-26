// Prisma types are generated from schema.prisma
// These types match the original Drizzle types for compatibility
export type Run = {
  id: string;
  name: string;
  notes?: string | null;
  function: string;
  features: any; // JSON data
  target: any; // JSON data
  variants: any; // JSON data
  timestamp: number;
};

export type Execution = {
  id: string;
  runId: string;
  features: any; // JSON data
  target: any; // JSON data
  result?: any | null; // JSON data
  time: number; // in milliseconds
  retries: number;
  status: string; // "success" or "error"
  variant: any; // JSON data
};

export type Benchmark = { run: Run; executions: Execution[] };

export enum Status {
  Success = "success",
  Error = "error",
}
