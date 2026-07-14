import type { PromptInput } from "@/lib/ai/input-builder";
import type { RecommendationMemory } from "@/lib/ai/memory";
import type {
  ActionType,
  AIRecommendation,
  ConfidenceLevel,
} from "@/types/database";

export interface AnalysisBusinessFacts {
  revenue: string;
  customers: string;
  status: string;
  trend: string;
}

export interface AnalysisAlternative {
  label: string;
  notSelectedReason: string;
}

export interface AnalysisConfidence {
  level: ConfidenceLevel;
  levelLabel: string;
  because: string;
}

export interface RecommendationAnalysis {
  campusSignals: string[];
  businessFacts: AnalysisBusinessFacts;
  goalLabel: string;
  goalNote: string;
  learningLines: string[];
  decisionTitle: string;
  decisionNote: string;
  alternative: AnalysisAlternative;
  confidence: AnalysisConfidence;
  whyChose: string;
}

const ACTION_CATEGORY_ZH: Record<ActionType, string> = {
  extend_hours: "营业时间优化",
  adjust_staffing: "人手与排班调整",
  prepare_inventory: "备料与库存准备",
  reduce_inventory: "减少备料与库存",
  run_promotion: "促销推广",
  capture_traffic: "抓住校园客流",
  improve_service: "服务体验优化",
  reduce_costs: "成本控制",
  highlight_signature_product: "招牌单品推广",
  adjust_menu: "菜单调整",
  optimize_queue: "排队与点单优化",
  push_takeaway: "外带与外卖",
  increase_display: "门口展示与陈列",
  other: "日常经营调整",
};

const ACTION_ALTERNATIVE_LABEL: Record<ActionType, string> = {
  extend_hours: "延长营业",
  adjust_staffing: "调整人手",
  prepare_inventory: "提前备料",
  reduce_inventory: "减少备料",
  run_promotion: "推出促销套餐",
  capture_traffic: "抓住校园客流",
  improve_service: "优化服务",
  reduce_costs: "控制成本",
  highlight_signature_product: "主推招牌单品",
  adjust_menu: "调整菜单",
  optimize_queue: "优化排队",
  push_takeaway: "主推外带",
  increase_display: "加强门口展示",
  other: "其他经营动作",
};

/** Each action_type maps to exactly one alternative + reason (rule-based). */
const ALTERNATIVE_MAP: Record<
  ActionType,
  { alternativeType: ActionType; notSelectedReason: string }
> = {
  extend_hours: {
    alternativeType: "run_promotion",
    notSelectedReason: "延长营业预计覆盖更多晚间新增客流，比单点促销更能接住自习客流。",
  },
  adjust_staffing: {
    alternativeType: "optimize_queue",
    notSelectedReason: "先优化排队流程比调整排班更快见效，且无需重新协调班次。",
  },
  prepare_inventory: {
    alternativeType: "run_promotion",
    notSelectedReason: "备料是为接住客流，直接促销若缺货反而浪费曝光机会。",
  },
  reduce_inventory: {
    alternativeType: "push_takeaway",
    notSelectedReason: "减少备料侧重保现金流，外带推广对今日客流假设要求更高。",
  },
  run_promotion: {
    alternativeType: "highlight_signature_product",
    notSelectedReason: "推单品比全场打折更省力，且对库存压力更小。",
  },
  capture_traffic: {
    alternativeType: "increase_display",
    notSelectedReason: "门口展示是更低成本的抓客方式，适合作为今日次优选项。",
  },
  improve_service: {
    alternativeType: "optimize_queue",
    notSelectedReason: "缩短等待比泛泛提升服务更直接，执行路径更短。",
  },
  reduce_costs: {
    alternativeType: "reduce_inventory",
    notSelectedReason: "减备料是成本控制的具体动作，比笼统节流更易执行。",
  },
  highlight_signature_product: {
    alternativeType: "run_promotion",
    notSelectedReason: "全场促销覆盖面广但稀释利润，推单品更聚焦。",
  },
  adjust_menu: {
    alternativeType: "highlight_signature_product",
    notSelectedReason: "推单品比改整本菜单更快上线，适合今日先试。",
  },
  optimize_queue: {
    alternativeType: "improve_service",
    notSelectedReason: "优化排队是更具体的瓶颈解法，比笼统提升服务更可执行。",
  },
  push_takeaway: {
    alternativeType: "reduce_inventory",
    notSelectedReason: "若客流未如预期，减备料比推外带更能先稳住现金流。",
  },
  increase_display: {
    alternativeType: "capture_traffic",
    notSelectedReason: "主动到客流动线抓客比静态陈列更主动，但执行成本更高。",
  },
  other: {
    alternativeType: "improve_service",
    notSelectedReason: "优化服务是通用备选，但不如今日主建议针对性强。",
  },
};

const WHY_CHOSE_BY_ACTION: Partial<Record<ActionType, string>> = {
  extend_hours:
    "CampusFin 选择此动作，因为它在较低运营成本下，有望承接今日校园新增客流。",
  run_promotion:
    "CampusFin 选择此动作，因为它能在短时间内拉动客流，且与今日校园节奏匹配。",
  reduce_inventory:
    "CampusFin 选择此动作，因为它能在不增加投入的情况下先稳住今日现金流。",
  optimize_queue:
    "CampusFin 选择此动作，因为它执行快、见效快，能直接改善高峰体验。",
  push_takeaway:
    "CampusFin 选择此动作，因为它适合在堂食走弱时仍保持出单。",
  increase_display:
    "CampusFin 选择此动作，因为它能以最低成本测试门口转化。",
};

const CONFIDENCE_LEVEL_LABEL: Record<ConfidenceLevel, string> = {
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

function daysUntil(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [ty, tm, td] = toDate.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

function buildCampusAnalysisSignals(input: PromptInput): string[] {
  const signals: string[] = [];
  const ctx = input.campus_context;
  const today = input.daily_checkin.checkin_date;

  if (ctx.campus_moment_label) {
    const hint = ctx.campus_moment_label.includes("考试")
      ? "晚间客流"
      : "校园客流";
    signals.push(`${ctx.campus_moment_label}预计带来更多${hint}`);
  } else if (ctx.campus_headline) {
    signals.push(ctx.campus_headline.replace(/[。.!]$/, ""));
  }

  for (const event of ctx.events_upcoming_7d.slice(0, 2)) {
    const days = daysUntil(today, event.starts_on);
    const prefix =
      days === 0 ? "今日" : days === 1 ? "明天" : `${days}天后`;
    signals.push(`${prefix}校园${event.title}`);
  }

  for (const event of ctx.events_today) {
    if (event.event_type === "weather") {
      signals.push(`今日${event.title}，堂食客流预计受影响`);
    } else if (event.event_type !== "season") {
      signals.push(`今日校园活动：${event.title}`);
    }
  }

  if (ctx.traffic_forecast === "high") {
    signals.push("今日交通热度较高");
  } else if (ctx.traffic_forecast === "low") {
    signals.push("今日客流预期偏低");
  }

  if (input.daily_checkin.note?.trim()) {
    signals.push(`老板备注：${input.daily_checkin.note.trim()}`);
  }

  return [...new Set(signals)].slice(0, 5);
}

function mapHealthStatus(label: string): string {
  if (label === "strong_day") return "Healthy / 经营良好";
  if (label === "needs_attention") return "Needs Attention / 需要关注";
  if (label === "normal") return "Normal / 正常";
  return "Unknown / 暂无";
}

function mapTrend(direction: string): string {
  if (direction === "up") return "Above recent average / 高于近期均值";
  if (direction === "down") return "Below recent average / 低于近期均值";
  return "In line with recent average / 与近期持平";
}

function buildBusinessFacts(input: PromptInput): AnalysisBusinessFacts {
  const health = input.business_health;
  return {
    revenue: `¥${health.revenue_today.toLocaleString("zh-CN")}`,
    customers: String(health.customer_count_today),
    status: mapHealthStatus(health.health_label),
    trend: mapTrend(input.recent_trend.revenue_trend_direction),
  };
}

function buildLearningLines(memory: RecommendationMemory): string[] {
  const lines: string[] = [];

  if (memory.last_7_days.length === 0) {
    lines.push("CampusFin 仍在了解你的经营习惯。");
    lines.push("CampusFin is still learning your operating habits.");
    return lines;
  }

  const dominantType = memory.last_recommendation?.action_type;
  if (dominantType && memory.repeat_count >= 2) {
    const category = ACTION_CATEGORY_ZH[dominantType];
    lines.push(`近期你常执行「${category}」类建议。`);
    lines.push(`Recently you often execute ${category} recommendations.`);
  } else if (memory.last_recommendation) {
    const category = ACTION_CATEGORY_ZH[memory.last_recommendation.action_type];
    lines.push(`最近一次建议属于「${category}」类。`);
  }

  const fb = memory.last_feedback;
  if (fb?.executed && fb.helpfulness === "good") {
    lines.push("你通常觉得这类建议有帮助。");
    lines.push("You usually find these recommendations helpful.");
  } else if (fb && !fb.executed) {
    lines.push("上一条建议你选择了暂缓执行，CampusFin 会逐步调整。");
  } else if (fb?.helpfulness === "bad") {
    lines.push("近期你对类似建议反馈偏负面，CampusFin 会降低类似推荐优先级。");
  }

  if (lines.length === 0) {
    lines.push("CampusFin 仍在积累你的经营偏好。");
  }

  return lines;
}

function explainConfidence(
  level: ConfidenceLevel,
  input: PromptInput | null,
  memory: RecommendationMemory
): string {
  const historyCount = memory.last_7_days.length;
  const strongCampus =
    input?.campus_context.traffic_forecast === "high" ||
    !!input?.campus_context.campus_moment_label ||
    (input?.campus_context.events_today.length ?? 0) > 0;
  const weakCampus = input?.campus_context.traffic_forecast === "low";

  if (level === "high") {
    if (strongCampus && historyCount >= 3) {
      return "校园信号与历史经营数据相互印证，判断依据充分。";
    }
    return "校园与经营数据整体一致，建议可放心尝试。";
  }

  if (level === "medium") {
    if (strongCampus && historyCount < 3) {
      return "校园信号较强，但历史经营数据仍较有限。";
    }
    if (strongCampus) {
      return "校园信号明确，但部分经营维度仍需更多天验证。";
    }
    return "信号可用，但部分维度仍存在不确定性。";
  }

  if (weakCampus) {
    return "校园客流信号偏弱，建议谨慎执行并随时调整。";
  }
  return "可用数据较少，建议小规模试行后再扩大。";
}

function buildWhyChose(actionType: ActionType): string {
  return (
    WHY_CHOSE_BY_ACTION[actionType] ??
    "CampusFin 选择此动作，因为它在可接受的执行成本下，与今日校园信号和经营目标最匹配。"
  );
}

function buildAlternative(actionType: ActionType): AnalysisAlternative {
  const mapping = ALTERNATIVE_MAP[actionType];
  return {
    label: ACTION_ALTERNATIVE_LABEL[mapping.alternativeType],
    notSelectedReason: mapping.notSelectedReason,
  };
}

function fallbackAnalysis(
  recommendation: AIRecommendation
): RecommendationAnalysis {
  const snapshot = recommendation.input_snapshot;
  const emptyMemory: RecommendationMemory = {
    last_recommendation: null,
    last_feedback: null,
    last_7_days: [],
    repeat_count: 0,
  };

  return {
    campusSignals:
      snapshot && typeof snapshot.campus_headline === "string"
        ? [snapshot.campus_headline]
        : ["暂无结构化校园数据"],
    businessFacts: {
      revenue:
        snapshot && typeof snapshot.revenue === "number"
          ? `¥${snapshot.revenue.toLocaleString("zh-CN")}`
          : "—",
      customers:
        snapshot && typeof snapshot.customer_count === "number"
          ? String(snapshot.customer_count)
          : "—",
      status: "—",
      trend: "—",
    },
    goalLabel: "—",
    goalNote:
      "CampusFin 优先推荐与经营目标一致、且今日可执行的动作。",
    learningLines: buildLearningLines(emptyMemory),
    decisionTitle: recommendation.recommendation_title,
    decisionNote:
      "此建议与今日校园节奏、经营状态和目标整体匹配。",
    alternative: buildAlternative(recommendation.action_type),
    confidence: {
      level: recommendation.confidence_level,
      levelLabel: CONFIDENCE_LEVEL_LABEL[recommendation.confidence_level],
      because: explainConfidence(
        recommendation.confidence_level,
        null,
        emptyMemory
      ),
    },
    whyChose: buildWhyChose(recommendation.action_type),
  };
}

export function buildRecommendationAnalysis(
  recommendation: AIRecommendation
): RecommendationAnalysis {
  const input = extractPromptInput(recommendation.input_snapshot);
  if (!input) {
    return fallbackAnalysis(recommendation);
  }

  const memory = input.recommendation_memory;

  return {
    campusSignals: buildCampusAnalysisSignals(input),
    businessFacts: buildBusinessFacts(input),
    goalLabel: input.business_goal.goal_label,
    goalNote:
      "CampusFin 优先推荐与今日经营目标一致、且可立即执行的动作。",
    learningLines: buildLearningLines(memory),
    decisionTitle: recommendation.recommendation_title,
    decisionNote:
      "此建议最匹配今日校园客流、经营状态与经营目标。",
    alternative: buildAlternative(recommendation.action_type),
    confidence: {
      level: recommendation.confidence_level,
      levelLabel: CONFIDENCE_LEVEL_LABEL[recommendation.confidence_level],
      because: explainConfidence(
        recommendation.confidence_level,
        input,
        memory
      ),
    },
    whyChose: buildWhyChose(recommendation.action_type),
  };
}
