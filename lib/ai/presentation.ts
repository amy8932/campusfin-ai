import type { PromptInput } from "@/lib/ai/input-builder";
import type {
  ActionType,
  AIRecommendation,
  ConfidenceLevel,
} from "@/types/database";

/** Frozen prompt input inside ai_recommendations.input_snapshot */
export interface RecommendationPresentation {
  signalsToday: string[];
  whyThisAction: string;
  difficultyBadge: string;
  estimatedTime: string;
  confidenceBadge: string;
}

const ACTION_PHRASES: Record<ActionType, string> = {
  extend_hours: "延长营业",
  adjust_staffing: "调整人手",
  prepare_inventory: "提前备料",
  reduce_inventory: "减少备料",
  run_promotion: "做促销",
  capture_traffic: "抓住校园客流",
  improve_service: "优化服务",
  reduce_costs: "控制成本",
  highlight_signature_product: "突出招牌单品",
  adjust_menu: "调整菜单",
  optimize_queue: "优化排队",
  push_takeaway: "主推外带",
  increase_display: "加强门口展示",
  other: "执行今日重点",
};

const ACTION_RATIONALE: Partial<Record<ActionType, string>> = {
  extend_hours: "延长营业时间比促销更值得优先尝试",
  reduce_inventory: "先减备料比冲量更适合今天",
  push_takeaway: "主推外带比等堂食回暖更实际",
  optimize_queue: "先压缩等待比做促销见效更快",
  increase_display: "加强门口展示比被动等客更有效",
  capture_traffic: "主动抓客流比等学生上门更合适",
  highlight_signature_product: "推单品比全场打折更省力",
  reduce_costs: "先控制成本比加大投入更稳妥",
  prepare_inventory: "提前备料比临时促销更能接住客流",
  run_promotion: "今天做促销比硬扛客流更合适",
  adjust_menu: "调整菜单比维持现状更见效",
  improve_service: "优化服务比加量促销更能留客",
  adjust_staffing: "调整人手比硬撑高峰更省力",
};

const DIFFICULTY_LEVEL: Partial<Record<ActionType, "Easy" | "Medium" | "Hard">> =
  {
    reduce_inventory: "Easy",
    highlight_signature_product: "Easy",
    increase_display: "Easy",
    extend_hours: "Easy",
    optimize_queue: "Easy",
    adjust_menu: "Easy",
    push_takeaway: "Easy",
    run_promotion: "Medium",
    prepare_inventory: "Medium",
    capture_traffic: "Medium",
    improve_service: "Medium",
    reduce_costs: "Easy",
    adjust_staffing: "Medium",
  };

const ESTIMATED_MINUTES: Partial<Record<ActionType, number>> = {
  extend_hours: 20,
  run_promotion: 30,
  reduce_inventory: 15,
  optimize_queue: 20,
  adjust_menu: 20,
  push_takeaway: 25,
  increase_display: 15,
};

const MOMENT_TRAFFIC_HINT: Record<string, string> = {
  exam_week: "晚间客流",
  thesis_season: "高峰打印需求",
  back_to_school: "开学客流",
  graduation_season: "毕业季客流",
};

const CONFIDENCE_BADGES: Record<ConfidenceLevel, string> = {
  high: "High Confidence",
  medium: "Medium Confidence",
  low: "Low Confidence",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractPromptInput(
  snapshot: Record<string, unknown> | null
): PromptInput | null {
  if (!snapshot) return null;
  const raw = snapshot.prompt_input;
  if (!isRecord(raw)) return null;
  return raw as unknown as PromptInput;
}

function clampChinese(text: string, max: number): string {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  return `${chars.slice(0, max - 1).join("")}…`;
}

function momentTrafficHint(momentLabel: string | null, momentSlug: string | null): string {
  if (momentSlug && MOMENT_TRAFFIC_HINT[momentSlug]) {
    return MOMENT_TRAFFIC_HINT[momentSlug];
  }
  if (momentLabel?.includes("考试")) return "晚间客流";
  if (momentLabel?.includes("论文")) return "高峰需求";
  if (momentLabel?.includes("毕业")) return "毕业季客流";
  if (momentLabel?.includes("开学")) return "开学客流";
  return "校园客流";
}

function collectCampusBullets(input: PromptInput): string[] {
  const bullets: string[] = [];
  const ctx = input.campus_context;

  if (ctx.campus_moment_label) {
    const hint = momentTrafficHint(ctx.campus_moment_label, ctx.campus_moment);
    bullets.push(`${ctx.campus_moment_label}预计带来更多${hint}`);
  } else if (ctx.campus_headline) {
    bullets.push(ctx.campus_headline.replace(/[。.!]$/, ""));
  }

  for (const event of ctx.events_upcoming_7d) {
    bullets.push(`${event.title}即将开始`);
  }

  for (const event of ctx.events_today) {
    const line =
      event.event_type === "weather"
        ? `今日${event.title}，堂食客流预计受影响`
        : `今日校园活动：${event.title}`;
    if (!bullets.some((b) => b.includes(event.title))) {
      bullets.push(line);
    }
  }

  if (input.daily_checkin.note?.trim()) {
    bullets.push(`今日情况：${input.daily_checkin.note.trim()}`);
  }

  return bullets;
}

function collectBusinessBullets(input: PromptInput): string[] {
  const health = input.business_health;
  return [
    `今日营业额 ¥${health.revenue_today.toLocaleString("zh-CN")}`,
  ];
}

function collectGoalBullets(input: PromptInput): string[] {
  return [`当前目标：${input.business_goal.goal_label}`];
}

export function buildWhyTodayBullets(
  snapshot: Record<string, unknown> | null
): string[] {
  const input = extractPromptInput(snapshot);
  if (!input) {
    const fallback: string[] = [];
    if (snapshot && typeof snapshot.campus_headline === "string") {
      fallback.push(snapshot.campus_headline);
    }
    if (snapshot && typeof snapshot.revenue === "number") {
      fallback.push(
        `今日营业额 ¥${snapshot.revenue.toLocaleString("zh-CN")}`
      );
    }
    return fallback.slice(0, 3);
  }

  const campus = collectCampusBullets(input);
  const business = collectBusinessBullets(input);
  const goal = collectGoalBullets(input);

  const ordered: string[] = [];
  if (campus[0]) ordered.push(campus[0]);
  if (business[0]) ordered.push(business[0]);
  if (goal[0]) ordered.push(goal[0]);

  let campusIdx = 1;
  while (ordered.length < 3 && campusIdx < campus.length) {
    ordered.push(campus[campusIdx++]);
  }

  return ordered.slice(0, 3);
}

function splitReasonSentences(reason: string): string[] {
  return reason
    .split(/[。！？]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildWhyThisAction(
  recommendation: Pick<
    AIRecommendation,
    "recommendation_title" | "reason" | "action_type"
  >
): string {
  const sentences = splitReasonSentences(recommendation.reason);
  const rationale =
    ACTION_RATIONALE[recommendation.action_type] ??
    `因此${ACTION_PHRASES[recommendation.action_type]}更适合今天优先尝试`;

  if (sentences.length >= 2) {
    const s1 = sentences[0];
    const s2 = sentences[1]
      .replace(/^今天/, "今日")
      .replace(/，?$/, "");
    return clampChinese(`${s1}，而${s2}，${rationale}。`, 70);
  }

  if (sentences.length === 1) {
    return clampChinese(`${sentences[0]}，${rationale}。`, 70);
  }

  return clampChinese(recommendation.reason, 70);
}

export function getDifficultyBadge(actionType: ActionType): string {
  return DIFFICULTY_LEVEL[actionType] ?? "Medium";
}

export function getEstimatedTime(actionType: ActionType): string {
  const minutes = ESTIMATED_MINUTES[actionType] ?? 20;
  return `≈${minutes} min`;
}

export function getConfidenceBadge(level: ConfidenceLevel): string {
  return CONFIDENCE_BADGES[level];
}

export function buildRecommendationPresentation(
  recommendation: AIRecommendation
): RecommendationPresentation {
  return {
    signalsToday: buildWhyTodayBullets(recommendation.input_snapshot),
    whyThisAction: buildWhyThisAction(recommendation),
    difficultyBadge: getDifficultyBadge(recommendation.action_type),
    estimatedTime: getEstimatedTime(recommendation.action_type),
    confidenceBadge: getConfidenceBadge(recommendation.confidence_level),
  };
}

/** @deprecated Use buildWhyThisAction */
export const buildWhyThisRecommendation = buildWhyThisAction;
