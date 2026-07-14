import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireFounderAccess(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const raw = process.env.FOUNDER_EMAIL?.trim();
  if (!raw) {
    return;
  }

  const allowed = raw.split(",").map((e) => e.trim().toLowerCase());
  const email = user.email?.toLowerCase() ?? "";
  if (!allowed.includes(email)) {
    redirect("/dashboard");
  }
}
