// src/app/api/threads/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// スレッド一覧を取得
export async function GET() {
  try {
    // 48時間以内に作成されたスレッドのみ取得
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // コメント数が100件以上のスレッドまたは48時間以内に作成されたスレッドを取得
    // トレンド（人気のある）スレッドを取得する修正版
const threads = await prisma.thread.findMany({
  where: {
    OR: [
      {
        createdAt: {
          gte: twoDaysAgo,
        },
      },
      {
        comments: {
          some: {},
        },
      },
    ],
  },
  include: {
    author: {
      select: {
        name: true,
        image: true,
      },
    },
    _count: {
      select: {
        comments: true,
      },
    },
  },
  orderBy: [
    {
      viewCount: "desc",
    },
  ],
  take: 50,
});

    // フロントエンドに適したフォーマットに変換
    const formattedThreads = threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      viewCount: thread.viewCount,
      commentCount: thread._count.comments,
      createdAt: thread.createdAt.toISOString(),
      author: {
        name: thread.author.name,
        image: thread.author.image,
      },
    }));

    return NextResponse.json(formattedThreads);
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}

// 新しいスレッドを作成
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { title, description, authorId } = await request.json();

    const thread = await prisma.thread.create({
      data: {
        title,
        description,
        author: {
          connect: {
            id: authorId,
          },
        },
      },
    });

    return NextResponse.json(thread);
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}

