// src/app/thread/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const threadSchema = z.object({
  title: z
    .string()
    .min(5, { message: "タイトルは5文字以上である必要があります" })
    .max(100, { message: "タイトルは100文字以下である必要があります" }),
  description: z
    .string()
    .min(10, { message: "概要は10文字以上である必要があります" })
    .max(500, { message: "概要は500文字以下である必要があります" }),
});

type ThreadFormValues = z.infer<typeof threadSchema>;

export default function CreateThreadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ThreadFormValues>({
    resolver: zodResolver(threadSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

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
          スレッドを作成するにはログインが必要です
        </p>
        <Button onClick={() => router.push("/api/auth/signin")}>
          ログイン
        </Button>
      </div>
    );
  }

  async function onSubmit(values: ThreadFormValues) {
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          authorId: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create thread");
      }

      const data = await response.json();
      router.push(`/thread/${data.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating thread:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">スレッド作成</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>タイトル</FormLabel>
                <FormControl>
                  <Input placeholder="スレッドのタイトルを入力" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>概要</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="スレッドの概要を入力"
                    className="h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            作成
          </Button>
        </form>
      </Form>
    </div>
  );
}