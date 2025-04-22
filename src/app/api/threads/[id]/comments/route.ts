// src/app/api/threads/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// スレッドのコメント一覧を取得
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 親コメントとその返信を取得
    const comments = await prisma.comment.findMany({
      where: {
        threadId: params.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// 新しいコメントを作成
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
    const { content, authorId, parentId } = await request.json();

    const comment = await prisma.comment.create({
      data: {
        content,
        thread: {
          connect: {
            id: params.id,
          },
        },
        author: {
          connect: {
            id: authorId,
          },
        },
        parent: parentId
          ? {
              connect: {
                id: parentId,
              },
            }
          : undefined,
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

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}