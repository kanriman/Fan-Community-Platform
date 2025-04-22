// src/app/api/socket/route.ts
import { Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

// Prismaクライアントの初期化
const prisma = new PrismaClient();

// グローバル変数としてSocketサーバーを保持
let io: SocketIOServer;

// 2週間前の日付を取得
function getTwoWeeksAgo(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 14);
  return date;
}

export async function GET() {
  // すでにSocketサーバーが初期化されている場合
  if (io) {
    return new NextResponse("Socket already initialized", { status: 200 });
  }

  try {
    // Socket.io サーバーを初期化
    io = new SocketIOServer({
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // 接続時に過去のメッセージを送信
      const fetchMessages = async () => {
        const twoWeeksAgo = getTwoWeeksAgo();

        try {
          // 過去2週間のメッセージを取得
          const messages = await prisma.message.findMany({
            where: {
              createdAt: {
                gte: twoWeeksAgo,
              },
            },
            orderBy: {
              createdAt: "asc",
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            take: 100, // 最大100件まで
          });

          // クライアントに過去のメッセージを送信
          socket.emit("messages", messages);
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };

      fetchMessages();

      // メッセージ受信時の処理
      socket.on("message", async (data) => {
        try {
          // データベースにメッセージを保存
          const newMessage = await prisma.message.create({
            data: {
              content: data.content,
              authorId: data.authorId,
              parentId: data.parentId || null,
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          });

          // 全クライアントにメッセージをブロードキャスト
          io.emit("message", newMessage);
        } catch (error) {
          console.error("Error saving message:", error);
        }
      });

      // 切断時の処理
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    // 古いメッセージのクリーンアップジョブ
    const cleanupMessages = async () => {
      const twoWeeksAgo = getTwoWeeksAgo();

      try {
        // 2週間より古いメッセージを削除
        const { count } = await prisma.message.deleteMany({
          where: {
            createdAt: {
              lt: twoWeeksAgo,
            },
          },
        });

        console.log(`Deleted ${count} old messages`);
      } catch (error) {
        console.error("Error cleaning up messages:", error);
      }
    };

    // 1日に1回、古いメッセージをクリーンアップ
    setInterval(cleanupMessages, 24 * 60 * 60 * 1000);

    return new NextResponse("Socket initialized", { status: 200 });
  } catch (error) {
    console.error("Socket initialization error:", error);
    return new NextResponse("Socket initialization failed", { status: 500 });
  }
}