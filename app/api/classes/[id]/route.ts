import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.$transaction(
      async (tx) => {
        await tx.class.delete({
          where: { id },
        });
      },
      {
        isolationLevel: "ReadCommitted",
      }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
