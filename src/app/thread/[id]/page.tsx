// src/app/thread/[id]/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import CommentList from "@/components/comment-list";
import CommentForm from "@/components/comment-form";
import { PrismaClient } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export const dynamic = "force-dynamic";

type ThreadDetailPageProps = {
  params: {
    id: string;
  };
};

// メタデータを動的に生成
export async function generateMetadata({
  params,
}: ThreadDetailPageProps): Promise<Metadata> {
  const thread = await getThread(params.id);
  if (!thread) {
    return {
      title: "スレッドが見つかりません",
    };
  }
  return {
    title: thread.title,
    description: thread.description,
  };
}

// スレッドを取得する関数
async function getThread(id: string) {
  const prisma = new PrismaClient();
  try {
    const thread = await prisma.thread.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    // スレッドが見つからない場合はnullを返す
    if (!thread) return null;

    // 閲覧数をインクリメント
    await prisma.thread.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return thread;
  } catch (error) {
    console.error("Error fetching thread:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

export default async function ThreadDetailPage({
  params,
}: ThreadDetailPageProps) {
  const thread = await getThread(params.id);

  if (!thread) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          戻る
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{thread.title}</h1>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            {thread.author.image && (
              <img
                src={thread.author.image}
                alt={thread.author.name || "User"}
                className="w-5 h-5 rounded-full mr-2"
              />
            )}
            <span>{thread.author.name}</span>
          </div>
          <span>
            {formatDistanceToNow(new Date(thread.createdAt), {
              addSuffix: true,
              locale: ja,
            })}
          </span>
        </div>
        <p className="text-foreground whitespace-pre-wrap">{thread.description}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">コメント</h2>
        <CommentList threadId={thread.id} />
      </div>

      <CommentForm threadId={thread.id} />
    </div>
  );
}