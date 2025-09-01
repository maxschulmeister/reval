import { getEvalDetails } from "@reval/core";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eval_id } = await params;

    // Use the existing query function from core
    const evalData = await getEvalDetails(eval_id);

    if (!evalData) {
      return NextResponse.json({ error: "Eval not found" }, { status: 404 });
    }

    return NextResponse.json({
      eval: evalData.eval,
    runs: evalData.runs,
    });
  } catch (error) {
    console.error("Error fetching eval:", error);
    return NextResponse.json({ error: "Failed to fetch eval" }, { status: 500 });
  }
}
