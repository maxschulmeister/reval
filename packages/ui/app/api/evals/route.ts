import { listEvals } from "@reval/core";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const evals = await listEvals(100);
    return NextResponse.json({ evals });
  } catch (error) {
    console.error("Error fetching evals:", error);
    return NextResponse.json(
      { error: "Failed to fetch evals" },
      { status: 500 }
    );
  }
}