import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeFileChecksum } from "@/lib/hashing";
import { saveUploadedFile } from "@/lib/storage";

const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".mp3")) {
      return NextResponse.json(
        { error: "Only MP3 files are supported" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 50MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { storedPath } = saveUploadedFile(buffer, file.name);
    const checksum = computeFileChecksum(storedPath);

    // Check for duplicate
    const existing = await prisma.song.findUnique({ where: { checksum } });
    if (existing) {
      return NextResponse.json(existing);
    }

    const song = await prisma.song.create({
      data: {
        originalName: file.name,
        storedPath,
        checksum,
        durationSec: 0, // Will be set from client-side audio metadata
        mimeType: file.type || "audio/mpeg",
        sizeBytes: file.size,
      },
    });

    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
