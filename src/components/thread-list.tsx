// src/components/thread-list.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesSquare, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Thread = {
  id: string;
  title: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
};

export default function ThreadList() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await fetch("/api/threads");
        const data = await response.json();
        setThreads(data);
      } catch (error) {
        console.error("Failed to fetch threads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-4">
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">スレッドがありません。新しいスレッドを作成してみましょう！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Link key={thread.id} href={`/thread/${thread.id}`}>
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader className="p-4">
              <CardTitle className="text-xl">{thread.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Eye className="mr-1 h-4 w-4" />
                    <span>{thread.viewCount}</span>
                  </div>
                  <div className="flex items-center">
                    <MessagesSquare className="mr-1 h-4 w-4" />
                    <span>{thread.commentCount}</span>
                  </div>
                </div>
                <span>
                  {formatDistanceToNow(new Date(thread.createdAt), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}