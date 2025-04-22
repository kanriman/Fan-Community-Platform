// src/app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (session?.user) {
      setUsername(session.user.name || "");
      setAvatarUrl(session.user.image || "");
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">
          設定を変更するにはログインが必要です
        </p>
        <Button onClick={() => router.push("/api/auth/signin")}>
          ログイン
        </Button>
      </div>
    );
  }

  const handleProfileUpdate = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: username,
          image: avatarUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // セッションを更新
      await update({
        ...session,
        user: {
          ...session.user,
          name: username,
          image: avatarUrl,
        },
      });

      toast({
        title: "プロフィールを更新しました",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "エラーが発生しました",
        description: "プロフィールの更新に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
          <TabsTrigger value="appearance">表示設定</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>プロフィール設定</CardTitle>
              <CardDescription>
                プロフィール情報を変更できます。ここで設定した情報は他のユーザーに表示されます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">ユーザーネーム</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">アイコンURL</Label>
                <Input
                  id="avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
                {avatarUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">プレビュー</p>
                    <img
                      src={avatarUrl}
                      alt="アイコンプレビュー"
                      className="w-16 h-16 rounded-full object-cover border"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-avatar.png";
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                変更を保存
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>表示設定</CardTitle>
              <CardDescription>
                アプリの表示方法をカスタマイズできます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ダークモード</Label>
                  <p className="text-sm text-muted-foreground">
                    ダークテーマを使用する
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={handleThemeToggle}
                  />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}