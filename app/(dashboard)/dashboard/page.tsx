import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerBusiness } from "@/lib/business";
import { buildCampusContext } from "@/lib/campus/context";
import { getBusinessDateString } from "@/lib/timezone";
import { BusinessHeader } from "@/components/dashboard/business-header";
import { CampusZone } from "@/components/dashboard/campus-zone";
import { HealthZone } from "@/components/dashboard/health-zone";
import { LearningCard } from "@/components/dashboard/learning-card";
import { PriorityZone } from "@/components/dashboard/priority-zone";
import { TrendZone } from "@/components/dashboard/trend-zone";
import { WeeklyBriefCard } from "@/components/dashboard/weekly-brief-card";
import { buildLearningCard } from "@/lib/ai/learning";
import { generateWeeklyBrief } from "@/lib/ai/weekly-brief";
import type {
  AIRecommendation,
  CampusEvent,
  DailyCheckin,
  RecommendationFeedback,
} from "@/types/database";

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
    { data: briefCheckins },
    { data: recommendation },
    { data: historyRecommendations },
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
      .from("daily_checkins")
      .select("*")
      .eq("business_id", business.id)
      .order("checkin_date", { ascending: false })
      .limit(14),
    supabase
      .from("ai_recommendations")
      .select("*")
      .eq("business_id", business.id)
      .eq("recommendation_date", todayStr)
      .maybeSingle(),
    supabase
      .from("ai_recommendations")
      .select("*")
      .eq("business_id", business.id)
      .order("recommendation_date", { ascending: false }),
  ]);

  const campusEvents = (events ?? []) as CampusEvent[];
  const campusContext = buildCampusContext(
    campusEvents,
    business.campus_name,
    todayStr
  );

  const checkins = (recentCheckins ?? []) as DailyCheckin[];
  const briefCheckinsList = (briefCheckins ?? []) as DailyCheckin[];
  const today = todayCheckin as DailyCheckin | null;
  const rec = recommendation as AIRecommendation | null;

  const historyRecs = (historyRecommendations ?? []) as AIRecommendation[];

  let feedbackSubmitted = false;
  let learningCardData = null;

  const feedbackMap = new Map<string, RecommendationFeedback>();
  if (historyRecs.length > 0) {
    const recIds = historyRecs.map((r) => r.id);
    const { data: feedbackRows } = await supabase
      .from("recommendation_feedback")
      .select("*")
      .in("recommendation_id", recIds);

    for (const row of (feedbackRows ?? []) as RecommendationFeedback[]) {
      feedbackMap.set(row.recommendation_id, row);
    }
  }

  if (today) {
    learningCardData = buildLearningCard({
      recommendations: historyRecs,
      feedbackByRecommendationId: feedbackMap,
      todayStr,
    });
  }

  if (rec) {
    const { data: feedback } = await supabase
      .from("recommendation_feedback")
      .select("id")
      .eq("recommendation_id", rec.id)
      .maybeSingle();
    feedbackSubmitted = !!feedback;
  }

  const weeklyBrief = await generateWeeklyBrief({
    business,
    todayStr,
    campusContext,
    campusEvents,
    checkins: briefCheckinsList,
    recommendations: historyRecs,
    feedbackByRecommendationId: feedbackMap,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BusinessHeader
        business={business}
        todayStr={todayStr}
        recentCheckins={checkins}
      />

      <CampusZone context={campusContext} todayStr={todayStr} />
      <HealthZone
        todayCheckin={today}
        recentCheckins={checkins}
        todayStr={todayStr}
      />
      <PriorityZone
        todayCheckin={!!today}
        recommendation={rec}
        feedbackSubmitted={feedbackSubmitted}
      />
      <LearningCard data={learningCardData} visible={!!today} />
      <TrendZone recentCheckins={checkins} />
      <WeeklyBriefCard brief={weeklyBrief} />

      {today && (
        <p className="pb-2 text-center text-[13px] text-gray-500">
          <Link href="/dashboard/record" className="underline underline-offset-4">
            修改今日打卡 · Edit today&apos;s check-in
          </Link>
        </p>
      )}
    </div>
  );
}
