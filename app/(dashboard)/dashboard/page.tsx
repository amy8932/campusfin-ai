import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerBusiness } from "@/lib/business";
import { buildCampusContext } from "@/lib/campus/context";
import { getBusinessDateString } from "@/lib/timezone";
import { CampusZone } from "@/components/dashboard/campus-zone";
import { HealthZone } from "@/components/dashboard/health-zone";
import { PriorityZone } from "@/components/dashboard/priority-zone";
import { TrendZone } from "@/components/dashboard/trend-zone";
import { BUSINESS_GOAL_LABELS } from "@/lib/health";
import type { AIRecommendation, CampusEvent, DailyCheckin } from "@/types/database";

export default async function DashboardPage() {
  const business = await getOwnerBusiness();

  if (!business) {
    redirect("/setup");
  }

  const supabase = await createClient();
  const todayStr = getBusinessDateString(business.business_timezone);

  const [
    { data: events },
    { data: todayCheckin },
    { data: recentCheckins },
    { data: recommendation },
  ] = await Promise.all([
    supabase
      .from("campus_events")
      .select("*")
      .eq("campus_name", business.campus_name),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("business_id", business.id)
      .eq("checkin_date", todayStr)
      .maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("business_id", business.id)
      .order("checkin_date", { ascending: false })
      .limit(7),
    supabase
      .from("ai_recommendations")
      .select("*")
      .eq("business_id", business.id)
      .eq("recommendation_date", todayStr)
      .maybeSingle(),
  ]);

  const campusEvents = (events ?? []) as CampusEvent[];
  const campusContext = buildCampusContext(
    campusEvents,
    business.campus_name,
    todayStr
  );

  const checkins = (recentCheckins ?? []) as DailyCheckin[];
  const today = todayCheckin as DailyCheckin | null;
  const rec = recommendation as AIRecommendation | null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {business.name} · {business.campus_name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Today / 今日</h1>
        <p className="text-sm text-muted-foreground">
          Goal / 经营目标：{BUSINESS_GOAL_LABELS[business.business_goal]}
        </p>
      </header>

      <CampusZone context={campusContext} campusName={business.campus_name} />
      <HealthZone todayCheckin={today} recentCheckins={checkins} />
      <PriorityZone todayCheckin={!!today} recommendation={rec} />
      <TrendZone recentCheckins={checkins} />

      {today && (
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/dashboard/record" className="underline underline-offset-4">
            Edit today&apos;s Daily Check-in / 修改今日打卡
          </Link>
        </p>
      )}
    </div>
  );
}
