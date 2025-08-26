import { listRuns } from "@reval/core";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const runs = await listRuns(100); // Get up to 100 runs
    // For the API, we can return just the summary data since that's what's typically needed
    return NextResponse.json(runs);
  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 },
    );
  }
}
