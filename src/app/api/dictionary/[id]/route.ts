// src/app/api/dictionary/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// 特定の辞典エントリを取得
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await prisma.dictionaryEntry.findUnique({
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

    if (!entry) {
      return NextResponse.json(
        { error: "Dictionary entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching dictionary entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch dictionary entry" },
      { status: 500 }
    );
  }
}

// 辞典エントリを更新
export async function PATCH(
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
    const { term, description, origin } = await request.json();

    const entry = await prisma.dictionaryEntry.update({
      where: {
        id: params.id,
      },
      data: {
        term,
        description,
        origin,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating dictionary entry:", error);
    
    // エントリが見つからない場合
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Dictionary entry not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update dictionary entry" },
      { status: 500 }
    );
  }
}

// 辞典エントリを削除
export async function DELETE(
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
    await prisma.dictionaryEntry.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dictionary entry:", error);
    
    // エントリが見つからない場合
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Dictionary entry not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete dictionary entry" },
      { status: 500 }
    );
  }
}