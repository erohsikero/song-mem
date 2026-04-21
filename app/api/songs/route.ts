import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const songs = await prisma.song.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { moments: true } } },
  });
  return NextResponse.json(songs);
}
