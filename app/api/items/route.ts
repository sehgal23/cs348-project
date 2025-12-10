import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const tag = searchParams.get("tag");
    const completed = searchParams.get("completed");
    const dueDate = searchParams.get("dueDate");

    if (!classId) {
      return NextResponse.json(
        { error: "classId is required" },
        { status: 400 }
      );
    }

    const where: any = { classId };
    if (tag) {
      where.tag = tag;
    }
    if (completed !== null) {
      where.completed = completed === "true";
    }
    if (dueDate) {
      // Filter for items due on the selected date (ignoring time)
      // Parse date string as local date to avoid timezone issues
      // If date is in YYYY-MM-DD format, parse it as local date
      let dateObj: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        const [year, month, day] = dueDate.split("-").map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(dueDate);
      }

      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      where.dueDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const items = await prisma.item.findMany({
      where,
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, tag, dueDate, classId } = await request.json();
    if (!name || !tag || !dueDate || !classId) {
      return NextResponse.json(
        { error: "Name, tag, dueDate, and classId are required" },
        { status: 400 }
      );
    }

    // Sanitized by trimmming whitespace and removing special characters
    const sanitizedName = name.trim().replace(/[^a-zA-Z0-9\s\-_]/g, "");

    if (!sanitizedName) {
      return NextResponse.json(
        { error: "Item name cannot be empty after sanitization" },
        { status: 400 }
      );
    }

    if (tag !== "assignment" && tag !== "midterm") {
      return NextResponse.json(
        { error: "Tag must be either 'assignment' or 'midterm'" },
        { status: 400 }
      );
    }
    let dateObj: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      const [year, month, day] = dueDate.split("-").map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(dueDate);
    }

    const newItem = await prisma.$transaction(
      async (tx) => {
        return await tx.item.create({
          data: {
            name: sanitizedName,
            tag,
            dueDate: dateObj,
            classId,
          },
        });
      },
      {
        isolationLevel: "ReadCommitted",
      }
    );
    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
