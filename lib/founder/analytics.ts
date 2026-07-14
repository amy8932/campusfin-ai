import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ActionType,
  AIRecommendation,
  ConfidenceLevel,
  RecommendationFeedback,
} from "@/types/database";

export interface FounderAnalytics {
  overview: {
    totalRecommendations: number;
    acceptanceRate: number | null;
    averageConfidence: number;
    fallbackRate: number;
    averageLlmMs: number | null;
  };
  actionDistribution: Array<{ actionType: ActionType; label: string; count: number; pct: number }>;
  feedbackDistribution: {
    helpful: number;
    neutral: number;
    notHelpful: number;
    notExecuted: number;
    total: number;
  };
  learning: {
    totalBusinesses: number;
    businessesWithFeedback: number;
    avgRecommendationsPerBusiness: number;
    avgRepeatCount: number;
    learningCoveragePct: number;
  };
  campusInsights: {
    mostInfluentialMoment: string | null;
    highestRevenueEvent: string | null;
    mostFrequentEvent: string | null;
  };
  aiPerformance: {
    llmSuccessRate: number | null;
    validatorPassRate: number | null;
    fallbackCount: number;
    avgRetryCount: number;
    promptVersions: Array<{ version: string; count: number; pct: number }>;
  };
  businessOutcomes: {
    mostAccepted: { actionType: ActionType; label: string; rate: number } | null;
    leastAccepted: { actionType: ActionType; label: string; rate: number } | null;
    mostIgnored: { actionType: ActionType; label: string; count: number } | null;
    highestConfidence: { actionType: ActionType; label: string; score: number } | null;
  };
  timeline: Array<{ weekday: string; count: number }>;
  scopeNote: string;
}

const ACTION_LABELS: Record<ActionType, string> = {
  extend_hours: "Extend Hours",
  adjust_staffing: "Adjust Staffing",
  prepare_inventory: "Prepare Inventory",
  reduce_inventory: "Reduce Inventory",
  run_promotion: "Run Promotion",
  capture_traffic: "Capture Traffic",
  improve_service: "Improve Service",
  reduce_costs: "Reduce Costs",
  highlight_signature_product: "Highlight Signature",
  adjust_menu: "Adjust Menu",
  optimize_queue: "Optimize Queue",
  push_takeaway: "Push Takeaway",
  increase_display: "Increase Display",
  other: "Other",
};

const CONFIDENCE_SCORE: Record<ConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function extractSnapshotField(
  rec: AIRecommendation,
  ...keys: string[]
): unknown {
  const snap = rec.input_snapshot;
  if (!isRecord(snap)) return undefined;
  let cur: unknown = snap;
  for (const key of keys) {
    if (!isRecord(cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}

function computeRepeatCountForBusiness(recs: AIRecommendation[]): number {
  const sorted = [...recs].sort((a, b) =>
    a.recommendation_date.localeCompare(b.recommendation_date)
  );
  if (sorted.length === 0) return 0;
  let maxRepeat = 1;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].action_type === sorted[i - 1].action_type) {
      streak += 1;
      maxRepeat = Math.max(maxRepeat, streak);
    } else {
      streak = 1;
    }
  }
  return maxRepeat;
}

function pct(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export async function loadFounderAnalytics(
  client: SupabaseClient
): Promise<FounderAnalytics> {
  const [
    { data: recommendations, error: recError },
    { data: feedbackRows, error: fbError },
    { data: businesses, error: bizError },
  ] = await Promise.all([
    client.from("ai_recommendations").select("*"),
    client.from("recommendation_feedback").select("*"),
    client.from("businesses").select("id"),
  ]);

  if (recError) throw new Error(recError.message);
  if (fbError) throw new Error(fbError.message);
  if (bizError) throw new Error(bizError.message);

  const recs = (recommendations ?? []) as AIRecommendation[];
  const feedback = (feedbackRows ?? []) as RecommendationFeedback[];
  const businessIds = (businesses ?? []).map((b) => b.id as string);

  const feedbackByRecId = new Map(feedback.map((f) => [f.recommendation_id, f]));
  const totalRecs = recs.length;
  const fallbackCount = recs.filter((r) => r.source === "rule_based").length;
  const aiCount = recs.filter((r) => r.source === "ai").length;

  const withFeedback = recs.filter((r) => feedbackByRecId.has(r.id));
  const executedCount = withFeedback.filter(
    (r) => feedbackByRecId.get(r.id)?.executed
  ).length;
  const acceptanceRate =
    withFeedback.length > 0 ? pct(executedCount, withFeedback.length) : null;

  const avgConfidence =
    totalRecs > 0
      ? recs.reduce((s, r) => s + CONFIDENCE_SCORE[r.confidence_level], 0) /
        totalRecs
      : 0;

  const llmDurations = recs
    .map((r) => extractSnapshotField(r, "llm_duration_ms"))
    .filter((v): v is number => typeof v === "number");
  const averageLlmMs =
    llmDurations.length > 0
      ? Math.round(
          llmDurations.reduce((a, b) => a + b, 0) / llmDurations.length
        )
      : null;

  const actionCounts = new Map<ActionType, number>();
  for (const rec of recs) {
    actionCounts.set(rec.action_type, (actionCounts.get(rec.action_type) ?? 0) + 1);
  }
  const actionDistribution = [...actionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([actionType, count]) => ({
      actionType,
      label: ACTION_LABELS[actionType] ?? actionType,
      count,
      pct: pct(count, totalRecs),
    }));

  let helpful = 0;
  let neutral = 0;
  let notHelpful = 0;
  let notExecuted = 0;
  for (const fb of feedback) {
    if (!fb.executed) {
      notExecuted += 1;
    } else if (fb.helpfulness === "good") {
      helpful += 1;
    } else if (fb.helpfulness === "neutral") {
      neutral += 1;
    } else if (fb.helpfulness === "bad") {
      notHelpful += 1;
    }
  }

  const businessesWithFeedback = new Set(feedback.map((f) => f.business_id)).size;
  const totalBusinesses = businessIds.length || new Set(recs.map((r) => r.business_id)).size;

  const recsByBusiness = new Map<string, AIRecommendation[]>();
  for (const rec of recs) {
    const list = recsByBusiness.get(rec.business_id) ?? [];
    list.push(rec);
    recsByBusiness.set(rec.business_id, list);
  }

  const repeatCounts = [...recsByBusiness.values()].map(computeRepeatCountForBusiness);
  const avgRepeatCount =
    repeatCounts.length > 0
      ? Math.round(
          (repeatCounts.reduce((a, b) => a + b, 0) / repeatCounts.length) * 10
        ) / 10
      : 0;

  const momentCounts = new Map<string, number>();
  const eventCounts = new Map<string, number>();
  const eventRevenueScores = new Map<string, { sum: number; n: number }>();

  for (const rec of recs) {
    const moment = extractSnapshotField(
      rec,
      "prompt_input",
      "campus_context",
      "campus_moment_label"
    );
    if (typeof moment === "string" && moment) {
      momentCounts.set(moment, (momentCounts.get(moment) ?? 0) + 1);
    }

    const eventsToday = extractSnapshotField(
      rec,
      "prompt_input",
      "campus_context",
      "events_today"
    );
    if (Array.isArray(eventsToday)) {
      for (const ev of eventsToday) {
        if (isRecord(ev) && typeof ev.title === "string") {
          eventCounts.set(ev.title, (eventCounts.get(ev.title) ?? 0) + 1);
          const revChange = extractSnapshotField(
            rec,
            "prompt_input",
            "business_health",
            "revenue_change_pct_vs_last_week"
          );
          if (typeof revChange === "number" && revChange > 0) {
            const bucket = eventRevenueScores.get(ev.title) ?? { sum: 0, n: 0 };
            bucket.sum += revChange;
            bucket.n += 1;
            eventRevenueScores.set(ev.title, bucket);
          }
        }
      }
    }
  }

  const topEntry = (m: Map<string, number>) => {
    const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
  };

  let highestRevenueEvent: string | null = null;
  let bestAvg = -Infinity;
  for (const [title, { sum, n }] of eventRevenueScores.entries()) {
    const avg = sum / n;
    if (avg > bestAvg) {
      bestAvg = avg;
      highestRevenueEvent = title;
    }
  }

  const versionCounts = new Map<string, number>();
  let retrySum = 0;
  let retryN = 0;
  let validatorAttempts = 0;

  for (const rec of recs) {
    const version = extractSnapshotField(rec, "prompt_version");
    if (typeof version === "string") {
      versionCounts.set(version, (versionCounts.get(version) ?? 0) + 1);
    }
    const retry = extractSnapshotField(rec, "retry_count");
    if (typeof retry === "number") {
      retrySum += retry;
      retryN += 1;
    }
    if (rec.source === "ai" || extractSnapshotField(rec, "llm_attempted") === true) {
      validatorAttempts += 1;
    }
  }

  const promptVersions = [...versionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([version, count]) => ({
      version,
      count,
      pct: pct(count, totalRecs || 1),
    }));

  const actionAcceptance = new Map<
    ActionType,
    { executed: number; total: number; ignored: number; confSum: number; confN: number }
  >();

  for (const rec of recs) {
    const bucket = actionAcceptance.get(rec.action_type) ?? {
      executed: 0,
      total: 0,
      ignored: 0,
      confSum: 0,
      confN: 0,
    };
    bucket.confSum += CONFIDENCE_SCORE[rec.confidence_level];
    bucket.confN += 1;
    const fb = feedbackByRecId.get(rec.id);
    if (fb) {
      bucket.total += 1;
      if (fb.executed) bucket.executed += 1;
      else bucket.ignored += 1;
    }
    actionAcceptance.set(rec.action_type, bucket);
  }

  const acceptanceRates = [...actionAcceptance.entries()]
    .filter(([, b]) => b.total >= 2)
    .map(([actionType, b]) => ({
      actionType,
      label: ACTION_LABELS[actionType],
      rate: pct(b.executed, b.total),
      ignored: b.ignored,
      avgConf: b.confN > 0 ? b.confSum / b.confN : 0,
    }));

  acceptanceRates.sort((a, b) => b.rate - a.rate);

  const ignoredSorted = [...actionAcceptance.entries()]
    .filter(([, b]) => b.ignored > 0)
    .sort((a, b) => b[1].ignored - a[1].ignored);

  const confidenceSorted = [...actionAcceptance.entries()]
    .filter(([, b]) => b.confN >= 2)
    .sort(
      (a, b) =>
        b[1].confSum / b[1].confN - a[1].confSum / a[1].confN
    );

  const weekdayCounts = new Map<string, number>();
  for (const rec of recs) {
    const [y, m, d] = rec.recommendation_date.split("-").map(Number);
    const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const label = WEEKDAY_ORDER[(day + 6) % 7];
    weekdayCounts.set(label, (weekdayCounts.get(label) ?? 0) + 1);
  }

  const timeline = WEEKDAY_ORDER.map((weekday) => ({
    weekday,
    count: weekdayCounts.get(weekday) ?? 0,
  }));

  const scopeNote =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
      ? "Global scope (service role)"
      : "Scoped to your account (RLS) — set SUPABASE_SERVICE_ROLE_KEY for full analytics";

  return {
    overview: {
      totalRecommendations: totalRecs,
      acceptanceRate,
      averageConfidence: Math.round(avgConfidence * 10) / 10,
      fallbackRate: pct(fallbackCount, totalRecs || 1),
      averageLlmMs,
    },
    actionDistribution,
    feedbackDistribution: {
      helpful,
      neutral,
      notHelpful,
      notExecuted,
      total: feedback.length,
    },
    learning: {
      totalBusinesses,
      businessesWithFeedback,
      avgRecommendationsPerBusiness:
        totalBusinesses > 0
          ? Math.round((totalRecs / totalBusinesses) * 10) / 10
          : 0,
      avgRepeatCount,
      learningCoveragePct: pct(businessesWithFeedback, totalBusinesses || 1),
    },
    campusInsights: {
      mostInfluentialMoment: topEntry(momentCounts),
      highestRevenueEvent,
      mostFrequentEvent: topEntry(eventCounts),
    },
    aiPerformance: {
      llmSuccessRate: totalRecs > 0 ? pct(aiCount, totalRecs) : null,
      validatorPassRate:
        validatorAttempts > 0 ? pct(aiCount, validatorAttempts) : null,
      fallbackCount,
      avgRetryCount: retryN > 0 ? Math.round((retrySum / retryN) * 10) / 10 : 0,
      promptVersions,
    },
    businessOutcomes: {
      mostAccepted: acceptanceRates[0]
        ? {
            actionType: acceptanceRates[0].actionType,
            label: acceptanceRates[0].label,
            rate: acceptanceRates[0].rate,
          }
        : null,
      leastAccepted: acceptanceRates.at(-1)
        ? {
            actionType: acceptanceRates.at(-1)!.actionType,
            label: acceptanceRates.at(-1)!.label,
            rate: acceptanceRates.at(-1)!.rate,
          }
        : null,
      mostIgnored: ignoredSorted[0]
        ? {
            actionType: ignoredSorted[0][0],
            label: ACTION_LABELS[ignoredSorted[0][0]],
            count: ignoredSorted[0][1].ignored,
          }
        : null,
      highestConfidence: confidenceSorted[0]
        ? {
            actionType: confidenceSorted[0][0],
            label: ACTION_LABELS[confidenceSorted[0][0]],
            score:
              Math.round(
                (confidenceSorted[0][1].confSum / confidenceSorted[0][1].confN) *
                  10
              ) / 10,
          }
        : null,
    },
    timeline,
    scopeNote,
  };
}
