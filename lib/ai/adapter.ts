import { buildPromptInput, type PromptInput } from "@/lib/ai/input-builder";
import { generateRecommendation, isLlmEnabled, LlmError } from "@/lib/ai/llm";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import { generateRuleBasedRecommendation } from "@/lib/ai/rule-based";
import { ValidationError, validateRecommendationOutput } from "@/lib/ai/validator";
import { buildCampusContext } from "@/lib/campus/context";
import { createClient } from "@/lib/supabase/server";
import type {
  Business,
  CampusEvent,
  DailyCheckin,
  RecommendationSource,
} from "@/types/database";

export interface GenerateTodayRecommendationInput {
  business: Business;
  todayCheckin: DailyCheckin;
  todayStr: string;
  campusEvents: CampusEvent[];
  recentCheckins: DailyCheckin[];
}

interface StoredRecommendation {
  recommendation_title: string;
  reason: string;
  expected_impact: string | null;
  confidence_level: "high" | "medium" | "low";
  action_type:
    | "extend_hours"
    | "adjust_staffing"
    | "run_promotion"
    | "prepare_inventory"
    | "improve_service"
    | "reduce_costs"
    | "capture_traffic"
    | "other";
  fallback_message: string | null;
  source: RecommendationSource;
  input_snapshot: Record<string, unknown>;
}

function logRecommendationEvent(event: {
  promptVersion: string;
  source: RecommendationSource;
  retryCount: number;
  validationResult: string;
  llmDurationMs?: number;
}) {
  console.info("[CampusFin AI]", event);
}

function shouldSkipLlm(checkin: DailyCheckin): boolean {
  return checkin.revenue === 0 && checkin.customer_count === 0;
}

async function saveRecommendation(
  businessId: string,
  todayStr: string,
  recommendation: StoredRecommendation
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_ai_recommendation", {
    p_business_id: businessId,
    p_recommendation_date: todayStr,
    p_recommendation_title: recommendation.recommendation_title,
    p_reason: recommendation.reason,
    p_expected_impact: recommendation.expected_impact,
    p_confidence_level: recommendation.confidence_level,
    p_action_type: recommendation.action_type,
    p_fallback_message: recommendation.fallback_message,
    p_source: recommendation.source,
    p_input_snapshot: recommendation.input_snapshot,
  });

  if (error) {
    console.error("[CampusFin AI] Failed to store recommendation:", error.message);
  }
}

function buildRuleBasedRecommendation(
  input: GenerateTodayRecommendationInput,
  promptInput: PromptInput
): StoredRecommendation {
  const campusContext = buildCampusContext(
    input.campusEvents,
    input.business.campus_name,
    input.todayStr
  );

  const rec = generateRuleBasedRecommendation({
    business: input.business,
    campusContext,
    campusEvents: input.campusEvents,
    todayCheckin: input.todayCheckin,
    todayStr: input.todayStr,
  });

  return {
    recommendation_title: rec.recommendation_title,
    reason: rec.reason,
    expected_impact: rec.expected_impact,
    confidence_level: rec.confidence_level,
    action_type: rec.action_type,
    fallback_message: rec.fallback_message,
    source: "rule_based",
    input_snapshot: {
      prompt_version: PROMPT_VERSION,
      campus_headline: campusContext.headlineZh,
      revenue: input.todayCheckin.revenue,
      customer_count: input.todayCheckin.customer_count,
      prompt_input: promptInput,
    },
  };
}

/** Main entry: LLM with retry, silent fallback to rule-based. Transparent to Dashboard. */
export async function generateTodayRecommendation(
  input: GenerateTodayRecommendationInput
): Promise<void> {
  const campusContext = buildCampusContext(
    input.campusEvents,
    input.business.campus_name,
    input.todayStr
  );

  const promptInput = buildPromptInput({
    business: input.business,
    campusContext,
    todayCheckin: input.todayCheckin,
    recentCheckins: input.recentCheckins,
    todayStr: input.todayStr,
  });

  if (!isLlmEnabled() || shouldSkipLlm(input.todayCheckin)) {
    const ruleRec = buildRuleBasedRecommendation(input, promptInput);
    const skippedZeroCheckin =
      isLlmEnabled() && shouldSkipLlm(input.todayCheckin);
    ruleRec.input_snapshot = {
      ...ruleRec.input_snapshot,
      llm_attempted: false,
      fallback_reason: skippedZeroCheckin
        ? "skipped_zero_checkin"
        : "feature_flag_off",
    };
    logRecommendationEvent({
      promptVersion: PROMPT_VERSION,
      source: "rule_based",
      retryCount: 0,
      validationResult: skippedZeroCheckin
        ? "skipped_zero_checkin"
        : "feature_flag_off",
    });
    await saveRecommendation(input.business.id, input.todayStr, ruleRec);
    return;
  }

  let retryCount = 0;
  let lastValidationError: string | null = null;
  let fallbackReason: string | null = null;
  let lastRawLlmOutput: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const start = Date.now();
    try {
      const raw = await generateRecommendation(
        promptInput,
        attempt > 0 ? lastValidationError : null
      );
      lastRawLlmOutput = raw;
      const llmDurationMs = Date.now() - start;
      const validated = validateRecommendationOutput(raw, promptInput);

      logRecommendationEvent({
        promptVersion: PROMPT_VERSION,
        source: "ai",
        retryCount,
        validationResult: "pass",
        llmDurationMs,
      });

      await saveRecommendation(input.business.id, input.todayStr, {
        ...validated,
        fallback_message: null,
        source: "ai",
        input_snapshot: {
          prompt_version: PROMPT_VERSION,
          prompt_input: promptInput,
          llm_duration_ms: llmDurationMs,
          retry_count: retryCount,
        },
      });
      return;
    } catch (error) {
      const llmDurationMs = Date.now() - start;

      if (error instanceof ValidationError) {
        fallbackReason = `validation_failed: ${error.message}`;
        lastValidationError = error.message;
        retryCount = attempt + 1;
        logRecommendationEvent({
          promptVersion: PROMPT_VERSION,
          source: "ai",
          retryCount,
          validationResult: fallbackReason,
          llmDurationMs,
        });
        continue;
      }

      if (error instanceof LlmError) {
        fallbackReason = `llm_error: ${error.message}`;
      } else {
        fallbackReason = "unknown_error";
      }

      logRecommendationEvent({
        promptVersion: PROMPT_VERSION,
        source: "ai",
        retryCount,
        validationResult: fallbackReason,
        llmDurationMs,
      });
      break;
    }
  }

  const ruleRec = buildRuleBasedRecommendation(input, promptInput);
  ruleRec.input_snapshot = {
    ...ruleRec.input_snapshot,
    fallback_reason: fallbackReason,
    last_raw_llm_output: lastRawLlmOutput,
    retry_count: retryCount,
    llm_attempted: true,
  };
  logRecommendationEvent({
    promptVersion: PROMPT_VERSION,
    source: "rule_based",
    retryCount,
    validationResult: "fallback_after_llm_failure",
  });
  await saveRecommendation(input.business.id, input.todayStr, ruleRec);
}
