// src/components/comment-form.tsx
"use client";

import { useState } from "react";
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
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const commentSchema = z.object({
  content: z
    .string()
    .min(2, { message: "コメントは2文字以上である必要があります" })
    .max(500, { message: "コメントは500文字以下である必要があります" }),
});

type CommentFormValues = z.infer<typeof commentSchema>;

type CommentFormProps = {
  threadId: string;
  parentId?: string | null;
  onSubmitted?: () => void;
};

export default function CommentForm({
  threadId,
  parentId = null,
  onSubmitted,
}: CommentFormProps) {
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  async function onSubmit(values: CommentFormValues) {
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/threads/${threadId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: values.content,
          authorId: session.user.id,
          parentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      form.reset();
      
      // 投稿成功時のコールバック
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-4 border rounded-md bg-muted/50">
        <p className="text-muted-foreground">
          コメントを投稿するにはログインが必要です
        </p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => window.location.href = "/api/auth/signin"}
        >
          ログイン
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={parentId ? "返信を入力..." : "コメントを入力..."}
                  className={parentId ? "h-20" : "h-32"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {parentId ? "返信する" : "投稿する"}
          </Button>
        </div>
      </form>
    </Form>
  );
}