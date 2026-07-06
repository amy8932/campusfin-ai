export type BusinessType =
  | "coffee_shop"
  | "bubble_tea"
  | "restaurant"
  | "print_shop"
  | "nail_salon"
  | "hair_salon"
  | "other";

export type BusinessGoal =
  | "increase_revenue"
  | "improve_repeat_rate"
  | "improve_cash_flow"
  | "improve_satisfaction";

export type CampusEventType =
  | "academic"
  | "career"
  | "sports"
  | "cultural"
  | "holiday"
  | "weather"
  | "season";

export type TrafficImpact = "high" | "normal" | "low";

export type ConfidenceLevel = "high" | "medium" | "low";

export type ActionType =
  | "extend_hours"
  | "adjust_staffing"
  | "prepare_inventory"
  | "reduce_inventory"
  | "run_promotion"
  | "capture_traffic"
  | "improve_service"
  | "reduce_costs"
  | "highlight_signature_product"
  | "adjust_menu"
  | "optimize_queue"
  | "push_takeaway"
  | "increase_display"
  | "other";

export type RecommendationSource = "ai" | "rule_based";

export type FeedbackHelpfulness = "good" | "neutral" | "bad";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  business_type: BusinessType;
  campus_name: string;
  business_goal: BusinessGoal;
  business_timezone: string;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckin {
  id: string;
  business_id: string;
  checkin_date: string;
  revenue: number;
  customer_count: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampusEvent {
  id: string;
  campus_name: string;
  title: string;
  event_type: CampusEventType;
  starts_on: string;
  ends_on: string | null;
  traffic_impact: TrafficImpact;
  description: string | null;
  source: "seed" | "manual" | "api";
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  business_id: string;
  recommendation_date: string;
  recommendation_title: string;
  reason: string;
  expected_impact: string | null;
  confidence_level: ConfidenceLevel;
  action_type: ActionType;
  fallback_message: string | null;
  source: RecommendationSource;
  acknowledged_at: string | null;
  input_snapshot: Record<string, unknown> | null;
  created_at: string;
}

export interface RecommendationFeedback {
  id: string;
  recommendation_id: string;
  business_id: string;
  feedback_date: string;
  executed: boolean;
  helpfulness: FeedbackHelpfulness | null;
  optional_note: string | null;
  created_at: string;
}

export interface WeeklyBrief {
  id: string;
  business_id: string;
  week_start: string;
  week_end: string;
  week_summary: string;
  campus_recap: Record<string, unknown>;
  business_health_summary: Record<string, unknown>;
  next_week_priority: string;
  risk_notes: Record<string, unknown>[] | null;
  suggested_goal_adjustment: string | null;
  confirmed_at: string | null;
  source: RecommendationSource;
  input_snapshot: Record<string, unknown> | null;
  created_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      businesses: {
        Row: Business;
        Insert: Omit<Business, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Business>;
      };
      daily_checkins: {
        Row: DailyCheckin;
        Insert: Omit<DailyCheckin, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DailyCheckin>;
      };
      campus_events: {
        Row: CampusEvent;
        Insert: Omit<CampusEvent, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<CampusEvent>;
      };
      ai_recommendations: {
        Row: AIRecommendation;
        Insert: Omit<AIRecommendation, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AIRecommendation>;
      };
      recommendation_feedback: {
        Row: RecommendationFeedback;
        Insert: Omit<RecommendationFeedback, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<RecommendationFeedback>;
      };
      weekly_briefs: {
        Row: WeeklyBrief;
        Insert: Omit<WeeklyBrief, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<WeeklyBrief>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      upsert_ai_recommendation: {
        Args: {
          p_business_id: string;
          p_recommendation_date: string;
          p_recommendation_title: string;
          p_reason: string;
          p_expected_impact: string | null;
          p_confidence_level: ConfidenceLevel;
          p_action_type: ActionType;
          p_fallback_message: string | null;
          p_source: RecommendationSource;
          p_input_snapshot?: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      business_type: BusinessType;
      business_goal: BusinessGoal;
      campus_event_type: CampusEventType;
      traffic_impact: TrafficImpact;
      confidence_level: ConfidenceLevel;
      action_type: ActionType;
      recommendation_source: RecommendationSource;
      feedback_helpfulness: FeedbackHelpfulness;
    };
  };
}
