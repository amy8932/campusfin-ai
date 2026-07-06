import type { PromptInput } from "@/lib/ai/input-builder";
import { getLlmConfig, LlmError } from "@/lib/ai/llm";
import type { DailyRecommendationOutput } from "@/lib/ai/prompts";

const JUDGE_TIMEOUT_MS = 12_000;

export interface JudgeDimensions {
  campus_first: 0 | 1 | 2;
  business_health: 0 | 1 | 2;
  goal_alignment: 0 | 1 | 2;
  one_action: 0 | 1 | 2;
  thirty_minute_rule: 0 | 1 | 2;
  owner_control: 0 | 1 | 2;
  language: 0 | 1 | 2;
}

export interface JudgeResult {
  total_score: number;
  dimensions: JudgeDimensions;
  pass: boolean;
  summary: string;
  owner_acceptance_likelihood: string;
  weaknesses: string[];
  suggestions: string[];
}

export class JudgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JudgeError";
  }
}

const JUDGE_SYSTEM_PROMPT = `You are the CampusFin AI Quality Judge — an internal evaluation tool for offline prompt regression testing.

You do NOT rewrite recommendations. You ONLY evaluate them.

Score each recommendation against the CampusFin AI Quality Rubric (docs/AI-QUALITY-REVIEW.md). Use EXACTLY these 7 dimensions — do NOT invent new criteria.

## Dimensions (0, 1, or 2 points each — max 14)

1. campus_first — Clear reference to campus event, moment, or traffic signal?
   - 0: No campus reference; generic advice for any shop
   - 1: Vague campus mention without specific event/moment/traffic
   - 2: Clear reference to exam week, career fair, rain, thesis season, enrollment, etc.

2. business_health — Uses today's or recent business data?
   - 0: Ignores revenue, customer count, or trend
   - 1: Mentions data loosely without numbers or direction
   - 2: Cites specific data (revenue, vs last week, vs 7-day avg, trend)

3. goal_alignment — Connects to business_goal?
   - 0: Action contradicts or ignores stated goal
   - 1: Compatible with goal but reason doesn't mention goal
   - 2: Reason explicitly links action to goal label (e.g. 提升营业额, 改善现金流)

4. one_action — Exactly one action?
   - 0: Multiple actions, numbered list, or alternatives
   - 1: Single title but reason suggests secondary actions
   - 2: One verb-led action; reason supports that single action only

5. thirty_minute_rule — Owner can START within 30 minutes?
   - 0: Long-term project (renovation, hiring, loyalty program setup)
   - 1: Doable today but needs hours of prep
   - 2: Owner can start within 30 minutes

6. owner_control — Fully under owner control?
   - 0: Suggests waiting (等学生回来, 等天气好转, 等学校通知)
   - 1: Mostly controllable but depends on uncertain external factor
   - 2: Fully owner-controlled operational move

7. language — CampusFin writing style?
   - 0: English-heavy, jargon (KPI/ROI/赋能/抓手), chatbot or report tone
   - 1: Chinese but too long, consultant-like, or "As an AI"
   - 2: Concise Simplified Chinese; sharp campus shop manager voice; ≤2 sentence reason

## Pass standard
pass = true when total_score >= 12 (Beta-ready threshold).

## Rules
- total_score MUST equal the sum of all 7 dimension scores (max 14).
- weaknesses: 0–3 specific issues observed (English or Chinese OK).
- suggestions: 0–3 actionable prompt improvement hints for Sprint 5d (NOT rewritten recommendations).
- summary: 1–2 sentences in English.
- owner_acceptance_likelihood: 1 sentence on whether this owner is likely to execute today’s recommendation, using recommendation_memory.last_feedback and last_recommendation if present (e.g. prior good feedback on similar actions → higher likelihood).
- Be strict but fair. Campus-first is the moat — penalize generic ChatGPT-style advice.`.trim();

const JUDGE_DEVELOPER_PROMPT = `Evaluate the generated recommendation against the PromptInput context.

Return ONLY a single JSON object. No markdown. No explanation outside JSON.

Schema:
{
  "total_score": number,
  "dimensions": {
    "campus_first": 0 | 1 | 2,
    "business_health": 0 | 1 | 2,
    "goal_alignment": 0 | 1 | 2,
    "one_action": 0 | 1 | 2,
    "thirty_minute_rule": 0 | 1 | 2,
    "owner_control": 0 | 1 | 2,
    "language": 0 | 1 | 2
  },
  "pass": boolean,
  "summary": "string",
  "owner_acceptance_likelihood": "string — 1 sentence, likelihood owner executes based on memory/feedback",
  "weaknesses": ["string"],
  "suggestions": ["string"]
}

Set pass = true if total_score >= 12.`.trim();

const DIMENSION_KEYS: (keyof JudgeDimensions)[] = [
  "campus_first",
  "business_health",
  "goal_alignment",
  "one_action",
  "thirty_minute_rule",
  "owner_control",
  "language",
];

function buildJudgeHeaders(config: NonNullable<ReturnType<typeof getLlmConfig>>) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };
  if (
    config.provider === "openrouter" ||
    config.baseUrl.includes("openrouter.ai")
  ) {
    headers["HTTP-Referer"] =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
    headers["X-Title"] = "CampusFin AI Judge";
  }
  return headers;
}

function parseJudgeResponse(raw: string): JudgeResult {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new JudgeError("Judge response is not valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new JudgeError("Judge response must be a JSON object.");
  }

  const obj = parsed as Record<string, unknown>;
  const dimensionsRaw = obj.dimensions;

  if (typeof dimensionsRaw !== "object" || dimensionsRaw === null) {
    throw new JudgeError("Judge response missing dimensions object.");
  }

  const dimensions = {} as JudgeDimensions;
  for (const key of DIMENSION_KEYS) {
    const value = (dimensionsRaw as Record<string, unknown>)[key];
    if (value !== 0 && value !== 1 && value !== 2) {
      throw new JudgeError(`Invalid score for dimension "${key}".`);
    }
    dimensions[key] = value;
  }

  const computedTotal = DIMENSION_KEYS.reduce((sum, k) => sum + dimensions[k], 0);
  const totalScore =
    typeof obj.total_score === "number" ? obj.total_score : computedTotal;

  if (totalScore !== computedTotal) {
    throw new JudgeError(
      `total_score (${totalScore}) does not match sum of dimensions (${computedTotal}).`
    );
  }

  if (typeof obj.summary !== "string" || obj.summary.trim().length === 0) {
    throw new JudgeError("Judge response missing summary.");
  }

  const ownerAcceptance =
    typeof obj.owner_acceptance_likelihood === "string" &&
    obj.owner_acceptance_likelihood.trim().length > 0
      ? obj.owner_acceptance_likelihood.trim()
      : "Not assessed.";

  const weaknesses = Array.isArray(obj.weaknesses)
    ? obj.weaknesses.filter((w): w is string => typeof w === "string")
    : [];
  const suggestions = Array.isArray(obj.suggestions)
    ? obj.suggestions.filter((s): s is string => typeof s === "string")
    : [];

  const pass =
    typeof obj.pass === "boolean" ? obj.pass : totalScore >= 12;

  return {
    total_score: totalScore,
    dimensions,
    pass,
    summary: obj.summary.trim(),
    owner_acceptance_likelihood: ownerAcceptance,
    weaknesses,
    suggestions,
  };
}

async function callJudgeLlm(userPayload: string): Promise<string> {
  const config = getLlmConfig();
  if (!config) {
    throw new JudgeError("LLM API key is not configured for judge.");
  }

  const model =
    process.env.JUDGE_MODEL?.trim() ||
    process.env.LLM_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    config.model;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JUDGE_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: buildJudgeHeaders(config),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: JUDGE_SYSTEM_PROMPT },
          { role: "developer", content: JUDGE_DEVELOPER_PROMPT },
          { role: "user", content: userPayload },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new JudgeError(
        `Judge LLM error ${response.status}: ${body.slice(0, 200)}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new JudgeError("Judge LLM returned empty content.");
    }

    return content;
  } catch (error) {
    if (error instanceof JudgeError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new JudgeError(
        `Judge request timed out after ${JUDGE_TIMEOUT_MS}ms.`
      );
    }
    throw new JudgeError(
      error instanceof Error ? error.message : "Unknown judge error."
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Evaluate recommendation quality via isolated judge LLM. Does not rewrite. */
export async function evaluateRecommendation(
  input: PromptInput,
  recommendation: DailyRecommendationOutput
): Promise<JudgeResult> {
  const userPayload = JSON.stringify({
    prompt_input: input,
    generated_recommendation: recommendation,
  });

  const raw = await callJudgeLlm(userPayload);
  return parseJudgeResponse(raw);
}

export { JUDGE_SYSTEM_PROMPT };
