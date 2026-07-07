import type { PromptInput } from "@/lib/ai/input-builder";
import { buildRecommendationMemory } from "@/lib/ai/memory";
import type {
  ActionType,
  AIRecommendation,
  FeedbackHelpfulness,
  RecommendationFeedback,
} from "@/types/database";

export interface LearningCardYesterday {
  title: string | null;
}

export type LearningFeedbackKind = "none" | "executed" | "not_executed";

export interface LearningCardFeedback {
  kind: LearningFeedbackKind;
  helpfulness: FeedbackHelpfulness | null;
}

export interface LearningTimelineItem {
  weekdayLabel: string;
  shortLabel: string;
  date: string;
}

export interface LearningCardData {
  yesterday: LearningCardYesterday;
  feedback: LearningCardFeedback;
  learnedText: string;
  timeline: LearningTimelineItem[];
  stats: {
    historyCount: number;
  };
}

const ACTION_SHORT_LABELS: Record<ActionType, string> = {
  extend_hours: "延长营业",
  adjust_staffing: "调整人手",
  prepare_inventory: "提前备料",
  reduce_inventory: "减少备货",
  run_promotion: "推广套餐",
  capture_traffic: "抓住客流",
  improve_service: "优化服务",
  reduce_costs: "控制成本",
  highlight_signature_product: "主推招牌",
  adjust_menu: "调整菜单",
  optimize_queue: "优化排队",
  push_takeaway: "增加外卖",
  increase_display: "门口展示",
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

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const LEARNING_PLACEHOLDER = "AI 正在学习你的经营习惯。";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function formatWeekdayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return WEEKDAY_LABELS[day] ?? "—";
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
}): string {
  const { memoryRepeatCount, lastActionType, feedback, campusPhrase } = input;

  if (!feedback) {
    return LEARNING_PLACEHOLDER;
  }

  const actionPhrase = lastActionType
    ? ACTION_LEARNED_PHRASES[lastActionType]
    : "此类经营建议";

  if (
    memoryRepeatCount >= 2 &&
    (!feedback.executed || feedback.helpfulness === "bad")
  ) {
    return clampLearnedText(
      "你较少采用此类经营建议，未来会减少类似推荐。"
    );
  }

  if (!feedback.executed) {
    return clampLearnedText("你暂缓了上一条建议，AI 会逐步调整推荐方向。");
  }

  if (feedback.helpfulness === "bad") {
    return clampLearnedText(
      "你较少采用此类经营建议，未来会减少类似推荐。"
    );
  }

  if (feedback.helpfulness === "good") {
    const campus = campusPhrase ? `${campusPhrase}，` : "";
    return clampLearnedText(
      `${campus}你通常愿意执行${actionPhrase}。`
    );
  }

  if (feedback.helpfulness === "neutral") {
    return clampLearnedText(
      `你会执行${ACTION_SHORT_LABELS[lastActionType ?? "other"]}，但感受一般，AI 会继续观察。`
    );
  }

  return LEARNING_PLACEHOLDER;
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

  const yesterdayRec = priorRecs[0] ?? null;
  const yesterdayFeedback = yesterdayRec
    ? feedbackByRecommendationId.get(yesterdayRec.id) ?? null
    : null;

  const timeline = priorRecs.slice(0, 7).map((rec) => ({
    weekdayLabel: formatWeekdayLabel(rec.recommendation_date),
    shortLabel: ACTION_SHORT_LABELS[rec.action_type],
    date: rec.recommendation_date,
  }));

  const learnedText = buildLearnedText({
    memoryRepeatCount: memory.repeat_count,
    lastActionType: memory.last_recommendation?.action_type ?? null,
    feedback: yesterdayFeedback,
    campusPhrase: extractCampusPhrase(yesterdayRec?.input_snapshot ?? null),
  });

  return {
    yesterday: {
      title: memory.last_recommendation?.title ?? null,
    },
    feedback: toFeedbackDisplay(yesterdayFeedback),
    learnedText,
    timeline,
    stats: {
      historyCount: recommendations.length,
    },
  };
}
