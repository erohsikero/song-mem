import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateImage } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { songId, timestampSec, prompt } = body;

    if (!songId || timestampSec == null || !prompt?.trim()) {
      return NextResponse.json(
        { error: "songId, timestampSec, and prompt are required" },
        { status: 400 }
      );
    }

    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    const imagePath = await generateImage(prompt.trim());

    const moment = await prisma.memoryMoment.create({
      data: {
        songId,
        timestampSec: Number(timestampSec),
        prompt: prompt.trim(),
        imagePath,
      },
    });

    return NextResponse.json(moment, { status: 201 });
  } catch (error) {
    console.error("Moment creation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create moment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
