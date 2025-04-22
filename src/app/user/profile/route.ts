// src/app/api/user/profile/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// ユーザープロフィールを更新
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { name, image } = await request.json();

    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
        image,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}

// テーマ設定を更新
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { darkMode } = await request.json();

    const user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        darkMode,
      },
    });

    return NextResponse.json({
      id: user.id,
      darkMode: user.darkMode,
    });
  } catch (error) {
    console.error("Error updating theme settings:", error);
    return NextResponse.json(
      { error: "Failed to update theme settings" },
      { status: 500 }
    );
  }
}