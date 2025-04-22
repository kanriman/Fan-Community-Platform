// src/app/dictionary/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type DictionaryEntry = {
  id: string;
  term: string;
  description: string;
  origin: string | null;
};

const dictionarySchema = z.object({
  term: z
    .string()
    .min(1, { message: "用語を入力してください" })
    .max(50, { message: "用語は50文字以下である必要があります" }),
  description: z
    .string()
    .min(5, { message: "説明は5文字以上である必要があります" })
    .max(1000, { message: "説明は1000文字以下である必要があります" }),
  origin: z
    .string()
    .max(500, { message: "起源は500文字以下である必要があります" })
    .optional(),
});

type DictionaryFormValues = z.infer<typeof dictionarySchema>;

export default function EditDictionaryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DictionaryFormValues>({
    resolver: zodResolver(dictionarySchema),
    defaultValues: {
      term: "",
      description: "",
      origin: "",
    },
  });

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const response = await fetch(`/api/dictionary/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch dictionary entry");
        }
        const data = await response.json();
        setEntry(data);
        
        // フォームの初期値を設定
        form.reset({
          term: data.term,
          description: data.description,
          origin: data.origin || "",
        });
      } catch (error) {
        console.error("Error fetching dictionary entry:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [params.id, form]);

  if (status === "loading" || loading) {
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
          用語を編集するにはログインが必要です
        </p>
        <Button onClick={() => router.push("/api/auth/signin")}>
          ログイン
        </Button>
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

  async function onSubmit(values: DictionaryFormValues) {
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/dictionary/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          term: values.term,
          description: values.description,
          origin: values.origin || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update dictionary entry");
      }

      toast({
        title: "編集が完了しました！",
        description: `「${values.term}」の内容を更新しました`,
        duration: 3000,
      });
      
      router.push(`/dictionary/${params.id}`);
    } catch (error) {
      console.error("Error updating dictionary entry:", error);
      toast({
        title: "エラーが発生しました",
        description: "更新に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dictionary/${params.id}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          詳細に戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">用語を編集</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="term"
            render={({ field }) => (
              <FormItem>
                <FormLabel>登録する言葉</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>説明</FormLabel>
                <FormControl>
                  <Textarea
                    className="h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>生まれ（起源）</FormLabel>
                <FormControl>
                  <Textarea
                    className="h-24"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            更新する
          </Button>
        </form>
      </Form>
    </div>
  );
}