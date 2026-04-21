import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const song = await prisma.song.findUnique({
    where: { id },
    include: {
      moments: { orderBy: { timestampSec: "asc" } },
    },
  });

  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  return NextResponse.json(song);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const song = await prisma.song.findUnique({
    where: { id },
    include: { moments: true },
  });

  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  // Delete generated images for all moments
  for (const moment of song.moments) {
    const imgPath = path.resolve(moment.imagePath.replace(/^\//, ""));
    if (fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath);
    }
  }

  // Delete the uploaded audio file
  const audioPath = path.resolve(song.storedPath);
  if (fs.existsSync(audioPath)) {
    fs.unlinkSync(audioPath);
  }

  // Delete moments then song from DB
  await prisma.memoryMoment.deleteMany({ where: { songId: id } });
  await prisma.song.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

// Serve the audio file
export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const song = await prisma.song.findUnique({ where: { id: params.id } });
  if (!song) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(null, {
    headers: { "Content-Type": song.mimeType },
  });
}
