// AI engine exports — LLM adapter (Sprint 5b) with rule-based fallback.

export { generateTodayRecommendation } from "@/lib/ai/adapter";
export { buildPromptInput } from "@/lib/ai/input-builder";
export type { PromptInput } from "@/lib/ai/input-builder";
export {
  generateRecommendation,
  getLlmConfig,
  isLlmConfigured,
  isLlmEnabled,
} from "@/lib/ai/llm";
export type { LlmConfig } from "@/lib/ai/llm";
export {
  PROMPT_VERSION,
  SYSTEM_PROMPT,
  DEVELOPER_PROMPT,
  FEW_SHOT_EXAMPLES,
} from "@/lib/ai/prompts";
export { validateRecommendationOutput, ValidationError } from "@/lib/ai/validator";
export { generateRuleBasedRecommendation } from "@/lib/ai/rule-based";
export type { RuleBasedRecommendation } from "@/lib/ai/rule-based";
