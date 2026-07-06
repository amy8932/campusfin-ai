"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateTodayRecommendation } from "@/lib/ai/adapter";
import { getBusinessDateString } from "@/lib/timezone";
import type {
  Business,
  BusinessGoal,
  BusinessType,
  CampusEvent,
  DailyCheckin,
} from "@/types/database";

export interface CheckinFormState {
  error?: string;
}

export async function submitDailyCheckin(
  _prev: CheckinFormState,
  formData: FormData
): Promise<CheckinFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to continue." };
  }

  const { data: businessData } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  const business = businessData as Business | null;

  if (!business) {
    return { error: "Please set up your business first." };
  }

  const revenueRaw = formData.get("revenue");
  const customerCountRaw = formData.get("customer_count");
  const note = (formData.get("note") as string)?.trim() || null;
  const checkinDate =
    (formData.get("checkin_date") as string) ||
    getBusinessDateString(business.business_timezone);

  const revenue = Number(revenueRaw);
  const customer_count = Number(customerCountRaw);

  if (!Number.isFinite(revenue) || revenue < 0) {
    return { error: "Please enter a valid revenue amount." };
  }
  if (!Number.isInteger(customer_count) || customer_count < 0) {
    return { error: "Please enter a valid customer count." };
  }
  if (note && note.length > 140) {
    return { error: "Note must be 140 characters or less." };
  }

  const { data: checkinData, error: checkinError } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        business_id: business.id,
        checkin_date: checkinDate,
        revenue,
        customer_count,
        note,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id,checkin_date" }
    )
    .select()
    .single();

  const checkin = checkinData as DailyCheckin | null;

  if (checkinError || !checkin) {
    return { error: checkinError?.message ?? "Failed to save check-in." };
  }

  const [{ data: events }, { data: recentCheckins }] = await Promise.all([
    supabase
      .from("campus_events")
      .select("*")
      .eq("campus_name", business.campus_name),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("business_id", business.id)
      .order("checkin_date", { ascending: false })
      .limit(7),
  ]);

  await generateTodayRecommendation({
    business,
    todayCheckin: checkin,
    todayStr: checkinDate,
    campusEvents: (events ?? []) as CampusEvent[],
    recentCheckins: (recentCheckins ?? []) as DailyCheckin[],
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/record");
  redirect("/dashboard");
}

export async function acknowledgeRecommendation(recommendationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) return;

  await supabase
    .from("ai_recommendations")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", recommendationId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard");
}

export async function createBusiness(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const campus_name = (formData.get("campus_name") as string)?.trim();
  const business_type = formData.get("business_type") as BusinessType;
  const business_goal = formData.get("business_goal") as BusinessGoal;

  if (!name || !campus_name) {
    return { error: "Business name and campus are required." };
  }

  const { error } = await supabase.from("businesses").insert({
    owner_id: user.id,
    name,
    campus_name,
    business_type: business_type || "other",
    business_goal: business_goal || "increase_revenue",
    business_timezone: "Asia/Shanghai",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
