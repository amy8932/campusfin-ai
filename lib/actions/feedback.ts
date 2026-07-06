"use server";

import { createClient } from "@/lib/supabase/server";
import type { FeedbackHelpfulness } from "@/types/database";

export interface SubmitFeedbackResult {
  error?: string;
}

export async function submitRecommendationFeedback(input: {
  recommendation_id: string;
  executed: boolean;
  helpfulness: FeedbackHelpfulness | null;
  optional_note?: string | null;
}): Promise<SubmitFeedbackResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to continue." };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return { error: "Business not found." };
  }

  const { data: recommendation } = await supabase
    .from("ai_recommendations")
    .select("id, business_id, recommendation_date")
    .eq("id", input.recommendation_id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!recommendation) {
    return { error: "Recommendation not found." };
  }

  if (input.executed && !input.helpfulness) {
    return { error: "Please rate whether the suggestion was helpful." };
  }

  const note = input.optional_note?.trim() || null;
  if (note && note.length > 140) {
    return { error: "Note must be 140 characters or less." };
  }

  const { data: existing } = await supabase
    .from("recommendation_feedback")
    .select("id")
    .eq("recommendation_id", input.recommendation_id)
    .maybeSingle();

  if (existing) {
    return { error: "Feedback already submitted." };
  }

  const { error } = await supabase.from("recommendation_feedback").insert({
    recommendation_id: input.recommendation_id,
    business_id: business.id,
    feedback_date: recommendation.recommendation_date,
    executed: input.executed,
    helpfulness: input.helpfulness,
    optional_note: note,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}
