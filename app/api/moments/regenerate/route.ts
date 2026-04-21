import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateImage } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { momentId } = await request.json();

    if (!momentId) {
      return NextResponse.json(
        { error: "momentId is required" },
        { status: 400 }
      );
    }

    const moment = await prisma.memoryMoment.findUnique({
      where: { id: momentId },
    });

    if (!moment) {
      return NextResponse.json({ error: "Moment not found" }, { status: 404 });
    }

    const imagePath = await generateImage(moment.prompt);

    const updated = await prisma.memoryMoment.update({
      where: { id: momentId },
      data: { imagePath },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Moment regeneration error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to regenerate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
