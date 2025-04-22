// src/app/dictionary/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

// 用語の型定義
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

// カタカナを含む五十音順のグループ
const kanaGroups = [
  { id: "a", label: "あ行", chars: ["あ", "い", "う", "え", "お", "ア", "イ", "ウ", "エ", "オ"] },
  { id: "ka", label: "か行", chars: ["か", "き", "く", "け", "こ", "カ", "キ", "ク", "ケ", "コ"] },
  { id: "sa", label: "さ行", chars: ["さ", "し", "す", "せ", "そ", "サ", "シ", "ス", "セ", "ソ"] },
  { id: "ta", label: "た行", chars: ["た", "ち", "つ", "て", "と", "タ", "チ", "ツ", "テ", "ト"] },
  { id: "na", label: "な行", chars: ["な", "に", "ぬ", "ね", "の", "ナ", "ニ", "ヌ", "ネ", "ノ"] },
  { id: "ha", label: "は行", chars: ["は", "ひ", "ふ", "へ", "ほ", "ハ", "ヒ", "フ", "ヘ", "ホ"] },
  { id: "ma", label: "ま行", chars: ["ま", "み", "む", "め", "も", "マ", "ミ", "ム", "メ", "モ"] },
  { id: "ya", label: "や行", chars: ["や", "ゆ", "よ", "ヤ", "ユ", "ヨ"] },
  { id: "ra", label: "ら行", chars: ["ら", "り", "る", "れ", "ろ", "ラ", "リ", "ル", "レ", "ロ"] },
  { id: "wa", label: "わ行", chars: ["わ", "を", "ん", "ワ", "ヲ", "ン"] },
  { id: "emoji", label: "絵文字・記号", chars: [] }, // 絵文字や記号は特殊処理
  { id: "other", label: "その他", chars: [] }, // 英数字やその他は特殊処理
];

export default function DictionaryPage() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/dictionary");
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error("Failed to fetch dictionary entries:", error);
    } finally {
      setLoading(false);
    }
  };

  // 検索フィルター
  const filteredEntries = entries.filter((entry) => {
    if (searchTerm) {
      return (
        entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  // 用語の最初の文字に基づいてグループ分け
  const getGroup = (term: string) => {
    const firstChar = term.charAt(0);
    
    // 絵文字や記号の判定（Unicodeの範囲で簡易判定）
    if (/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}]/u.test(firstChar) || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(firstChar)) {
      return "emoji";
    }
    
    // 五十音グループの判定
    for (const group of kanaGroups) {
      if (group.chars.some(char => firstChar === char)) {
        return group.id;
      }
    }
    
    // その他（英数字など）
    return "other";
  };

  // タブによるフィルタリング
  const tabFilteredEntries = activeTab === "all" 
    ? filteredEntries 
    : filteredEntries.filter(entry => getGroup(entry.term) === activeTab);

  // 用語をアルファベット順にソート
  const sortedEntries = [...tabFilteredEntries].sort((a, b) => 
    a.term.localeCompare(b.term, "ja")
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">配信辞典</h1>
        <Link href="/dictionary/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            用語を登録
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="用語を検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap h-auto">
          <TabsTrigger value="all">すべて</TabsTrigger>
          {kanaGroups.map((group) => (
            <TabsTrigger key={group.id} value={group.id}>
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="h-40 animate-pulse">
                  <CardHeader className="bg-muted/50"></CardHeader>
                  <CardContent className="bg-muted/30"></CardContent>
                </Card>
              ))}
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "検索条件に一致する用語がありません"
                  : "このカテゴリには用語がありません"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedEntries.map((entry) => (
                <Link key={entry.id} href={`/dictionary/${entry.id}`}>
                  <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle>{entry.term}</CardTitle>
                      <CardDescription className="text-xs">
                        更新: {formatDistanceToNow(new Date(entry.updatedAt), { addSuffix: true, locale: ja })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm">{entry.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}