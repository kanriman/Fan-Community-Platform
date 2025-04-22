// src/app/auth/signin/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-3.5rem)]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-center">ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Googleでログイン
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}