import type { PromptInput } from "@/lib/ai/input-builder";
import {
  DEVELOPER_PROMPT,
  FEW_SHOT_EXAMPLES,
  PROMPT_VERSION,
  SYSTEM_PROMPT,
} from "@/lib/ai/prompts";

const LLM_TIMEOUT_MS = 8_000;
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENAI_BASE_URL = "https://api.openai.com/v1";

interface ChatMessage {
  role: "system" | "developer" | "user" | "assistant";
  content: string;
}

export interface LlmConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}

function resolveApiKey(): string | undefined {
  const key =
    process.env.LLM_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  return key || undefined;
}

function resolveModel(): string {
  return (
    process.env.LLM_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    DEFAULT_MODEL
  );
}

function resolveProvider(): string {
  return (process.env.LLM_PROVIDER || "openai").trim().toLowerCase();
}

function resolveBaseUrl(): string {
  const baseUrl = process.env.LLM_BASE_URL?.trim();
  if (baseUrl) {
    return baseUrl.replace(/\/$/, "");
  }
  if (resolveProvider() === "openrouter") {
    return OPENROUTER_BASE_URL;
  }
  return OPENAI_BASE_URL;
}

export function logLlmConfigDebug(): void {
  console.info("[CampusFin AI Config]", {
    enableLlmRaw: process.env.ENABLE_LLM,
    enabled: isLlmEnabledInternal(),
    configured: isLlmConfigured(),
    provider: resolveProvider(),
    model: resolveModel(),
    baseUrl: resolveBaseUrl(),
    hasLlmApiKey: Boolean(process.env.LLM_API_KEY),
    hasOpenAiApiKey: Boolean(process.env.OPENAI_API_KEY),
  });
}

function isLlmEnabledInternal(): boolean {
  return (
    process.env.ENABLE_LLM?.trim().toLowerCase() === "true" &&
    isLlmConfigured()
  );
}

/** Resolved LLM config from env — never includes logging of apiKey. */
export function getLlmConfig(): LlmConfig | null {
  const apiKey = resolveApiKey();
  if (!apiKey) return null;

  return {
    provider: resolveProvider(),
    apiKey,
    model: resolveModel(),
    baseUrl: resolveBaseUrl(),
  };
}

export function isLlmConfigured(): boolean {
  return Boolean(resolveApiKey());
}

export function isLlmEnabled(): boolean {
  logLlmConfigDebug();
  return isLlmEnabledInternal();
}

function buildMessages(
  input: PromptInput,
  validationHint?: string | null
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "developer", content: DEVELOPER_PROMPT },
  ];

  for (const example of FEW_SHOT_EXAMPLES) {
    messages.push({
      role: "user",
      content: JSON.stringify(example.input),
    });
    messages.push({
      role: "assistant",
      content: JSON.stringify(example.expected_output),
    });
  }

  let userContent = JSON.stringify(input);
  if (validationHint) {
    userContent += `\n\nPrevious response failed validation: ${validationHint}. Return a corrected JSON object only.`;
  }

  messages.push({ role: "user", content: userContent });
  return messages;
}

function buildRequestHeaders(config: LlmConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };

  if (config.provider === "openrouter" || config.baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
    headers["X-Title"] = "CampusFin AI";
  }

  return headers;
}

/** Calls LLM and returns raw response text (JSON string). No DB access. */
export async function generateRecommendation(
  input: PromptInput,
  validationHint?: string | null
): Promise<string> {
  const config = getLlmConfig();
  if (!config) {
    throw new LlmError("LLM API key is not configured (LLM_API_KEY or OPENAI_API_KEY).");
  }

  const messages = buildMessages(input, validationHint);
  const url = `${config.baseUrl}/chat/completions`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildRequestHeaders(config),
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    const llmDurationMs = Date.now() - start;

    if (!response.ok) {
      const body = await response.text();
      console.info("[CampusFin AI]", {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        promptVersion: PROMPT_VERSION,
        llmDurationMs,
        status: response.status,
      });
      throw new LlmError(
        `LLM API error ${response.status}: ${body.slice(0, 200)}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.info("[CampusFin AI]", {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        promptVersion: PROMPT_VERSION,
        llmDurationMs,
        status: "empty_content",
      });
      throw new LlmError("LLM returned empty content.");
    }

    console.info("[CampusFin AI]", {
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      promptVersion: PROMPT_VERSION,
      llmDurationMs,
    });

    return content;
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      console.info("[CampusFin AI]", {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        promptVersion: PROMPT_VERSION,
        llmDurationMs: Date.now() - start,
        status: "timeout",
      });
      throw new LlmError(`LLM request timed out after ${LLM_TIMEOUT_MS}ms.`);
    }
    throw new LlmError(
      error instanceof Error ? error.message : "Unknown LLM error."
    );
  } finally {
    clearTimeout(timeout);
  }
}
