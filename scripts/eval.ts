/**
 * CampusFin AI — Offline Prompt Evaluation Runner (Sprint 5c.1 / 5d)
 * PromptInput → generateRecommendation → Validator → AI Judge → Report
 *
 * Usage: npm run eval
 */

import fs from "fs";
import path from "path";
import type { PromptInput } from "@/lib/ai/input-builder";
import { emptyRecommendationMemory } from "@/lib/ai/memory";
import {
  evaluateRecommendation,
  JudgeError,
  type JudgeResult,
} from "@/lib/ai/judge";
import {
  generateRecommendation,
  getLlmConfig,
  LlmError,
} from "@/lib/ai/llm";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import type { DailyRecommendationOutput } from "@/lib/ai/prompts";
import {
  validateRecommendationOutput,
  ValidationError,
} from "@/lib/ai/validator";

const TESTCASES_DIR = path.join(process.cwd(), "testcases");
const REPORT_PATH = path.join(process.cwd(), "reports", "evaluation-report.md");

interface ScenarioMeta {
  id: string;
  label: string;
  business: string;
  campus: string;
  goal: string;
  health: string;
}

const SCENARIO_META: Record<string, ScenarioMeta> = {
  "001_exam_week.json": {
    id: "001",
    label: "咖啡店 · 考试周 · 提升营业额",
    business: "Coffee Shop",
    campus: "Exam Week",
    goal: "Increase Revenue",
    health: "Revenue +15%",
  },
  "002_rain_cashflow.json": {
    id: "002",
    label: "咖啡店 · 雨天 · 改善现金流",
    business: "Coffee Shop",
    campus: "Rainy Day",
    goal: "Improve Cash Flow",
    health: "Revenue -18% vs last week",
  },
  "003_back_to_school.json": {
    id: "003",
    label: "奶茶店 · 开学季 · 提升营业额",
    business: "Bubble Tea",
    campus: "Back to School",
    goal: "Increase Revenue",
    health: "Normal — steady traffic",
  },
  "004_thesis_season.json": {
    id: "004",
    label: "打印店 · 论文季 · 提升用户评价",
    business: "Print Shop",
    campus: "Thesis Season",
    goal: "Improve Satisfaction",
    health: "High traffic — near capacity",
  },
  "005_traffic_decline.json": {
    id: "005",
    label: "文印店 · 客流下降 · 改善现金流",
    business: "Print Shop",
    campus: "Steady Week",
    goal: "Improve Cash Flow",
    health: "Revenue -20% vs 7-day avg",
  },
  "006_rain_light_meal.json": {
    id: "006",
    label: "轻食店 · 雨天 · 控制成本",
    business: "Light Meal Restaurant",
    campus: "Rainy Day",
    goal: "Improve Cash Flow",
    health: "Revenue below avg",
  },
  "007_career_fair_repeat.json": {
    id: "007",
    label: "咖啡店 · 招聘会 · 提高复购率",
    business: "Coffee Shop",
    campus: "Career Fair (upcoming)",
    goal: "Improve Repeat Rate",
    health: "Normal day",
  },
  "008_graduation_flowers.json": {
    id: "008",
    label: "花店 · 毕业季",
    business: "Flower Shop",
    campus: "Graduation Season",
    goal: "Increase Revenue",
    health: "Strong day",
  },
  "009_breakfast_first_week.json": {
    id: "009",
    label: "早餐店 · 开学第一周",
    business: "Breakfast Restaurant",
    campus: "First Week of Semester",
    goal: "Increase Revenue",
    health: "Strong morning traffic",
  },
  "010_normal_weekday.json": {
    id: "010",
    label: "奶茶店 · 正常工作日",
    business: "Bubble Tea",
    campus: "Normal Weekday",
    goal: "Increase Revenue",
    health: "Normal — no strong signal",
  },
  "011_revenue_decline_streak.json": {
    id: "011",
    label: "咖啡店 · 营业额连续下降",
    business: "Coffee Shop",
    campus: "Post-Exam Quiet Period",
    goal: "Improve Cash Flow",
    health: "3-day trend down",
  },
  "012_event_cancelled.json": {
    id: "012",
    label: "打印店 · 校园活动取消",
    business: "Print Shop",
    campus: "Event Cancelled",
    goal: "Improve Cash Flow",
    health: "Revenue flat",
  },
};

const DIMENSION_LABELS: Record<string, string> = {
  campus_first: "Campus-first",
  business_health: "Business Health",
  goal_alignment: "Goal Alignment",
  one_action: "One Action",
  thirty_minute_rule: "30-minute Rule",
  owner_control: "Owner Control",
  language: "Language",
};

interface ScenarioResult {
  file: string;
  meta: ScenarioMeta;
  input: PromptInput;
  rawOutput: string | null;
  parsedOutput: DailyRecommendationOutput | null;
  validationPass: boolean;
  validationError: string | null;
  llmError: string | null;
  genDurationMs: number;
  judgeResult: JudgeResult | null;
  judgeError: string | null;
  judgeDurationMs: number;
  overallPass: boolean;
}

interface OptimizationIssue {
  title: string;
  scenarios: string[];
  suggestedFix: string;
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function loadTestcases(): Array<{ file: string; input: PromptInput }> {
  if (!fs.existsSync(TESTCASES_DIR)) {
    throw new Error(`Testcases directory not found: ${TESTCASES_DIR}`);
  }

  return fs
    .readdirSync(TESTCASES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((file) => {
      const raw = fs.readFileSync(path.join(TESTCASES_DIR, file), "utf-8");
      const input = normalizePromptInput(JSON.parse(raw) as PromptInput);
      return { file, input };
    });
}

function normalizePromptInput(raw: PromptInput): PromptInput {
  return {
    ...raw,
    recommendation_memory:
      raw.recommendation_memory ?? emptyRecommendationMemory(),
  };
}

function summarizePromptInput(input: PromptInput): string[] {
  const cc = input.campus_context;
  const bh = input.business_health;
  const mem = input.recommendation_memory;
  const lines = [
    `- **Campus:** ${cc.campus_headline}`,
    `- **Moment:** ${cc.campus_moment_label ?? "—"}`,
    `- **Traffic:** ${cc.traffic_forecast}`,
    `- **Goal:** ${input.business_goal.goal_label} (\`${input.business_goal.goal}\`)`,
    `- **Revenue today:** ¥${bh.revenue_today}`,
    `- **Health:** ${bh.health_label}`,
    `- **Trend:** ${input.recent_trend.revenue_trend_direction}`,
  ];
  if (mem.last_recommendation) {
    lines.push(
      `- **Yesterday action:** ${mem.last_recommendation.title} (\`${mem.last_recommendation.action_type}\`, ${mem.last_recommendation.age_days}d ago)`
    );
    lines.push(`- **Repeat count:** ${mem.repeat_count}`);
    if (mem.last_feedback) {
      lines.push(
        `- **Last feedback — executed:** ${mem.last_feedback.executed}`
      );
      lines.push(
        `- **Last feedback — helpfulness:** ${mem.last_feedback.helpfulness ?? "—"}`
      );
    }
  } else {
    lines.push(`- **Recommendation memory:** none (first run)`);
  }
  return lines;
}

async function runScenario(
  file: string,
  input: PromptInput
): Promise<ScenarioResult> {
  const meta = SCENARIO_META[file] ?? {
    id: file.replace(".json", ""),
    label: file,
    business: "Unknown",
    campus: "Unknown",
    goal: "Unknown",
    health: "Unknown",
  };

  let rawOutput: string | null = null;
  let parsedOutput: DailyRecommendationOutput | null = null;
  let validationPass = false;
  let validationError: string | null = null;
  let llmError: string | null = null;
  let judgeResult: JudgeResult | null = null;
  let judgeError: string | null = null;

  const genStart = Date.now();
  try {
    rawOutput = await generateRecommendation(input);
    try {
      parsedOutput = validateRecommendationOutput(rawOutput, input);
      validationPass = true;
    } catch (error) {
      validationError =
        error instanceof ValidationError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unknown validation error";
    }
  } catch (error) {
    llmError =
      error instanceof LlmError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown LLM error";
  }
  const genDurationMs = Date.now() - genStart;

  let judgeDurationMs = 0;
  if (validationPass && parsedOutput) {
    const judgeStart = Date.now();
    try {
      judgeResult = await evaluateRecommendation(input, parsedOutput);
    } catch (error) {
      judgeError =
        error instanceof JudgeError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unknown judge error";
    }
    judgeDurationMs = Date.now() - judgeStart;
  }

  const overallPass =
    validationPass && llmError === null && judgeResult?.pass === true;

  return {
    file,
    meta,
    input,
    rawOutput,
    parsedOutput,
    validationPass,
    validationError,
    llmError,
    genDurationMs,
    judgeResult,
    judgeError,
    judgeDurationMs,
    overallPass,
  };
}

function renderScenarioSection(result: ScenarioResult): string {
  const { meta, parsedOutput, input } = result;
  const lines: string[] = [];

  lines.push("================================================");
  lines.push("");
  lines.push(`# Scenario ${meta.id}`);
  lines.push("");
  lines.push(`**${meta.label}**`);
  lines.push("");
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Business | ${meta.business} |`);
  lines.push(`| Campus | ${meta.campus} |`);
  lines.push(`| Goal | ${meta.goal} |`);
  lines.push(`| Health | ${meta.health} |`);
  lines.push("");
  lines.push("--------------------------------");
  lines.push("");
  lines.push("## Prompt Input Summary");
  lines.push("");
  lines.push(...summarizePromptInput(input));
  lines.push("");
  lines.push("--------------------------------");
  lines.push("");
  lines.push("## Generated Recommendation");
  lines.push("");

  if (result.llmError) {
    lines.push(`_Generation failed: ${result.llmError}_`);
  } else if (parsedOutput) {
    lines.push(`**recommendation_title:** ${parsedOutput.recommendation_title}`);
    lines.push("");
    lines.push(`**reason:** ${parsedOutput.reason}`);
    lines.push("");
    lines.push(
      `**expected_impact:** ${parsedOutput.expected_impact ?? "null"}`
    );
    lines.push("");
    lines.push(`**confidence_level:** ${parsedOutput.confidence_level}`);
    lines.push("");
    lines.push(`**action_type:** ${parsedOutput.action_type}`);
  } else if (result.rawOutput) {
    lines.push("```json");
    lines.push(result.rawOutput);
    lines.push("```");
  } else {
    lines.push("_No output_");
  }

  lines.push("");
  lines.push("--------------------------------");
  lines.push("");
  lines.push("## Validator");
  lines.push("");
  lines.push(`**Result:** ${result.validationPass ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push(
    `**Validation error:** ${result.validationError ?? result.llmError ?? "—"}`
  );
  lines.push("");
  lines.push("--------------------------------");
  lines.push("");
  lines.push("## AI Judge");
  lines.push("");

  if (!result.validationPass) {
    lines.push("_Skipped — validator did not pass._");
  } else if (result.judgeError) {
    lines.push(`_Judge failed: ${result.judgeError}_`);
  } else if (result.judgeResult) {
    const j = result.judgeResult;
    lines.push(`**Total Score:** ${j.total_score} / 14`);
    lines.push("");
    lines.push(`**Pass:** ${j.pass ? "YES" : "NO"}`);
    lines.push("");
    lines.push(`**Summary:** ${j.summary}`);
    lines.push("");
    lines.push(`**Owner acceptance:** ${j.owner_acceptance_likelihood}`);
    lines.push("");
    for (const [key, label] of Object.entries(DIMENSION_LABELS)) {
      const score = j.dimensions[key as keyof typeof j.dimensions];
      lines.push(`- **${label}:** ${score}`);
    }
    lines.push("");
    lines.push("--------------------------------");
    lines.push("");
    lines.push("## Weaknesses");
    lines.push("");
    if (j.weaknesses.length === 0) {
      lines.push("_None noted._");
    } else {
      for (const w of j.weaknesses) {
        lines.push(`- ${w}`);
      }
    }
    lines.push("");
    lines.push("--------------------------------");
    lines.push("");
    lines.push("## Suggestions");
    lines.push("");
    if (j.suggestions.length === 0) {
      lines.push("_None noted._");
    } else {
      for (const s of j.suggestions) {
        lines.push(`- ${s}`);
      }
    }
  } else {
    lines.push("_No judge result._");
  }

  lines.push("");
  lines.push("--------------------------------");
  lines.push("");
  lines.push("## Timing");
  lines.push("");
  lines.push(`- **Generation:** ${formatSeconds(result.genDurationMs)}`);
  lines.push(`- **Judge:** ${formatSeconds(result.judgeDurationMs)}`);
  lines.push("");
  lines.push("## Overall");
  lines.push("");
  lines.push(`**${result.overallPass ? "PASS" : "FAIL"}**`);
  lines.push("");
  lines.push("================================================");
  lines.push("");

  return lines.join("\n");
}

function computeWeakestDimensions(
  results: ScenarioResult[]
): Array<{ dimension: string; average: number }> {
  const judged = results.filter((r) => r.judgeResult);
  if (judged.length === 0) return [];

  const sums: Record<string, number> = {};
  for (const key of Object.keys(DIMENSION_LABELS)) {
    sums[key] = 0;
  }

  for (const r of judged) {
    const d = r.judgeResult!.dimensions;
    for (const key of Object.keys(DIMENSION_LABELS)) {
      sums[key] += d[key as keyof typeof d];
    }
  }

  const count = judged.length;
  return Object.entries(sums)
    .map(([dimension, total]) => ({
      dimension: DIMENSION_LABELS[dimension],
      average: Math.round((total / count) * 10) / 10,
    }))
    .sort((a, b) => a.average - b.average);
}

const OPTIMIZATION_PATTERNS: Array<{
  title: string;
  keywords: RegExp;
  suggestedFix: string;
}> = [
  {
    title: "Normal weekday recommendations too generic",
    keywords: /generic|泛化|ChatGPT|平稳|normal weekday|无事件|缺乏校园/i,
    suggestedFix: "Add one few-shot covering normal weekdays with campus rhythm.",
  },
  {
    title: "Goal not explicitly referenced",
    keywords: /goal|目标|business_goal|goal alignment|goal_alignment/i,
    suggestedFix:
      "Strengthen Developer Prompt — require goal label in reason field.",
  },
  {
    title: "Language too consultant-like",
    keywords: /consultant|咨询|MBA|jargon|赋能|抓手|报告|language|过长/i,
    suggestedFix: "Add negative examples and tighten Writing Style guardrails.",
  },
  {
    title: "Campus context weak or missing",
    keywords: /campus|校园|campus-first|campus_first|事件|moment/i,
    suggestedFix:
      "Reinforce Campus-first in System Prompt; add few-shot for low-signal campus weeks.",
  },
  {
    title: "Action not executable within 30 minutes",
    keywords: /30.?minute|30分钟|long-term|长期|装修|招人/i,
    suggestedFix: "Add 30-minute rule examples to Developer Prompt.",
  },
  {
    title: "Owner control — passive waiting suggested",
    keywords: /owner.?control|等待|wait|passive|不可控/i,
    suggestedFix: "Strengthen Owner Control guardrail with negative examples.",
  },
  {
    title: "Multiple actions or unclear single action",
    keywords: /one.?action|多个|list|alternatives|多条/i,
    suggestedFix: "Add validator-style examples rejecting multi-action outputs.",
  },
];

function generateOptimizationSuggestions(
  results: ScenarioResult[]
): OptimizationIssue[] {
  const issueMap = new Map<string, OptimizationIssue>();

  for (const result of results) {
    if (!result.judgeResult) continue;
    const texts = [
      ...result.judgeResult.weaknesses,
      ...result.judgeResult.suggestions,
    ];

    for (const pattern of OPTIMIZATION_PATTERNS) {
      if (texts.some((t) => pattern.keywords.test(t))) {
        const existing = issueMap.get(pattern.title);
        if (existing) {
          if (!existing.scenarios.includes(result.meta.id)) {
            existing.scenarios.push(result.meta.id);
          }
        } else {
          issueMap.set(pattern.title, {
            title: pattern.title,
            scenarios: [result.meta.id],
            suggestedFix: pattern.suggestedFix,
          });
        }
      }
    }
  }

  return [...issueMap.values()].sort(
    (a, b) => b.scenarios.length - a.scenarios.length
  );
}

function renderOptimizationSection(issues: OptimizationIssue[]): string {
  const lines: string[] = [
    "# Prompt Optimization Suggestions",
    "",
    "_Grouped from AI Judge weaknesses/suggestions across scenarios — for Prompt v2._",
    "",
  ];

  if (issues.length === 0) {
    lines.push("_No recurring issues detected. Review individual scenario weaknesses above._");
    lines.push("");
    return lines.join("\n");
  }

  issues.forEach((issue, index) => {
    lines.push(`## Issue ${index + 1}`);
    lines.push("");
    lines.push(`**${issue.title}**`);
    lines.push("");
    lines.push("**Appeared in scenarios:** " + issue.scenarios.join(", "));
    lines.push("");
    lines.push(`**Suggested fix:** ${issue.suggestedFix}`);
    lines.push("");
    lines.push("--------------------------------");
    lines.push("");
  });

  return lines.join("\n");
}

function generateReport(
  results: ScenarioResult[],
  config: NonNullable<ReturnType<typeof getLlmConfig>>
): string {
  const validatorPass = results.filter((r) => r.validationPass).length;
  const validatorFail = results.length - validatorPass;
  const judged = results.filter((r) => r.judgeResult);
  const judgeScores = judged.map((r) => r.judgeResult!.total_score);
  const judgePass = judged.filter((r) => r.judgeResult!.pass).length;
  const overallPass = results.filter((r) => r.overallPass).length;

  const avgJudgeScore =
    judgeScores.length > 0
      ? Math.round(
          (judgeScores.reduce((a, b) => a + b, 0) / judgeScores.length) * 10
        ) / 10
      : 0;
  const highestScore =
    judgeScores.length > 0 ? Math.max(...judgeScores) : 0;
  const lowestScore =
    judgeScores.length > 0 ? Math.min(...judgeScores) : 0;
  const passRate =
    judged.length > 0
      ? Math.round((judgePass / judged.length) * 1000) / 10
      : 0;

  const weakest = computeWeakestDimensions(results);
  const optimizationIssues = generateOptimizationSuggestions(results);

  const avgGenLatency =
    results.reduce((sum, r) => sum + r.genDurationMs, 0) / results.length;

  const header = [
    "# CampusFin AI — Evaluation Report",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    "",
    "# AI Judge Summary",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Prompt Version | ${PROMPT_VERSION} |`,
    `| Model | ${config.model} |`,
    `| Provider | ${config.provider} |`,
    `| Scenario Count | ${results.length} |`,
    `| Validator Pass | ${validatorPass} |`,
    `| Validator Fail | ${validatorFail} |`,
    `| Judge Evaluated | ${judged.length} |`,
    `| Judge Pass (≥12/14) | ${judgePass} |`,
    `| Overall Pass (Validator + Judge) | ${overallPass} |`,
    `| Average Generation Latency | ${formatSeconds(avgGenLatency)} |`,
    "",
    "---",
    "",
  ].join("\n");

  const body = results.map(renderScenarioSection).join("\n");

  const regression = [
    "---",
    "",
    "# Regression Summary",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Prompt Version | ${PROMPT_VERSION} |`,
    `| Model | ${config.model} |`,
    `| Provider | ${config.provider} |`,
    `| Scenario Count | ${results.length} |`,
    `| Validator Pass | ${validatorPass} |`,
    `| Validator Fail | ${validatorFail} |`,
    `| Judge Average Score | ${avgJudgeScore} / 14 |`,
    `| Highest Score | ${highestScore} / 14 |`,
    `| Lowest Score | ${lowestScore} / 14 |`,
    `| Pass Rate (Judge) | ${passRate}% |`,
    "",
    "### Weakest Dimensions",
    "",
  ];

  if (weakest.length === 0) {
    regression.push("_No judge scores available._");
  } else {
    for (const w of weakest) {
      regression.push(`- **${w.dimension}:** average ${w.average}`);
    }
  }

  regression.push("");
  regression.push("### Results by Scenario");
  regression.push("");
  regression.push(
    "| Scenario | Validator | Judge Score | Judge Pass | Overall | Gen Time |"
  );
  regression.push(
    "|----------|-----------|-------------|------------|---------|----------|"
  );

  for (const r of results) {
    const score = r.judgeResult ? `${r.judgeResult.total_score}/14` : "—";
    const judgePassStr = r.judgeResult
      ? r.judgeResult.pass
        ? "YES"
        : "NO"
      : r.validationPass
        ? "ERR"
        : "SKIP";
    regression.push(
      `| ${r.meta.id} | ${r.validationPass ? "PASS" : "FAIL"} | ${score} | ${judgePassStr} | ${r.overallPass ? "PASS" : "FAIL"} | ${formatSeconds(r.genDurationMs)} |`
    );
  }

  regression.push("");
  regression.push("---");
  regression.push("");

  const optimization = renderOptimizationSection(optimizationIssues);

  return header + body + regression.join("\n") + optimization;
}

function printTerminalSummary(results: ScenarioResult[]): void {
  for (const result of results) {
    console.log("====================================");
    console.log(`Scenario ${result.meta.id}`);
    const status = result.overallPass
      ? "PASS"
      : result.validationPass && result.judgeResult
        ? `FAIL (Judge ${result.judgeResult.total_score}/14)`
        : "FAIL";
    console.log(status);
    console.log(`Time: ${formatSeconds(result.genDurationMs + result.judgeDurationMs)}`);
    if (!result.overallPass) {
      const reason =
        result.judgeError ??
        result.validationError ??
        result.llmError ??
        (result.judgeResult && !result.judgeResult.pass
          ? `Judge score ${result.judgeResult.total_score}/14`
          : "unknown");
      console.log(`Reason: ${reason}`);
    }
  }

  const validatorPass = results.filter((r) => r.validationPass).length;
  const judged = results.filter((r) => r.judgeResult);
  const judgePass = judged.filter((r) => r.judgeResult!.pass).length;
  const overallPass = results.filter((r) => r.overallPass).length;
  const avgLatency =
    results.reduce(
      (sum, r) => sum + r.genDurationMs + r.judgeDurationMs,
      0
    ) / results.length;

  console.log("====================================");
  console.log("Summary");
  console.log(`${results.length} scenarios`);
  console.log(`Validator: ${validatorPass} passed / ${results.length - validatorPass} failed`);
  console.log(`Judge: ${judgePass} passed / ${judged.length - judgePass} failed (${judged.length} evaluated)`);
  console.log(`Overall: ${overallPass} passed`);
  console.log(`Average latency ${formatSeconds(avgLatency)}`);
  console.log("");
  console.log("Report written to");
  console.log("reports/evaluation-report.md");
}

async function main(): Promise<void> {
  const config = getLlmConfig();
  if (!config) {
    console.error(
      "LLM not configured. Set LLM_API_KEY or OPENAI_API_KEY in .env.local"
    );
    process.exit(1);
  }

  const testcases = loadTestcases();
  if (testcases.length === 0) {
    console.error("No testcase JSON files found in testcases/");
    process.exit(1);
  }

  console.log(
    `[CampusFin Eval] Running ${testcases.length} scenarios — ${PROMPT_VERSION}`
  );
  console.log(
    `[CampusFin Eval] Provider: ${config.provider} | Model: ${config.model}`
  );
  console.log("[CampusFin Eval] Flow: Generate → Validator → AI Judge");
  console.log("");

  const results: ScenarioResult[] = [];

  for (const { file, input } of testcases) {
    const result = await runScenario(file, input);
    results.push(result);
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, generateReport(results, config), "utf-8");

  printTerminalSummary(results);

  const judged = results.filter((r) => r.judgeResult).length;
  const judgeExecuted = results.some(
    (r) => r.judgeResult !== null || r.judgeError !== null
  );

  if (!judgeExecuted && results.every((r) => !r.validationPass)) {
    console.warn(
      "[CampusFin Eval] Warning: AI Judge never ran — all scenarios failed validator or LLM."
    );
  }

  process.exit(
    results.every((r) => r.overallPass) && judged > 0 ? 0 : 1
  );
}

main().catch((error) => {
  console.error("[CampusFin Eval] Fatal error:", error);
  process.exit(1);
});
