import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GENERATED_DIR = process.env.GENERATED_DIR || "./generated";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filename = params.path.join("/");

  // Prevent directory traversal
  if (filename.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filePath = path.resolve(GENERATED_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
