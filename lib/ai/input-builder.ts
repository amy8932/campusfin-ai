import type { CampusContext } from "@/lib/campus/context";
import type { RecommendationMemory } from "@/lib/ai/memory";
import { emptyRecommendationMemory } from "@/lib/ai/memory";
import {
  average,
  BUSINESS_GOAL_LABELS,
  computeHealthLabel,
} from "@/lib/health";
import type {
  Business,
  BusinessGoal,
  DailyCheckin,
  TrafficImpact,
} from "@/types/database";

export interface PromptCampusEvent {
  title: string;
  event_type: string;
  traffic_impact: TrafficImpact;
}

export interface PromptUpcomingEvent extends PromptCampusEvent {
  starts_on: string;
}

export interface PromptInput {
  campus_context: {
    campus_name: string;
    campus_moment: string | null;
    campus_moment_label: string | null;
    events_today: PromptCampusEvent[];
    events_upcoming_7d: PromptUpcomingEvent[];
    traffic_forecast: TrafficImpact;
    weather_signal: string | null;
    campus_headline: string;
  };
  business_health: {
    health_label: string;
    revenue_today: number;
    revenue_change_pct_vs_last_week: number | null;
    customer_count_today: number;
    customer_change_pct_vs_7d_avg: number | null;
    cash_flow_signal: "healthy" | "tight" | "unknown";
    days_since_last_checkin: number;
  };
  business_goal: {
    goal: BusinessGoal;
    goal_label: string;
  };
  daily_checkin: {
    checkin_date: string;
    revenue: number;
    customer_count: number;
    note: string | null;
  };
  recent_trend: {
    checkins_last_7d: Array<{
      date: string;
      revenue: number;
      customer_count: number;
    }>;
    revenue_7d_total: number;
    revenue_trend_direction: "up" | "down" | "flat";
    best_weekdays: string[];
    checkin_streak_days: number;
    missing_days_last_7: number;
  };
  recommendation_memory: RecommendationMemory;
}

const MOMENT_SLUGS: Record<string, string> = {
  考试周: "exam_week",
  论文季: "thesis_season",
  开学季: "back_to_school",
  毕业季: "graduation_season",
};

const WEEKDAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function campusMomentSlug(label: string | null): string | null {
  if (!label) return null;
  if (MOMENT_SLUGS[label]) return MOMENT_SLUGS[label];
  if (label.includes("考试")) return "exam_week";
  if (label.includes("论文")) return "thesis_season";
  return null;
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

function pctChange(current: number, baseline: number | null): number | null {
  if (baseline === null || baseline === 0) return null;
  return Math.round(((current - baseline) / baseline) * 1000) / 10;
}

function computeStreak(checkins: DailyCheckin[], todayStr: string): number {
  const dates = new Set(checkins.map((c) => c.checkin_date));
  let streak = 0;
  let cursor = todayStr;
  while (dates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function computeMissingDays(checkins: DailyCheckin[], todayStr: string): number {
  const dates = new Set(checkins.map((c) => c.checkin_date));
  let missing = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(todayStr, -i);
    if (!dates.has(d)) missing++;
  }
  return missing;
}

function computeBestWeekdays(
  checkins: DailyCheckin[]
): string[] {
  const byWeekday = new Map<string, number[]>();
  for (const c of checkins) {
    const [y, m, d] = c.checkin_date.split("-").map(Number);
    const wd = WEEKDAY_NAMES[new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay()];
    const list = byWeekday.get(wd) ?? [];
    list.push(c.revenue);
    byWeekday.set(wd, list);
  }
  const ranked = [...byWeekday.entries()]
    .map(([day, revenues]) => ({
      day,
      avg: average(revenues) ?? 0,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map((x) => x.day);
  return ranked;
}

function computeTrendDirection(
  checkins: DailyCheckin[]
): "up" | "down" | "flat" {
  if (checkins.length < 2) return "flat";
  const sorted = [...checkins].sort((a, b) =>
    a.checkin_date.localeCompare(b.checkin_date)
  );
  const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));
  const avgFirst = average(firstHalf.map((c) => c.revenue)) ?? 0;
  const avgSecond = average(secondHalf.map((c) => c.revenue)) ?? 0;
  if (avgSecond > avgFirst * 1.05) return "up";
  if (avgSecond < avgFirst * 0.95) return "down";
  return "flat";
}

function computeCashFlowSignal(
  healthLabel: string,
  trendDirection: "up" | "down" | "flat"
): "healthy" | "tight" | "unknown" {
  if (healthLabel === "needs_attention" || trendDirection === "down") {
    return "tight";
  }
  if (healthLabel === "strong_day" || trendDirection === "up") {
    return "healthy";
  }
  return "unknown";
}

export function buildPromptInput(input: {
  business: Business;
  campusContext: CampusContext;
  todayCheckin: DailyCheckin;
  recentCheckins: DailyCheckin[];
  todayStr: string;
  recommendationMemory?: RecommendationMemory;
}): PromptInput {
  const {
    business,
    campusContext,
    todayCheckin,
    recentCheckins,
    todayStr,
    recommendationMemory = emptyRecommendationMemory(),
  } = input;

  const sortedRecent = [...recentCheckins].sort((a, b) =>
    b.checkin_date.localeCompare(a.checkin_date)
  );
  const last7 = sortedRecent.slice(0, 7);
  const revenues7d = last7.map((c) => c.revenue);
  const customers7d = last7.map((c) => c.customer_count);
  const avgRevenue7d = average(revenues7d);
  const avgCustomers7d = average(customers7d);

  const lastWeekSameDay = recentCheckins.find(
    (c) => c.checkin_date === addDays(todayStr, -7)
  );

  const healthLabel = computeHealthLabel(
    todayCheckin.revenue,
    avgRevenue7d
  );
  const trendDirection = computeTrendDirection(last7);

  const weatherEvent = campusContext.eventsToday.find(
    (e) => e.event_type === "weather"
  );

  return {
    campus_context: {
      campus_name: business.campus_name,
      campus_moment: campusMomentSlug(campusContext.campusMoment),
      campus_moment_label: campusContext.campusMoment,
      events_today: campusContext.eventsToday.map((e) => ({
        title: e.title,
        event_type: e.event_type,
        traffic_impact: e.traffic_impact,
      })),
      events_upcoming_7d: campusContext.eventsUpcoming.map((e) => ({
        title: e.title,
        event_type: e.event_type,
        traffic_impact: e.traffic_impact,
        starts_on: e.starts_on,
      })),
      traffic_forecast: campusContext.trafficForecast,
      weather_signal: weatherEvent ? "rain" : null,
      campus_headline: campusContext.headlineZh,
    },
    business_health: {
      health_label: healthLabel,
      revenue_today: todayCheckin.revenue,
      revenue_change_pct_vs_last_week: pctChange(
        todayCheckin.revenue,
        lastWeekSameDay?.revenue ?? null
      ),
      customer_count_today: todayCheckin.customer_count,
      customer_change_pct_vs_7d_avg: pctChange(
        todayCheckin.customer_count,
        avgCustomers7d
      ),
      cash_flow_signal: computeCashFlowSignal(healthLabel, trendDirection),
      days_since_last_checkin: 0,
    },
    business_goal: {
      goal: business.business_goal,
      goal_label: BUSINESS_GOAL_LABELS[business.business_goal],
    },
    daily_checkin: {
      checkin_date: todayCheckin.checkin_date,
      revenue: todayCheckin.revenue,
      customer_count: todayCheckin.customer_count,
      note: todayCheckin.note,
    },
    recent_trend: {
      checkins_last_7d: [...last7]
        .sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))
        .map((c) => ({
          date: c.checkin_date,
          revenue: c.revenue,
          customer_count: c.customer_count,
        })),
      revenue_7d_total: revenues7d.reduce((a, b) => a + b, 0),
      revenue_trend_direction: trendDirection,
      best_weekdays: computeBestWeekdays(last7),
      checkin_streak_days: computeStreak(recentCheckins, todayStr),
      missing_days_last_7: computeMissingDays(recentCheckins, todayStr),
    },
    recommendation_memory: recommendationMemory,
  };
}
