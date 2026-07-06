import { createClient } from "@/lib/supabase/server";
import type {
  ActionType,
  AIRecommendation,
  FeedbackHelpfulness,
  RecommendationFeedback,
} from "@/types/database";

export interface MemoryRecommendationEntry {
  title: string;
  action_type: ActionType;
  date: string;
  age_days: number;
  executed: boolean | null;
}

export interface MemoryFeedback {
  executed: boolean;
  helpfulness: FeedbackHelpfulness | null;
}

export interface RecommendationMemory {
  last_recommendation: MemoryRecommendationEntry | null;
  last_feedback: MemoryFeedback | null;
  last_7_days: MemoryRecommendationEntry[];
  repeat_count: number;
}

function daysBetween(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [ty, tm, td] = toDate.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

function toMemoryEntry(
  rec: AIRecommendation,
  todayStr: string,
  feedback: RecommendationFeedback | undefined
): MemoryRecommendationEntry {
  let executed: boolean | null = null;
  if (feedback) {
    executed = feedback.executed;
  } else if (rec.acknowledged_at) {
    executed = true;
  }

  return {
    title: rec.recommendation_title,
    action_type: rec.action_type,
    date: rec.recommendation_date,
    age_days: daysBetween(rec.recommendation_date, todayStr),
    executed,
  };
}

function toMemoryFeedback(
  feedback: RecommendationFeedback | undefined
): MemoryFeedback | null {
  if (!feedback) return null;
  return {
    executed: feedback.executed,
    helpfulness: feedback.helpfulness,
  };
}

function computeRepeatCount(entries: MemoryRecommendationEntry[]): number {
  if (entries.length === 0) return 0;
  const latestType = entries[0].action_type;
  return entries.filter((e) => e.action_type === latestType).length;
}

export function emptyRecommendationMemory(): RecommendationMemory {
  return {
    last_recommendation: null,
    last_feedback: null,
    last_7_days: [],
    repeat_count: 0,
  };
}

export function buildRecommendationMemory(
  recommendations: AIRecommendation[],
  feedbackByRecommendationId: Map<string, RecommendationFeedback>,
  todayStr: string
): RecommendationMemory {
  const prior = recommendations
    .filter((r) => r.recommendation_date < todayStr)
    .sort((a, b) => b.recommendation_date.localeCompare(a.recommendation_date))
    .slice(0, 7);

  const last7Days = prior.map((r) =>
    toMemoryEntry(r, todayStr, feedbackByRecommendationId.get(r.id))
  );

  const latestRec = prior[0];
  const latestFeedback = latestRec
    ? feedbackByRecommendationId.get(latestRec.id)
    : undefined;

  return {
    last_recommendation: last7Days[0] ?? null,
    last_feedback: toMemoryFeedback(latestFeedback),
    last_7_days: last7Days,
    repeat_count: computeRepeatCount(last7Days),
  };
}

/** Load recent recommendations + feedback for PromptInput — excludes today. */
export async function loadRecommendationMemory(
  businessId: string,
  todayStr: string
): Promise<RecommendationMemory> {
  const supabase = await createClient();

  const { data: recommendations, error: recError } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("business_id", businessId)
    .lt("recommendation_date", todayStr)
    .order("recommendation_date", { ascending: false })
    .limit(7);

  if (recError) {
    console.error("[CampusFin AI Memory] Failed to load recommendations:", recError.message);
    return emptyRecommendationMemory();
  }

  const recs = (recommendations ?? []) as AIRecommendation[];
  if (recs.length === 0) {
    return emptyRecommendationMemory();
  }

  const recIds = recs.map((r) => r.id);
  const { data: feedbackRows, error: fbError } = await supabase
    .from("recommendation_feedback")
    .select("*")
    .in("recommendation_id", recIds);

  if (fbError) {
    console.error("[CampusFin AI Memory] Failed to load feedback:", fbError.message);
  }

  const feedbackMap = new Map<string, RecommendationFeedback>();
  for (const row of (feedbackRows ?? []) as RecommendationFeedback[]) {
    feedbackMap.set(row.recommendation_id, row);
  }

  return buildRecommendationMemory(recs, feedbackMap, todayStr);
}
