// src/app/dictionary/create/page.tsx
"use client";

import { useState } from "react";
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

export default function CreateDictionaryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
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
          用語を登録するにはログインが必要です
        </p>
        <Button onClick={() => router.push("/api/auth/signin")}>
          ログイン
        </Button>
      </div>
    );
  }

  async function onSubmit(values: DictionaryFormValues) {
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dictionary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          term: values.term,
          description: values.description,
          origin: values.origin || null,
          authorId: session.user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === "P2002") {
          form.setError("term", {
            type: "manual",
            message: "この用語は既に登録されています",
          });
          throw new Error("この用語は既に登録されています");
        }
        throw new Error("Failed to create dictionary entry");
      }

      const data = await response.json();
      
      toast({
        title: "登録が完了しました！",
        description: `「${values.term}」を辞典に登録しました`,
        duration: 3000,
      });
      
      router.push(`/dictionary/${data.id}`);
    } catch (error) {
      console.error("Error creating dictionary entry:", error);
      if (!(error instanceof Error && error.message === "この用語は既に登録されています")) {
        toast({
          title: "エラーが発生しました",
          description: "登録に失敗しました。もう一度お試しください。",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
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

      <h1 className="text-2xl font-bold mb-6">用語を登録</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="term"
            render={({ field }) => (
              <FormItem>
                <FormLabel>登録する言葉</FormLabel>
                <FormControl>
                  <Input placeholder="例: 888" {...field} />
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
                    placeholder="用語の意味や使われ方について説明してください"
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
                    placeholder="この言葉がどのように生まれたのか、任意で入力してください"
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
            登録する
          </Button>
        </form>
      </Form>
    </div>
  );
}