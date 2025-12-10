import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { completed } = await request.json();
    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Completed must be a boolean" },
        { status: 400 }
      );
    }
    const updatedItem = await prisma.$transaction(
      async (tx) => {
        return await tx.item.update({
          where: { id },
          data: { completed },
        });
      },
      {
        isolationLevel: "ReadCommitted",
      }
    );
    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.$transaction(
      async (tx) => {
        await tx.item.delete({
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
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
