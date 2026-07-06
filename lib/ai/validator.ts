import type { DailyRecommendationOutput } from "@/lib/ai/prompts";
import type { PromptInput } from "@/lib/ai/input-builder";
import type { ActionType, ConfidenceLevel } from "@/types/database";

const ACTION_TYPES: ActionType[] = [
  "extend_hours",
  "adjust_staffing",
  "prepare_inventory",
  "reduce_inventory",
  "run_promotion",
  "capture_traffic",
  "improve_service",
  "reduce_costs",
  "highlight_signature_product",
  "adjust_menu",
  "optimize_queue",
  "push_takeaway",
  "increase_display",
  "other",
];

const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["high", "medium", "low"];

const ACTION_VERBS =
  /^(延长|推出|减少|增设|准备|主推|调整|优化|开展|设置|增加|控制|加强|临时|提前|集中|缩短|备足|加快|压缩|精简|切换|突出|加大|摆放)/;

const LONG_TERM_PATTERNS =
  /装修|招人|招聘|长期|租约|改造|重装|加盟|贷款|融资|投资|税务|法律|忠诚计划|会员体系搭建/;

const OWNER_PASSIVE_PATTERNS =
  /等待|等天气|等学生|等学校|等大学|希望天气|盼着|观望|静观其变/;

const FINANCIAL_ADVICE_PATTERNS =
  /贷款|融资|投资|理财|股票|基金|税务筹划|法律顾问|信用卡|借贷/;

const ENGLISH_WORD_PATTERN = /\b[A-Za-z]{4,}\b/;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonOutput(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    throw new ValidationError("Response is not valid JSON.");
  }
}

function assertStringField(
  obj: Record<string, unknown>,
  field: string,
  maxLength: number
): string {
  const value = obj[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`Field "${field}" must be a non-empty string.`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(
      `Field "${field}" exceeds max length of ${maxLength}.`
    );
  }
  return value.trim();
}

function assertChineseText(field: string, value: string): void {
  if (ENGLISH_WORD_PATTERN.test(value)) {
    throw new ValidationError(`Field "${field}" must be Simplified Chinese.`);
  }
  if (!/[\u4e00-\u9fff]/.test(value)) {
    throw new ValidationError(`Field "${field}" must contain Chinese text.`);
  }
}

function countChineseCharacters(value: string): number {
  return (value.match(/[\u4e00-\u9fff]/g) ?? []).length;
}

function assertTitleLength(title: string): void {
  const count = countChineseCharacters(title);
  if (count < 8 || count > 20) {
    throw new ValidationError(
      "recommendation_title must be 8–20 Chinese characters."
    );
  }
}

function assertActionVerb(title: string): void {
  if (!ACTION_VERBS.test(title)) {
    throw new ValidationError(
      "recommendation_title must start with an actionable verb or time-bound action phrase."
    );
  }
}

function assertThirtyMinuteRule(title: string, reason: string): void {
  const combined = `${title} ${reason}`;
  if (LONG_TERM_PATTERNS.test(combined)) {
    throw new ValidationError(
      "Recommendation suggests a long-term or out-of-scope action (30-minute rule)."
    );
  }
}

function assertOwnerControl(title: string, reason: string): void {
  const combined = `${title} ${reason}`;
  if (OWNER_PASSIVE_PATTERNS.test(combined)) {
    throw new ValidationError(
      "Recommendation suggests waiting on factors outside owner control."
    );
  }
  if (FINANCIAL_ADVICE_PATTERNS.test(combined)) {
    throw new ValidationError(
      "Recommendation contains forbidden financial or legal advice."
    );
  }
}

function assertCampusReference(reason: string, input: PromptInput): void {
  const campusTerms = [
    input.campus_context.campus_name,
    input.campus_context.campus_moment_label,
    input.campus_context.campus_headline,
    ...input.campus_context.events_today.map((e) => e.title),
    ...input.campus_context.events_upcoming_7d.map((e) => e.title),
    "考试",
    "论文",
    "校园",
    "客流",
    "雨天",
    "天气",
    "季",
  ].filter(Boolean) as string[];

  const hasCampusRef = campusTerms.some((term) => reason.includes(term));
  if (!hasCampusRef) {
    throw new ValidationError(
      "reason must reference campus context (event, moment, traffic, or headline)."
    );
  }
}

function assertGoalReference(reason: string, input: PromptInput): void {
  const goalLabel = input.business_goal.goal_label;
  if (!reason.includes(goalLabel) && !reason.includes("目标")) {
    throw new ValidationError(
      `reason must reference business goal ("${goalLabel}").`
    );
  }
}

export function validateRecommendationOutput(
  raw: unknown,
  input: PromptInput
): DailyRecommendationOutput {
  const parsed = typeof raw === "string" ? parseJsonOutput(raw) : raw;

  if (Array.isArray(parsed)) {
    throw new ValidationError("Response must be a single JSON object, not an array.");
  }
  if (!isRecord(parsed)) {
    throw new ValidationError("Response must be a JSON object.");
  }

  const title = assertStringField(parsed, "recommendation_title", 80);
  const reason = assertStringField(parsed, "reason", 280);

  let expectedImpact: string | null = null;
  if (
    parsed.expected_impact !== null &&
    parsed.expected_impact !== undefined
  ) {
    expectedImpact = assertStringField(parsed, "expected_impact", 100);
  }

  const confidence = parsed.confidence_level;
  if (
    typeof confidence !== "string" ||
    !CONFIDENCE_LEVELS.includes(confidence as ConfidenceLevel)
  ) {
    throw new ValidationError(
      'confidence_level must be "high", "medium", or "low".'
    );
  }

  const actionType = parsed.action_type;
  if (
    typeof actionType !== "string" ||
    !ACTION_TYPES.includes(actionType as ActionType)
  ) {
    throw new ValidationError("action_type must be a valid enum value.");
  }

  if (parsed.fallback_message !== null) {
    throw new ValidationError("fallback_message must be null for LLM output.");
  }

  assertChineseText("recommendation_title", title);
  assertChineseText("reason", reason);
  if (expectedImpact) {
    assertChineseText("expected_impact", expectedImpact);
    if (!/预计|可能|约|左右|有望/.test(expectedImpact)) {
      throw new ValidationError(
        'expected_impact must use estimate language (预计/可能).'
      );
    }
  }

  assertTitleLength(title);
  assertActionVerb(title);
  assertThirtyMinuteRule(title, reason);
  assertOwnerControl(title, reason);
  assertCampusReference(reason, input);
  assertGoalReference(reason, input);

  return {
    recommendation_title: title,
    reason,
    expected_impact: expectedImpact,
    confidence_level: confidence as ConfidenceLevel,
    action_type: actionType as ActionType,
    fallback_message: null,
  };
}
