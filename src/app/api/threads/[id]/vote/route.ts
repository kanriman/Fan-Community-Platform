// src/app/api/comments/[id]/vote/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// コメントに対する投票
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { type } = await request.json();

    if (type !== "like" && type !== "bad") {
      return NextResponse.json(
        { error: "Invalid vote type" },
        { status: 400 }
      );
    }

    const updateData = type === "like" 
      ? { likeCount: { increment: 1 } } 
      : { badCount: { increment: 1 } };

    const comment = await prisma.comment.update({
      where: {
        id: params.id,
      },
      data: updateData,
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error voting on comment:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to vote on comment" },
      { status: 500 }
    );
  }
}