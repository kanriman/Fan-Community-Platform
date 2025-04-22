// src/components/navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { MessageSquare, TrendingUp, Video, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const navItems = [
    {
      label: "トーク",
      href: "/talk",
      icon: <MessageSquare className="h-5 w-5 mr-1" />,
    },
    {
      label: "トレンド",
      href: "/",
      icon: <TrendingUp className="h-5 w-5 mr-1" />,
    },
    {
      label: "ライブ",
      href: "/live",
      icon: <Video className="h-5 w-5 mr-1" />,
    },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-14 items-center">
        <div className="flex items-center justify-between w-full">
          {/* ナビゲーションリンク */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>

          {/* 右側のメニュー */}
          <div className="flex items-center">
            {/* テーマ切替ボタン */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-2"
            >
              {theme === "dark" ? (
                <span className="text-yellow-500">☀️</span>
              ) : (
                <span>🌙</span>
              )}
              <span className="sr-only">テーマ切替</span>
            </Button>

            {/* ユーザーメニュー */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">メニュー</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dictionary">配信辞典</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">設定</Link>
                </DropdownMenuItem>
                {session ? (
                  <DropdownMenuItem 
                    onClick={() => signOut()} 
                    className="text-red-500 focus:text-red-500"
                  >
                    ログアウト
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => signIn("google")}>
                    ログイン
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}