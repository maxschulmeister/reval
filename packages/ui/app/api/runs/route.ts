import { db, runs } from "@reval/core";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allRuns = await db.select().from(runs).orderBy(runs.timestamp);
    return NextResponse.json(allRuns);
  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}