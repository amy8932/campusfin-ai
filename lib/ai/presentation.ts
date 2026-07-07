import type { PromptInput } from "@/lib/ai/input-builder";
import type {
  ActionType,
  AIRecommendation,
  ConfidenceLevel,
} from "@/types/database";

/** Frozen prompt input inside ai_recommendations.input_snapshot */
export interface RecommendationPresentation {
  whyToday: string[];
  whyThisRecommendation: string;
  executionDifficulty: string;
  estimatedTime: string;
  confidenceDisplay: string;
  confidenceLabel: string;
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
  extend_hours: "继续覆盖晚高峰比做促销更合适",
  reduce_inventory: "先减浪费比冲量更适合今天",
  push_takeaway: "外带比等堂食回暖更实际",
  optimize_queue: "先压缩等待比做促销见效更快",
  increase_display: "门口转化比被动等客更有效",
  capture_traffic: "主动抓客流比等学生上门更合适",
  highlight_signature_product: "推单品比全场打折更省力",
  reduce_costs: "先止血比加大投入更稳妥",
  prepare_inventory: "备足货比临时促销更能接住客流",
};

const DIFFICULTY_STARS: Partial<Record<ActionType, number>> = {
  extend_hours: 2,
  run_promotion: 3,
  reduce_inventory: 1,
  optimize_queue: 2,
  adjust_menu: 2,
  push_takeaway: 2,
  highlight_signature_product: 1,
  increase_display: 1,
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

const CONFIDENCE_DOTS: Record<ConfidenceLevel, string> = {
  high: "●●●●●",
  medium: "●●●○○",
  low: "●●○○○",
};

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: "High / 高",
  medium: "Medium / 中",
  low: "Low / 低",
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

function formatRevenueBullet(
  revenue: number,
  healthLabel?: string,
  changePct?: number | null
): string {
  const amount = `今日营业额 ¥${revenue.toLocaleString("zh-CN")}`;
  if (
    healthLabel === "strong_day" ||
    (changePct !== null && changePct !== undefined && changePct >= 10)
  ) {
    return `${amount}，表现稳定`;
  }
  if (
    healthLabel === "needs_attention" ||
    (changePct !== null && changePct !== undefined && changePct <= -10)
  ) {
    return `${amount}，低于近期水平`;
  }
  return `${amount}，仍有提升空间`;
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
    bullets.push(`老板今日反馈：${input.daily_checkin.note.trim()}`);
  }

  return bullets;
}

function collectBusinessBullets(input: PromptInput): string[] {
  const bullets: string[] = [];
  const health = input.business_health;

  bullets.push(
    formatRevenueBullet(
      health.revenue_today,
      health.health_label,
      health.revenue_change_pct_vs_last_week
    )
  );

  if (
    health.customer_count_today > 0 &&
    health.customer_change_pct_vs_7d_avg !== null &&
    health.customer_change_pct_vs_7d_avg >= 15
  ) {
    bullets.push(
      `今日客流 ${health.customer_count_today} 人，高于近7日均值`
    );
  } else if (health.cash_flow_signal === "tight") {
    bullets.push("现金流偏紧，今日宜先保现金");
  }

  return bullets;
}

function collectGoalBullets(input: PromptInput): string[] {
  return [`当前经营目标：${input.business_goal.goal_label}`];
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
      fallback.push(formatRevenueBullet(snapshot.revenue));
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
  let businessIdx = 1;
  while (ordered.length < 3 && campusIdx < campus.length) {
    ordered.push(campus[campusIdx++]);
  }
  while (ordered.length < 3 && businessIdx < business.length) {
    ordered.push(business[businessIdx++]);
  }
  while (ordered.length < 3 && goal.length > 1) {
    ordered.push(goal[1]);
    break;
  }

  return ordered.slice(0, 3);
}

function splitReasonSentences(reason: string): string[] {
  return reason
    .split(/[。！？]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildWhyThisRecommendation(
  recommendation: Pick<
    AIRecommendation,
    "recommendation_title" | "reason" | "action_type"
  >
): string {
  const actionPhrase = ACTION_PHRASES[recommendation.action_type];
  const sentences = splitReasonSentences(recommendation.reason);
  const rationale = ACTION_RATIONALE[recommendation.action_type];

  if (sentences.length >= 2) {
    const tail = rationale ? `，${rationale}` : "";
    return `今天建议${actionPhrase}，因为${sentences[0]}，同时${sentences[1]}${tail}。`;
  }

  if (sentences.length === 1) {
    const tail = rationale ? `，${rationale}` : "";
    return `今天建议${actionPhrase}，因为${sentences[0]}${tail}。`;
  }

  return recommendation.reason;
}

export function getExecutionDifficulty(actionType: ActionType): string {
  const stars = DIFFICULTY_STARS[actionType] ?? 3;
  return "⭐".repeat(stars) + "☆".repeat(5 - stars);
}

export function getEstimatedTime(actionType: ActionType): string {
  const minutes = ESTIMATED_MINUTES[actionType] ?? 20;
  return `${minutes} min`;
}

export function getConfidenceDisplay(level: ConfidenceLevel): {
  dots: string;
  label: string;
} {
  return {
    dots: CONFIDENCE_DOTS[level],
    label: CONFIDENCE_LABELS[level],
  };
}

export function buildRecommendationPresentation(
  recommendation: AIRecommendation
): RecommendationPresentation {
  const confidence = getConfidenceDisplay(recommendation.confidence_level);

  return {
    whyToday: buildWhyTodayBullets(recommendation.input_snapshot),
    whyThisRecommendation: buildWhyThisRecommendation(recommendation),
    executionDifficulty: getExecutionDifficulty(recommendation.action_type),
    estimatedTime: getEstimatedTime(recommendation.action_type),
    confidenceDisplay: confidence.dots,
    confidenceLabel: confidence.label,
  };
}
