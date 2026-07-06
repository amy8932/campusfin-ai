import type { BusinessGoal } from "@/types/database";

export const BUSINESS_GOAL_LABELS: Record<BusinessGoal, string> = {
  increase_revenue: "提升营业额",
  improve_repeat_rate: "提高复购率",
  improve_cash_flow: "改善现金流",
  improve_satisfaction: "提升用户评价",
};

export const BUSINESS_GOAL_LABELS_EN: Record<BusinessGoal, string> = {
  increase_revenue: "Increase revenue",
  improve_repeat_rate: "Improve repeat rate",
  improve_cash_flow: "Improve cash flow",
  improve_satisfaction: "Improve customer satisfaction",
};

export type HealthLabel = "strong_day" | "normal" | "needs_attention" | "no_data";

export function computeHealthLabel(
  todayRevenue: number | null,
  avgRevenue7d: number | null
): HealthLabel {
  if (todayRevenue === null || avgRevenue7d === null || avgRevenue7d === 0) {
    return todayRevenue !== null ? "normal" : "no_data";
  }
  const ratio = todayRevenue / avgRevenue7d;
  if (ratio >= 1.1) return "strong_day";
  if (ratio < 0.85) return "needs_attention";
  return "normal";
}

export const HEALTH_LABEL_DISPLAY: Record<
  Exclude<HealthLabel, "no_data">,
  { en: string; zh: string }
> = {
  strong_day: { en: "Strong day", zh: "经营良好" },
  normal: { en: "Normal", zh: "正常" },
  needs_attention: { en: "Needs attention", zh: "需要关注" },
};

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
