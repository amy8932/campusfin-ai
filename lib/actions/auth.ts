"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSupabaseEnv } from "@/lib/env";

export type AuthFormState = {
  error?: string;
  success?: string;
};

function getSupabaseConfigError(): string | null {
  try {
    requireSupabaseEnv();
    return null;
  } catch {
    return "Supabase 未配置。请在 .env.local 中设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。";
  }
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const fullName = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "请填写邮箱和密码。" };
  }

  if (password.length < 6) {
    return { error: "密码至少需要 6 位。" };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null },
      emailRedirectTo: `${siteUrl}/setup`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user && !data.session) {
    return {
      success:
        "注册成功。请查收确认邮件并点击链接，然后登录。若已关闭邮件确认，请直接登录。",
    };
  }

  redirect("/setup");
}

export async function login(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "请填写邮箱和密码。" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "登录失败，请重试。" };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", data.user.id)
    .limit(1)
    .maybeSingle();

  redirect(business ? "/dashboard" : "/setup");
}
