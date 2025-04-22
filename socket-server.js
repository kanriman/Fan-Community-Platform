// socket-server.js
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 2週間前の日付を取得
function getTwoWeeksAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 14);
  return date;
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // 接続時に過去のメッセージを送信
  const fetchMessages = async () => {
    try {
      const twoWeeksAgo = getTwoWeeksAgo();
      const messages = await prisma.message.findMany({
        where: {
          createdAt: {
            gte: twoWeeksAgo,
          },
        },
        orderBy: {
          createdAt: 'asc',
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
      socket.emit('messages', messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  fetchMessages();

  // メッセージ受信時の処理
  socket.on('message', async (data) => {
    try {
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
      io.emit('message', newMessage);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // 切断時の処理
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// 古いメッセージのクリーンアップジョブ
const cleanupMessages = async () => {
  const twoWeeksAgo = getTwoWeeksAgo();
  try {
    const { count } = await prisma.message.deleteMany({
      where: {
        createdAt: {
          lt: twoWeeksAgo,
        },
      },
    });
    console.log(`Deleted ${count} old messages`);
  } catch (error) {
    console.error('Error cleaning up messages:', error);
  }
};

// 1日に1回、古いメッセージをクリーンアップ
setInterval(cleanupMessages, 24 * 60 * 60 * 1000);

// デフォルトのポートは3001（Nextとは別のポート）
const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running at http://localhost:${PORT}`);
});