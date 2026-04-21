import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const song = await prisma.song.findUnique({ where: { id: params.id } });

  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const filePath = path.resolve(song.storedPath);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const range = request.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });
    const buffer = await streamToBuffer(stream);

    return new NextResponse(new Uint8Array(buffer), {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": song.mimeType,
      },
    });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Length": String(stat.size),
      "Content-Type": song.mimeType,
      "Accept-Ranges": "bytes",
    },
  });
}

async function streamToBuffer(
  stream: fs.ReadStream
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk as ArrayBuffer));
  }
  return Buffer.concat(chunks);
}
