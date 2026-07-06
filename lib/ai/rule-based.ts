import type {
  ActionType,
  Business,
  BusinessGoal,
  CampusEvent,
  ConfidenceLevel,
  DailyCheckin,
} from "@/types/database";
import { BUSINESS_GOAL_LABELS_EN } from "@/lib/health";
import type { CampusContext } from "@/lib/campus/context";

export interface RuleBasedRecommendation {
  recommendation_title: string;
  reason: string;
  expected_impact: string | null;
  confidence_level: ConfidenceLevel;
  action_type: ActionType;
  fallback_message: string | null;
  source: "rule_based";
}

function hasHighTrafficEvent(events: CampusEvent[], todayStr: string): boolean {
  const today = new Date(todayStr + "T12:00:00");
  return events.some((e) => {
    if (e.traffic_impact !== "high") return false;
    const start = new Date(e.starts_on + "T12:00:00");
    const diff = (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });
}

function goalBasedRecommendation(
  goal: BusinessGoal,
  campusName: string
): Pick<RuleBasedRecommendation, "recommendation_title" | "action_type" | "reason"> {
  const goalLabel = BUSINESS_GOAL_LABELS_EN[goal];

  switch (goal) {
    case "increase_revenue":
      return {
        recommendation_title: "Run a limited-time promotion today",
        action_type: "run_promotion",
        reason: `Your goal is ${goalLabel}. A small campus-focused offer can lift today's revenue at ${campusName}.`,
      };
    case "improve_repeat_rate":
      return {
        recommendation_title: "Reward returning customers today",
        action_type: "improve_service",
        reason: `Your goal is ${goalLabel}. A simple loyalty gesture helps regulars feel recognized.`,
      };
    case "improve_cash_flow":
      return {
        recommendation_title: "Review today's variable costs",
        action_type: "reduce_costs",
        reason: `Your goal is ${goalLabel}. Trim non-essential spend on slower hours to protect cash flow.`,
      };
    case "improve_satisfaction":
      return {
        recommendation_title: "Focus on service speed during peak hours",
        action_type: "improve_service",
        reason: `Your goal is ${goalLabel}. Faster service during busy periods improves customer experience.`,
      };
  }
}

export function generateRuleBasedRecommendation(input: {
  business: Business;
  campusContext: CampusContext;
  campusEvents: CampusEvent[];
  todayCheckin: DailyCheckin | null;
  todayStr: string;
}): RuleBasedRecommendation {
  const { business, campusContext, campusEvents, todayCheckin, todayStr } = input;
  const goalLabel = BUSINESS_GOAL_LABELS_EN[business.business_goal];

  if (hasHighTrafficEvent(campusEvents, todayStr)) {
    const event = campusEvents.find(
      (e) =>
        e.traffic_impact === "high" &&
        (e.starts_on >= todayStr ||
          (e.starts_on <= todayStr &&
            (e.ends_on ?? e.starts_on) >= todayStr))
    );
    return {
      recommendation_title: "Prepare for upcoming campus traffic",
      reason: `${event?.title ?? "Campus event"} near ${business.campus_name}. Your goal is ${goalLabel}.`,
      expected_impact: todayCheckin
        ? "Could add ~10–15% more customers during peak hours"
        : null,
      confidence_level: "medium",
      action_type: "capture_traffic",
      fallback_message:
        "Based on campus calendar. Complete more Daily Check-ins for personalized tips.",
      source: "rule_based",
    };
  }

  if (campusContext.campusMoment?.includes("考试")) {
    return {
      recommendation_title: "Extend evening hours during exam week",
      reason: `Exam period at ${business.campus_name} + your goal is ${goalLabel}. Students stay on campus later.`,
      expected_impact: "Could add ~$80–150 in evening revenue",
      confidence_level: "medium",
      action_type: "extend_hours",
      fallback_message: null,
      source: "rule_based",
    };
  }

  const goalRec = goalBasedRecommendation(
    business.business_goal,
    business.campus_name
  );

  return {
    ...goalRec,
    expected_impact: todayCheckin ? "Estimated modest improvement this week" : null,
    confidence_level: "low",
    fallback_message:
      "Based on your business goal and campus context. Record more check-ins for sharper tips.",
    source: "rule_based",
  };
}
