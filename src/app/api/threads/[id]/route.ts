// src/app/api/threads/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 特定のスレッドを取得
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const thread = await prisma.thread.findUnique({
      where: {
        id: params.id,
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error("Error fetching thread:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread" },
      { status: 500 }
    );
  }
}
