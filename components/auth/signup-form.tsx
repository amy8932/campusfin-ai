"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">姓名</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="张三"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@university.edu"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-muted-foreground" role="status">
          {state.success}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "创建中…" : "创建账号"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        已有账号？{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          登录
        </Link>
      </p>
    </form>
  );
}
