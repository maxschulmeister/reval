import { getRunDetails } from "@reval/core";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: runId } = await params;

    // Use the existing query function from core
    const runData = await getRunDetails(runId);

    if (!runData) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({
      run: runData.run,
      executions: runData.executions,
    });
  } catch (error) {
    console.error("Error fetching run:", error);
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 500 });
  }
}
