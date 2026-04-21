import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { durationSec } = body;

  if (typeof durationSec !== "number" || durationSec <= 0) {
    return NextResponse.json(
      { error: "Valid durationSec required" },
      { status: 400 }
    );
  }

  const song = await prisma.song.update({
    where: { id: params.id },
    data: { durationSec },
  });

  return NextResponse.json(song);
}
