import { db, runs, executions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const runId = params.id;
    
    // Get the run details
    const run = await db.select().from(runs).where(eq(runs.id, runId)).limit(1);
    
    if (run.length === 0) {
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }
    
    // Get all executions for this run
    const runExecutions = await db
      .select()
      .from(executions)
      .where(eq(executions.runId, runId));
    
    return NextResponse.json({
      run: run[0],
      executions: runExecutions,
    });
  } catch (error) {
    console.error("Error fetching run:", error);
    return NextResponse.json(
      { error: "Failed to fetch run" },
      { status: 500 }
    );
  }
}