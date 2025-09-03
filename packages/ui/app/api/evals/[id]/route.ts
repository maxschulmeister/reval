import { getEvalDetails } from "@reval/core";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log("Fetching eval details for ID:", id);
    
    const evalData = await getEvalDetails(id);
    console.log("Eval data result:", evalData ? "Found" : "Not found");
    
    if (!evalData) {
      return NextResponse.json(
        { error: "Eval not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(evalData);
  } catch (error) {
    console.error("Error fetching eval details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "Unknown error");
    return NextResponse.json(
      { 
        error: "Failed to fetch eval details",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}