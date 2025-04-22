// src/app/talk/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, CornerDownRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";

// メッセージの型定義
type Message = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  parentId: string | null;
};

// メッセージフォームのスキーマ
const messageSchema = z.object({
  content: z.string().min(1).max(500),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export default function TalkPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  // Socket.io接続の初期化
  useEffect(() => {
    // すでに接続がある場合は処理をスキップ
    if (socket || isConnecting) return;

    setIsConnecting(true);

    // Socket.io接続を作成（独立したサーバーに接続）
    const newSocket = io("http://localhost:3001", {
      transports: ["websocket", "polling"]
    });

    // 接続イベントのハンドリング
    newSocket.on("connect", () => {
      console.log("Socket.io connected!");
      setIsConnecting(false);
    });

    // 切断イベントのハンドリング
    newSocket.on("disconnect", () => {
      console.log("Socket.io disconnected!");
    });

    // メッセージ受信イベントのハンドリング
    newSocket.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      // 新規メッセージを受信したら自動スクロール
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    // 過去メッセージ受信イベントのハンドリング
    newSocket.on("messages", (messageHistory: Message[]) => {
      setMessages(messageHistory);
      // 過去メッセージを受信したら自動スクロール
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    // ソケットをステートに保存
    setSocket(newSocket);

    // コンポーネントのアンマウント時にソケット接続を閉じる
    return () => {
      if (socket) {
        socket.disconnect();
      }
      setIsConnecting(false);
    };
  }, [socket, isConnecting]);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // メッセージ送信処理
  const onSubmit = (values: MessageFormValues) => {
    if (!session?.user || !socket) return;

    // 送信するメッセージデータ
    const messageData = {
      content: values.content,
      authorId: session.user.id,
      parentId: replyingTo?.id || null,
    };

    // Socket.ioを通じてメッセージを送信
    socket.emit("message", messageData);

    // フォームをリセット
    form.reset();

    // 返信状態をリセット
    if (replyingTo) {
      setReplyingTo(null);
    }
  };

  // 返信ボタンのハンドラ
  const handleReply = (message: Message) => {
    setReplyingTo(message);
    // 入力フォームにフォーカス
    document.getElementById("message-input")?.focus();
  };

  // 返信のキャンセル
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // メッセージグループ（親メッセージと返信）を作成
  const messageGroups = messages.reduce<{ [key: string]: Message[] }>((groups, message) => {
    const key = message.parentId || message.id;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex-1 overflow-y-auto p-4">
        {Object.values(messageGroups).map((group) => {
          const parent = group.find((msg) => !msg.parentId) || group[0];
          const replies = group.filter((msg) => msg.parentId === parent.id);

          return (
            <div key={parent.id} className="mb-4">
              {/* 親メッセージ */}
              <div className="flex items-start mb-1">
                {parent.author.image ? (
                  <img
                    src={parent.author.image}
                    alt={parent.author.name || "User"}
                    className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-xs text-primary">
                      {parent.author.name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <div className="flex-1 bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center mb-1">
                    <p className="font-medium text-sm">{parent.author.name || "匿名ユーザー"}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatDistanceToNow(new Date(parent.createdAt), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </span>
                  </div>
                  <p className="text-sm break-words">{parent.content}</p>
                  {session && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReply(parent)}
                      className="mt-1 h-6 text-xs text-muted-foreground hover:text-foreground"
                    >
                      返信
                    </Button>
                  )}
                </div>
              </div>

              {/* 返信メッセージ */}
              {replies.length > 0 && (
                <div className="ml-10 space-y-1">
                  {replies.map((reply) => (
                    <div key={reply.id} className="flex items-start">
                      <CornerDownRight className="h-4 w-4 mr-1 text-muted-foreground flex-shrink-0 mt-2" />
                      {reply.author.image ? (
                        <img
                          src={reply.author.image}
                          alt={reply.author.name || "User"}
                          className="w-6 h-6 rounded-full mr-2 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-xs text-primary">
                            {reply.author.name?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 bg-muted/30 rounded-lg p-2">
                        <div className="flex items-center mb-1">
                          <p className="font-medium text-xs">{reply.author.name || "匿名ユーザー"}</p>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatDistanceToNow(new Date(reply.createdAt), {
                              addSuffix: true,
                              locale: ja,
                            })}
                          </span>
                        </div>
                        <p className="text-xs break-words">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {status === "unauthenticated" ? (
        <div className="p-4 border-t">
          <div className="text-center py-2">
            <p className="text-muted-foreground mb-2">メッセージを送信するにはログインが必要です</p>
            <Button onClick={() => window.location.href = "/api/auth/signin"}>
              ログイン
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t">
          {replyingTo && (
            <div className="mb-2 flex items-center text-sm text-muted-foreground">
              <span className="mr-2">返信先:</span>
              <span className="font-medium mr-1">{replyingTo.author.name || "匿名ユーザー"}</span>
              <span className="truncate flex-1">{replyingTo.content}</span>
              <Button variant="ghost" size="sm" onClick={cancelReply} className="ml-2 h-6 px-2">
                ×
              </Button>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-2">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        id="message-input"
                        placeholder={replyingTo ? "返信を入力..." : "メッセージを入力..."}
                        {...field}
                        className="flex-1"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" size="icon" disabled={!socket}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}