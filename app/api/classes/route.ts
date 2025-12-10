import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        items: true,
      },
    });
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch classes: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const newClass = await prisma.class.create({
      data: { name },
    });
    return NextResponse.json(newClass);
  } catch (error) {
    console.error("Error creating class:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create class: ${errorMessage}` },
      { status: 500 }
    );
  }
}
