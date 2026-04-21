import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const moments = await prisma.memoryMoment.findMany({
    where: { songId: params.id },
    orderBy: { timestampSec: "asc" },
  });

  return NextResponse.json(moments);
}
