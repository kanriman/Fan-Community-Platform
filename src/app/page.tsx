// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ThreadList from "@/components/thread-list";

export const dynamic = "force-dynamic";

export default function TrendPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">トレンド</h1>
        <Link href="/thread/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            スレッド作成
          </Button>
        </Link>
      </div>
      
      <ThreadList />
    </div>
  );
}