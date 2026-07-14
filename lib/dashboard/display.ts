import type { DailyCheckin } from "@/types/database";

export function computeCheckinStreak(
  checkins: DailyCheckin[],
  todayStr: string
): number {
  const dates = new Set(checkins.map((c) => c.checkin_date));
  if (!dates.has(todayStr)) return 0;

  let streak = 0;
  let cursor = todayStr;

  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

export function formatDashboardDate(
  dateStr: string,
  timeZone: string
): { weekday: string; shortDate: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(dt);
  const shortDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(dt);
  void timeZone;
  return { weekday, shortDate };
}

export interface MetricComparison {
  value: string;
  delta: string | null;
  deltaPositive: boolean | null;
}

export function buildMetricComparison(
  today: number,
  previous: number | null,
  prefix: string,
  suffix = ""
): MetricComparison {
  const value = `${prefix}${today.toLocaleString("zh-CN")}${suffix}`;

  if (previous === null || previous === undefined) {
    return { value, delta: null, deltaPositive: null };
  }

  const diff = today - previous;
  if (diff === 0) {
    return { value, delta: "与上次持平", deltaPositive: null };
  }

  const sign = diff > 0 ? "+" : "";
  const deltaPositive = diff > 0;
  const delta =
    prefix === "¥"
      ? `${sign}${prefix}${Math.abs(diff).toLocaleString("zh-CN")} vs 上次`
      : `${sign}${diff} vs 上次`;

  return { value, delta, deltaPositive };
}

export function findPreviousCheckin(
  checkins: DailyCheckin[],
  todayStr: string
): DailyCheckin | null {
  const sorted = [...checkins].sort((a, b) =>
    b.checkin_date.localeCompare(a.checkin_date)
  );
  const todayIdx = sorted.findIndex((c) => c.checkin_date === todayStr);
  if (todayIdx >= 0 && sorted[todayIdx + 1]) {
    return sorted[todayIdx + 1];
  }
  if (todayIdx === -1 && sorted[0]?.checkin_date !== todayStr) {
    return sorted[0] ?? null;
  }
  return sorted[todayIdx + 1] ?? null;
}

export type HealthStatusLevel = "healthy" | "attention" | "critical";

export function resolveHealthStatus(
  healthLabel: string,
  revenueRatio: number | null
): HealthStatusLevel {
  if (healthLabel === "needs_attention") {
    if (revenueRatio !== null && revenueRatio < 0.7) return "critical";
    return "attention";
  }
  if (healthLabel === "strong_day" || healthLabel === "normal") {
    return "healthy";
  }
  return "attention";
}

export const HEALTH_STATUS_DISPLAY: Record<
  HealthStatusLevel,
  { zh: string; en: string; className: string }
> = {
  healthy: {
    zh: "经营良好",
    en: "Healthy",
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  attention: {
    zh: "需要关注",
    en: "Needs Attention",
    className: "text-amber-700 bg-amber-50 border-amber-200",
  },
  critical: {
    zh: "亟需改善",
    en: "Critical",
    className: "text-red-700 bg-red-50 border-red-200",
  },
};
