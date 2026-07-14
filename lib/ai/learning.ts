import type { PromptInput } from "@/lib/ai/input-builder";
import { buildRecommendationMemory } from "@/lib/ai/memory";
import type {
  ActionType,
  AIRecommendation,
  FeedbackHelpfulness,
  RecommendationFeedback,
} from "@/types/database";

export interface LearningCardLatest {
  title: string | null;
}

export type LearningFeedbackKind = "none" | "executed" | "not_executed";

export interface LearningCardFeedback {
  kind: LearningFeedbackKind;
  helpfulness: FeedbackHelpfulness | null;
}

export interface LearningTimelineItem {
  dateLabel: string;
  actionLabel: string;
  date: string;
}

export interface LearningCardData {
  latest: LearningCardLatest;
  feedback: LearningCardFeedback;
  learnedText: string;
  timeline: LearningTimelineItem[];
  stats: {
    historyCount: number;
  };
}

const ACTION_TIMELINE_LABELS: Record<ActionType, string> = {
  extend_hours: "延长营业时间",
  adjust_staffing: "调整人手",
  prepare_inventory: "提前备料",
  reduce_inventory: "减少备货",
  run_promotion: "推广套餐",
  capture_traffic: "抓住校园客流",
  improve_service: "优化服务",
  reduce_costs: "控制成本",
  highlight_signature_product: "主推招牌饮品",
  adjust_menu: "调整菜单",
  optimize_queue: "优化排队",
  push_takeaway: "增加外卖",
  increase_display: "加强门口展示",
  other: "经营调整",
};

const ACTION_LEARNED_PHRASES: Record<ActionType, string> = {
  extend_hours: "延长营业时间类建议",
  adjust_staffing: "调整人手类建议",
  prepare_inventory: "提前备料类建议",
  reduce_inventory: "减少备货类建议",
  run_promotion: "促销推广类建议",
  capture_traffic: "抓校园客流类建议",
  improve_service: "优化服务类建议",
  reduce_costs: "控制成本类建议",
  highlight_signature_product: "主推招牌单品类建议",
  adjust_menu: "调整菜单类建议",
  optimize_queue: "优化排队类建议",
  push_takeaway: "主推外带类建议",
  increase_display: "门口展示类建议",
  other: "此类经营建议",
};

const LEARNING_START =
  "CampusFin 已开始了解你的经营方式。";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function daysBetween(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [ty, tm, td] = toDate.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

function extractCampusPhrase(
  snapshot: Record<string, unknown> | null | undefined
): string | null {
  if (!snapshot) return null;
  const raw = snapshot.prompt_input;
  if (!isRecord(raw)) return null;
  const input = raw as unknown as PromptInput;
  const moment = input.campus_context?.campus_moment_label;
  if (moment) return `${moment}期间`;
  const headline = input.campus_context?.campus_headline;
  if (headline) {
    const trimmed = headline.replace(/[。.!]$/, "");
    return trimmed.length <= 14 ? trimmed : `${trimmed.slice(0, 14)}…`;
  }
  return null;
}

function formatTimelineDateLabel(dateStr: string, todayStr: string): string {
  const ageDays = daysBetween(dateStr, todayStr);
  if (ageDays === 1) return "昨天";
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}月${d}日`;
}

function clampLearnedText(text: string): string {
  const chars = Array.from(text);
  if (chars.length <= 80) return text;
  return `${chars.slice(0, 79).join("")}…`;
}

function buildLearnedText(input: {
  memoryRepeatCount: number;
  lastActionType: ActionType | null;
  feedback: RecommendationFeedback | null;
  campusPhrase: string | null;
  hasAnyHistory: boolean;
}): string {
  const { memoryRepeatCount, lastActionType, feedback, campusPhrase, hasAnyHistory } =
    input;

  if (!hasAnyHistory) {
    return LEARNING_START;
  }

  if (!feedback) {
    return LEARNING_START;
  }

  const actionPhrase = lastActionType
    ? ACTION_LEARNED_PHRASES[lastActionType]
    : "此类经营建议";

  if (
    memoryRepeatCount >= 2 &&
    (!feedback.executed || feedback.helpfulness === "bad")
  ) {
    return clampLearnedText(
      "你较少采用这类建议，CampusFin 会减少类似推荐。"
    );
  }

  if (!feedback.executed) {
    return clampLearnedText(
      "你暂缓了上一条建议，CampusFin 会逐步调整方向。"
    );
  }

  if (feedback.helpfulness === "bad") {
    return clampLearnedText(
      "这类建议对你帮助不大，CampusFin 会减少类似推荐。"
    );
  }

  if (feedback.helpfulness === "good") {
    const campus = campusPhrase ? `${campusPhrase}，` : "";
    return clampLearnedText(`${campus}你更愿意执行${actionPhrase}。`);
  }

  if (feedback.helpfulness === "neutral") {
    return clampLearnedText(
      "你会执行这类建议，但感受一般，CampusFin 会继续了解你的偏好。"
    );
  }

  return LEARNING_START;
}

function toFeedbackDisplay(
  feedback: RecommendationFeedback | null
): LearningCardFeedback {
  if (!feedback) {
    return { kind: "none", helpfulness: null };
  }
  if (!feedback.executed) {
    return { kind: "not_executed", helpfulness: null };
  }
  return {
    kind: "executed",
    helpfulness: feedback.helpfulness,
  };
}

export function buildLearningCard(input: {
  recommendations: AIRecommendation[];
  feedbackByRecommendationId: Map<string, RecommendationFeedback>;
  todayStr: string;
}): LearningCardData {
  const { recommendations, feedbackByRecommendationId, todayStr } = input;

  const memory = buildRecommendationMemory(
    recommendations,
    feedbackByRecommendationId,
    todayStr
  );

  const priorRecs = recommendations
    .filter((r) => r.recommendation_date < todayStr)
    .sort((a, b) => b.recommendation_date.localeCompare(a.recommendation_date));

  const latestRec = priorRecs[0] ?? null;
  const latestFeedback = latestRec
    ? feedbackByRecommendationId.get(latestRec.id) ?? null
    : null;

  const timeline = priorRecs.slice(0, 7).map((rec) => ({
    dateLabel: formatTimelineDateLabel(rec.recommendation_date, todayStr),
    actionLabel: ACTION_TIMELINE_LABELS[rec.action_type],
    date: rec.recommendation_date,
  }));

  const learnedText = buildLearnedText({
    memoryRepeatCount: memory.repeat_count,
    lastActionType: memory.last_recommendation?.action_type ?? null,
    feedback: latestFeedback,
    campusPhrase: extractCampusPhrase(latestRec?.input_snapshot ?? null),
    hasAnyHistory: priorRecs.length > 0,
  });

  return {
    latest: {
      title: memory.last_recommendation?.title ?? null,
    },
    feedback: toFeedbackDisplay(latestFeedback),
    learnedText,
    timeline,
    stats: {
      historyCount: recommendations.length,
    },
  };
}

/** @deprecated Use LearningCardLatest */
export type LearningCardYesterday = LearningCardLatest;
