import type { CampusContext } from "@/lib/campus/context";
import type { Business, CampusEvent, DailyCheckin } from "@/types/database";
import type { AIRecommendation, RecommendationFeedback } from "@/types/database";
import { getLlmConfig, isLlmEnabled, LlmError } from "@/lib/ai/llm";
import {
  WEEKLY_DEVELOPER_PROMPT,
  WEEKLY_PROMPT_VERSION,
  WEEKLY_SYSTEM_PROMPT,
} from "@/lib/ai/weekly-prompts";
import { BUSINESS_GOAL_LABELS } from "@/lib/health";

export interface WeeklyBriefOutput {
  summary: string;
  campusInsight: string;
  businessInsight: string;
  aiLearned: string;
  focusNextWeek: string;
  source: "ai" | "rule_based";
  promptVersion: string;
}

export interface WeeklyBriefInput {
  week_label: string;
  business: {
    name: string;
    campus_name: string;
    goal_label: string;
  };
  campus: {
    headline_zh: string;
    campus_moment: string | null;
    traffic_forecast: string;
    events_this_week: Array<{ title: string; event_type: string }>;
    events_next_week: Array<{ title: string; starts_on: string }>;
  };
  stats: {
    revenue_this_week: number;
    revenue_prior_week: number;
    revenue_change_pct: number | null;
    customers_this_week: number;
    customers_prior_week: number;
    customer_change_pct: number | null;
    best_weekday: string | null;
    worst_weekday: string | null;
    checkin_days_this_week: number;
  };
  recommendations: {
    count_this_week: number;
    executed_count: number;
    helpful_count: number;
    top_action_types: string[];
    low_acceptance_action_types: string[];
  };
}

const WEEKDAY_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;

const ACTION_ZH: Record<string, string> = {
  extend_hours: "营业时间优化",
  adjust_staffing: "人手调整",
  prepare_inventory: "备料准备",
  reduce_inventory: "减少备料",
  run_promotion: "套餐推广",
  capture_traffic: "抓校园客流",
  improve_service: "服务优化",
  reduce_costs: "成本控制",
  highlight_signature_product: "招牌推广",
  adjust_menu: "菜单调整",
  optimize_queue: "排队优化",
  push_takeaway: "外带推广",
  increase_display: "门口展示",
  other: "经营调整",
};

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

function weekdayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return WEEKDAY_ZH[day] ?? dateStr;
}

function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return current > 0 ? 100 : null;
  return Math.round(((current - prior) / prior) * 100);
}

function sumField(checkins: DailyCheckin[], field: "revenue" | "customer_count"): number {
  return checkins.reduce((sum, c) => sum + Number(c[field]), 0);
}

function filterEventsNextWeek(
  events: CampusEvent[],
  todayStr: string
): CampusEvent[] {
  const weekEnd = addDays(todayStr, 7);
  return events.filter(
    (e) => e.starts_on > todayStr && e.starts_on <= weekEnd
  );
}

function filterEventsThisWeek(
  events: CampusEvent[],
  weekStart: string,
  todayStr: string
): CampusEvent[] {
  return events.filter((e) => {
    const end = e.ends_on ?? e.starts_on;
    return e.starts_on <= todayStr && end >= weekStart;
  });
}

function findBestWorstWeekday(
  checkins: DailyCheckin[]
): { best: string | null; worst: string | null } {
  if (checkins.length === 0) return { best: null, worst: null };
  const sorted = [...checkins].sort(
    (a, b) => Number(b.revenue) - Number(a.revenue)
  );
  return {
    best: weekdayLabel(sorted[0].checkin_date),
    worst: weekdayLabel(sorted[sorted.length - 1].checkin_date),
  };
}

export function buildWeeklyBriefInput(input: {
  business: Business;
  todayStr: string;
  campusContext: CampusContext;
  campusEvents: CampusEvent[];
  checkins: DailyCheckin[];
  recommendations: AIRecommendation[];
  feedbackByRecommendationId: Map<string, RecommendationFeedback>;
}): WeeklyBriefInput {
  const weekStart = addDays(input.todayStr, -6);
  const priorStart = addDays(input.todayStr, -13);
  const priorEnd = addDays(input.todayStr, -7);

  const thisWeekCheckins = input.checkins.filter(
    (c) => c.checkin_date >= weekStart && c.checkin_date <= input.todayStr
  );
  const priorWeekCheckins = input.checkins.filter(
    (c) => c.checkin_date >= priorStart && c.checkin_date <= priorEnd
  );

  const revThis = sumField(thisWeekCheckins, "revenue");
  const revPrior = sumField(priorWeekCheckins, "revenue");
  const custThis = sumField(thisWeekCheckins, "customer_count");
  const custPrior = sumField(priorWeekCheckins, "customer_count");

  const { best, worst } = findBestWorstWeekday(thisWeekCheckins);

  const recsThisWeek = input.recommendations.filter(
    (r) => r.recommendation_date >= weekStart && r.recommendation_date <= input.todayStr
  );

  let executedCount = 0;
  let helpfulCount = 0;
  const actionExecuted = new Map<string, number>();
  const actionIgnored = new Map<string, number>();

  for (const rec of recsThisWeek) {
    const fb = input.feedbackByRecommendationId.get(rec.id);
    if (!fb) continue;
    if (fb.executed) {
      executedCount += 1;
      actionExecuted.set(
        rec.action_type,
        (actionExecuted.get(rec.action_type) ?? 0) + 1
      );
      if (fb.helpfulness === "good") helpfulCount += 1;
    } else {
      actionIgnored.set(
        rec.action_type,
        (actionIgnored.get(rec.action_type) ?? 0) + 1
      );
    }
  }

  const topActionTypes = [...actionExecuted.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => ACTION_ZH[t] ?? t);

  const lowAcceptance = [...actionIgnored.entries()]
    .filter(([, count]) => count >= 1)
    .map(([t]) => ACTION_ZH[t] ?? t);

  const eventsThisWeek = filterEventsThisWeek(
    input.campusEvents,
    weekStart,
    input.todayStr
  );
  const eventsNextWeek = filterEventsNextWeek(input.campusEvents, input.todayStr);

  return {
    week_label: `${weekStart} — ${input.todayStr}`,
    business: {
      name: input.business.name,
      campus_name: input.business.campus_name,
      goal_label: BUSINESS_GOAL_LABELS[input.business.business_goal],
    },
    campus: {
      headline_zh: input.campusContext.headlineZh,
      campus_moment: input.campusContext.campusMoment,
      traffic_forecast: input.campusContext.trafficForecast,
      events_this_week: eventsThisWeek.map((e) => ({
        title: e.title,
        event_type: e.event_type,
      })),
      events_next_week: eventsNextWeek.map((e) => ({
        title: e.title,
        starts_on: e.starts_on,
      })),
    },
    stats: {
      revenue_this_week: revThis,
      revenue_prior_week: revPrior,
      revenue_change_pct: pctChange(revThis, revPrior),
      customers_this_week: custThis,
      customers_prior_week: custPrior,
      customer_change_pct: pctChange(custThis, custPrior),
      best_weekday: best,
      worst_weekday: worst,
      checkin_days_this_week: thisWeekCheckins.length,
    },
    recommendations: {
      count_this_week: recsThisWeek.length,
      executed_count: executedCount,
      helpful_count: helpfulCount,
      top_action_types: topActionTypes,
      low_acceptance_action_types: lowAcceptance,
    },
  };
}

function buildRuleBasedBrief(data: WeeklyBriefInput): WeeklyBriefOutput {
  const parts: string[] = [];

  if (data.stats.revenue_change_pct !== null) {
    const dir = data.stats.revenue_change_pct >= 0 ? "增长" : "下降";
    parts.push(
      `本周营业额较上周${dir}${Math.abs(data.stats.revenue_change_pct)}%。`
    );
  } else if (data.stats.checkin_days_this_week > 0) {
    parts.push(`本周共记录 ${data.stats.checkin_days_this_week} 天经营数据。`);
  }

  if (data.campus.campus_moment) {
    parts.push(`${data.campus.campus_moment}影响了本周校园节奏。`);
  } else if (data.campus.events_this_week.length > 0) {
    parts.push(`本周有${data.campus.events_this_week[0].title}等校园活动。`);
  }

  if (data.recommendations.executed_count > 0) {
    parts.push(`你执行了 ${data.recommendations.executed_count} 条经营建议。`);
  }

  const summary =
    parts.length > 0 ? parts.join("") : "本周数据仍在积累，CampusFin 会持续跟踪。";

  let campusInsight = data.campus.headline_zh.replace(/[。.!]$/, "") + "。";
  if (data.campus.events_next_week.length > 0) {
    const next = data.campus.events_next_week[0];
    campusInsight += `${next.title}将在下周开始，关注客流变化。`;
  } else if (data.campus.campus_moment?.includes("考试")) {
    campusInsight += "考试周结束后，预计客流逐步恢复正常。";
  }

  const bizParts: string[] = [];
  if (data.stats.customer_change_pct !== null) {
    const dir = data.stats.customer_change_pct >= 0 ? "增加" : "减少";
    bizParts.push(`本周客流较上周${dir}${Math.abs(data.stats.customer_change_pct)}%。`);
  }
  if (data.stats.best_weekday) {
    bizParts.push(`表现最好的是${data.stats.best_weekday}。`);
  }
  if (data.stats.worst_weekday && data.stats.worst_weekday !== data.stats.best_weekday) {
    bizParts.push(`相对偏弱的是${data.stats.worst_weekday}。`);
  }
  const businessInsight =
    bizParts.length > 0 ? bizParts.join("") : "继续每日打卡，趋势会更清晰。";

  let aiLearned = "CampusFin 仍在了解你的经营偏好。";
  if (data.recommendations.top_action_types.length > 0) {
    aiLearned = `CampusFin发现：你更愿意执行${data.recommendations.top_action_types.join("、")}类建议。`;
  }
  if (data.recommendations.low_acceptance_action_types.length > 0) {
    aiLearned += `${data.recommendations.low_acceptance_action_types.join("、")}建议执行率较低。`;
  }

  let focusNextWeek = `下周重点：围绕「${data.business.goal_label}」持续优化日常经营。`;
  if (data.campus.events_next_week.length > 0) {
    const ev = data.campus.events_next_week[0];
    focusNextWeek = `下周重点：关注${ev.title}期间客流变化，提前调整营业与备料。`;
  } else if (data.campus.campus_moment) {
    focusNextWeek = `下周重点：继续跟进${data.campus.campus_moment}后的客流恢复节奏。`;
  }

  return {
    summary,
    campusInsight,
    businessInsight,
    aiLearned,
    focusNextWeek,
    source: "rule_based",
    promptVersion: WEEKLY_PROMPT_VERSION,
  };
}

async function generateWeeklyBriefFromLlm(
  data: WeeklyBriefInput
): Promise<WeeklyBriefOutput> {
  const config = getLlmConfig();
  if (!config) {
    throw new LlmError("LLM not configured.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };
  if (config.baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
    headers["X-Title"] = "CampusFin Weekly Brief";
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: WEEKLY_SYSTEM_PROMPT },
        { role: "developer", content: WEEKLY_DEVELOPER_PROMPT },
        { role: "user", content: JSON.stringify(data) },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new LlmError(`Weekly brief LLM error ${response.status}: ${body.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new LlmError("Empty weekly brief response.");

  const parsed = JSON.parse(raw.trim()) as Record<string, unknown>;

  const pick = (key: string, fallback: string) => {
    const v = parsed[key];
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  };

  const fallback = buildRuleBasedBrief(data);

  return {
    summary: pick("summary", fallback.summary),
    campusInsight: pick("campus_insight", fallback.campusInsight),
    businessInsight: pick("business_insight", fallback.businessInsight),
    aiLearned: pick("ai_learned", fallback.aiLearned),
    focusNextWeek: pick("focus_next_week", fallback.focusNextWeek),
    source: "ai",
    promptVersion: WEEKLY_PROMPT_VERSION,
  };
}

export async function generateWeeklyBrief(input: {
  business: Business;
  todayStr: string;
  campusContext: CampusContext;
  campusEvents: CampusEvent[];
  checkins: DailyCheckin[];
  recommendations: AIRecommendation[];
  feedbackByRecommendationId: Map<string, RecommendationFeedback>;
}): Promise<WeeklyBriefOutput | null> {
  const data = buildWeeklyBriefInput(input);

  if (data.stats.checkin_days_this_week < 2) {
    return null;
  }

  if (isLlmEnabled()) {
    try {
      return await generateWeeklyBriefFromLlm(data);
    } catch (error) {
      console.error("[CampusFin Weekly Brief] LLM fallback:", error);
    }
  }

  return buildRuleBasedBrief(data);
}
