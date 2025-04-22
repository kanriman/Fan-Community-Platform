// src/app/dictionary/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

type DictionaryEntry = {
  id: string;
  term: string;
  description: string;
  origin: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string | null;
    image: string | null;
  };
};

export default function DictionaryDetailPage({ params }: { params: { id: string } }) {
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const response = await fetch(`/api/dictionary/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch dictionary entry");
        }
        const data = await response.json();
        setEntry(data);
      } catch (error) {
        console.error("Error fetching dictionary entry:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">
          この用語は見つかりませんでした
        </p>
        <Link href="/dictionary">
          <Button>配信辞典に戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dictionary"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          配信辞典に戻る
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">{entry.term}</h1>
        <Link href={`/dictionary/${entry.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>説明</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{entry.description}</p>
        </CardContent>
      </Card>

      {entry.origin && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>起源</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{entry.origin}</p>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        <p>
          登録者: {entry.author.name || "匿名ユーザー"} • 
          登録日: {new Date(entry.createdAt).toLocaleDateString("ja-JP")} • 
          最終更新: {formatDistanceToNow(new Date(entry.updatedAt), { addSuffix: true, locale: ja })}
        </p>
      </div>
    </div>
  );
}