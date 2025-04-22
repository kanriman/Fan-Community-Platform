// src/app/live/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye } from "lucide-react";
import Link from "next/link";

type StreamerPlatform = "YOUTUBE" | "TWITCH" | "KICK" | "TWITCASTING";

type LiveStream = {
  id: string;
  streamerName: string;
  platform: StreamerPlatform;
  title: string;
  thumbnailUrl: string;
  viewerCount: number;
  streamUrl: string;
};

export default function LivePage() {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        const response = await fetch("/api/live");
        const data = await response.json();
        setLiveStreams(data);
      } catch (error) {
        console.error("Failed to fetch live streams:", error);
      } finally {
        setLoading(false);
      }
    };

    // 初回読み込み
    fetchLiveStreams();

    // 30秒ごとに更新
    const intervalId = setInterval(fetchLiveStreams, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // ローディング状態
  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">ライブ配信</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Skeleton className="h-4 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 配信がない場合
  if (liveStreams.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">ライブ配信</h1>
        <div className="text-center py-20 border rounded-lg bg-muted/50">
          <p className="text-lg text-muted-foreground">現在ライブ配信中の配信者はいません</p>
        </div>
      </div>
    );
  }

  // プラットフォームによって背景色を変える関数
  const getPlatformBadgeClass = (platform: StreamerPlatform) => {
    switch (platform) {
      case "YOUTUBE":
        return "bg-red-500";
      case "TWITCH":
        return "bg-purple-500";
      case "KICK":
        return "bg-green-500";
      case "TWITCASTING":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ライブ配信</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveStreams.map((stream) => (
          <Link href={stream.streamUrl} key={stream.id} target="_blank" rel="noopener noreferrer">
            <Card className="overflow-hidden h-full hover:border-primary transition-colors">
              <div className="relative aspect-video bg-muted">
                <img
                  src={stream.thumbnailUrl || "/placeholder.jpg"}
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
                <div
                  className={`absolute top-2 right-2 text-xs font-medium text-white px-2 py-1 rounded ${getPlatformBadgeClass(
                    stream.platform
                  )}`}
                >
                  {stream.platform}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-1">{stream.title}</h3>
                <p className="text-sm text-muted-foreground">{stream.streamerName}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>
                    {stream.viewerCount.toLocaleString()} 視聴者
                  </span>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}