import { listEvals } from "@reval/core";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const evals = await listEvals(100); // Get up to 100 evals
    // For the API, we can return just the summary data since that's what's typically needed
    return NextResponse.json(evals);
  } catch (error) {
    console.error("Error fetching evals:", error);
    return NextResponse.json(
      { error: "Failed to fetch evals" },
      { status: 500 },
    );
  }
}
