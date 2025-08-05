import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  function: text("function").notNull(),
  features: text("features", { mode: "json" }).notNull(),
  target: text("target", { mode: "json" }).notNull(),
  variants: text("variants", { mode: "json" }).notNull(),
  timestamp: integer("timestamp").notNull(),
});

export const executions = sqliteTable("executions", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id),
  features: text("features", { mode: "json" }).notNull(),
  target: text("target", { mode: "json" }).notNull(),
  result: text("result", { mode: "json" }),
  time: real("execution_time").notNull(), // in milliseconds
  retries: integer("retries").notNull(),
  status: text("status").notNull(), // "success" or "error"
  variant: text("variant", { mode: "json" }).notNull(),
});
