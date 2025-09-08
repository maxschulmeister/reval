import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const projectRoot = process.env.REVAL_PROJECT_ROOT;

    if (!projectRoot) {
      return NextResponse.json(
        { error: "REVAL_PROJECT_ROOT not configured" },
        { status: 500 },
      );
    }

    const filePath = path.join(projectRoot, ...resolvedParams.path);

    // Security check: ensure the file is within the project root
    const resolvedPath = path.resolve(filePath);
    const resolvedRoot = path.resolve(projectRoot);

    if (!resolvedPath.startsWith(resolvedRoot)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if it's a file (not a directory)
    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }

    // Determine content type based on file extension
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".json": "application/json",
      ".csv": "text/csv",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";

    // Read the file and return it
    const fileBuffer = fs.readFileSync(resolvedPath);

    // Return the file
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
