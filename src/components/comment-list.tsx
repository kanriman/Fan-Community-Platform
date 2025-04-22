// src/components/comment-list.tsx
"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { ThumbsUp, ThumbsDown, MessageSquare, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import CommentForm from "@/components/comment-form";

type CommentAuthor = {
  id: string;
  name: string | null;
  image: string | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  likeCount: number;
  badCount: number;
  author: CommentAuthor;
  replies: Comment[];
  parentId: string | null;
};

type CommentListProps = {
  threadId: string;
};

export default function CommentList({ threadId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/threads/${threadId}/comments`);
      const data = await response.json();
      // 親コメントのみフィルタリング
      const parentComments = data.filter((comment: Comment) => !comment.parentId);
      // いいね数と返信数に基づいてソート
      const sortedComments = parentComments.sort(
        (a: Comment, b: Comment) => 
          (b.likeCount + b.replies.length * 2) - 
          (a.likeCount + a.replies.length * 2)
      );
      setComments(sortedComments);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [threadId]);

  const handleVote = async (commentId: string, type: "like" | "bad") => {
    if (!session) return;

    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error(`Failed to ${type} comment:`, error);
    }
  };

  const handleReplySubmitted = () => {
    fetchComments();
    setReplyingTo(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="mb-4">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-2 mb-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return <p className="text-muted-foreground">まだコメントはありません。最初のコメントを投稿してみましょう！</p>;
  }

  // スコア（いいね数 + 返信数*2）を計算する関数
  const calculateScore = (comment: Comment) => {
    return comment.likeCount + comment.replies.length * 2;
  };

  // コメントコンポーネント
  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
    <Card className={`mb-4 ${isReply ? "ml-8" : ""}`}>
      <CardContent className="pt-4">
        <div className="flex items-start space-x-2 mb-2">
          {comment.author.image ? (
            <img
              src={comment.author.image}
              alt={comment.author.name || "User"}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs">{comment.author.name?.charAt(0) || "U"}</span>
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium">{comment.author.name || "匿名ユーザー"}</p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ja,
                })}
              </span>
              {!isReply && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  スコア: {calculateScore(comment)}
                </span>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap">{comment.content}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote(comment.id, "like")}
            disabled={!session}
            className="text-muted-foreground hover:text-primary"
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            <span>{comment.likeCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote(comment.id, "bad")}
            disabled={!session}
            className="text-muted-foreground hover:text-destructive"
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            <span>{comment.badCount}</span>
          </Button>
        </div>

        {!isReply && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            {replyingTo === comment.id ? (
              "キャンセル"
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>返信</span>
              </>
            )}
          </Button>
        )}
      </CardFooter>

      {replyingTo === comment.id && (
        <div className="px-4 pb-4">
          <CommentForm 
            threadId={threadId} 
            parentId={comment.id} 
            onSubmitted={handleReplySubmitted} 
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <CornerDownRight className="h-3 w-3 mr-1" />
            <span>{comment.replies.length} 件の返信</span>
          </div>
          <div className="space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}