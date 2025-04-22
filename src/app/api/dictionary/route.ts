// src/app/api/dictionary/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// 全ての辞典エントリを取得
export async function GET() {
  try {
    const entries = await prisma.dictionaryEntry.findMany({
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        term: "asc",
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching dictionary entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch dictionary entries" },
      { status: 500 }
    );
  }
}

// 新しい辞典エントリを作成
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { term, description, origin, authorId } = await request.json();

    const entry = await prisma.dictionaryEntry.create({
      data: {
        term,
        description,
        origin,
        author: {
          connect: {
            id: authorId,
          },
        },
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error creating dictionary entry:", error);
    
    // 一意制約エラーの場合（既に存在する用語）
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This term already exists", code: "P2002" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create dictionary entry" },
      { status: 500 }
    );
  }
}

