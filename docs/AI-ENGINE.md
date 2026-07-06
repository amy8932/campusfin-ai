# CampusFin AI — AI Engine

**Milestone 2:** Build MVP  
**Sprint:** Sprint 4 — Supabase Schema Implementation + Daily Check-in MVP  
**Status:** Complete  
**Last updated:** 2026-07-06

---

## Table of Contents

1. [Overview](#1-overview)
2. [Role of AI in the Product](#2-role-of-ai-in-the-product)
3. [What AI Does](#3-what-ai-does)
4. [What AI Does Not Do](#4-what-ai-does-not-do)
5. [Daily Recommendation — Input Contract](#5-daily-recommendation--input-contract)
6. [Daily Recommendation — Output Contract](#6-daily-recommendation--output-contract)
7. [Fallback & Rule-Based Mode](#7-fallback--rule-based-mode)
8. [Weekly Brief — Input Contract](#8-weekly-brief--input-contract)
9. [Weekly Brief — Output Contract](#9-weekly-brief--output-contract)
10. [Generation Triggers](#10-generation-triggers)
11. [Safety & Guardrails](#11-safety--guardrails)
12. [Data Boundaries](#12-data-boundaries)
13. [Deferred (v1)](#13-deferred-v1)
14. [Open Questions](#14-open-questions)

---

# 1. Overview

CampusFin AI uses AI as a **decision support layer** — not the product surface.

AI receives structured business + campus data and returns **structured JSON**. Output renders as **Today's Priority Card** on Dashboard and **Weekly Review** — never as chat.

**Sprint 3 scope:** Input/output contracts.  
**Sprint 4 scope:** Rule-based recommendation implemented. LLM prompts and Weekly Brief generation **deferred**.

---

# 1.1 Sprint 4 — What is live

| Capability | Status | Implementation |
|------------|--------|----------------|
| Daily Recommendation (rule-based) | ✅ Live | `lib/ai/rule-based.ts` |
| Persist to `ai_recommendations` | ✅ Live | `upsert_ai_recommendation` RPC after Daily Check-in |
| LLM API (OpenAI / Claude) | ❌ Not implemented | — |
| Weekly Brief generation | ❌ Deferred | Schema only in `weekly_briefs` table |
| AI Chat | ❌ Never | — |

**Product naming:** User-facing label is **Daily Check-in** (今日经营打卡), not "Record Today". Route remains `/dashboard/record`.

---

# 2. Role of AI in the Product

| AI is | AI is not |
|-------|-----------|
| A recommendation engine | A chatbot |
| One daily priority generator | A report writer |
| Campus-aware | Generic SMB advisor |
| Structured JSON in → structured JSON out | Free-form conversation |
| Invisible infrastructure | The primary UI |

**Formula:**

```
Today's Priority = f(Campus Context, Business Health, Business Goal, Daily Check-in, Recent Trend)
```

---

# 3. What AI Does

| Capability | Output | Frequency |
|------------|--------|-----------|
| **Daily Recommendation** | One `ai_recommendations` row | Once per business per day, after Daily Check-in |
| **Weekly Brief** | One `weekly_briefs` row | Once per business per week |
| **Rule-based fallback** | Same schema, `source = rule_based` | When AI unavailable or check-in missing |

---

# 4. What AI Does Not Do

| Excluded | Reason |
|----------|--------|
| Open-ended chat | Wrong product model |
| Multiple daily recommendations | One action per day — owner is not a project manager |
| Long-form reports | Dashboard is not a document reader |
| Financial advice / lending | CampusFin is operating assistant, not financial advisor |
| Inventory optimization | Out of v1 scope |
| Multi-language output | v1 English primary; ZH labels in UI layer |
| Real-time streaming | Card appears complete — no typing animation |

---

# 5. Daily Recommendation — Input Contract

Generated **after** owner completes **Daily Check-in** for today. Input is assembled server-side into a single JSON payload.

**Sprint 4:** Rule-based engine in `lib/ai/rule-based.ts` uses a subset of this input (campus events, goal, today's check-in).

## Input schema

```json
{
  "meta": {
    "business_id": "uuid",
    "recommendation_date": "2026-07-06",
    "generated_at": "2026-07-06T14:30:00Z"
  },
  "campus_context": {
    "campus_name": "State University",
    "campus_moment": "exam_week",
    "campus_moment_label": "Exam Week",
    "events_today": [
      {
        "title": "Career Fair",
        "event_type": "career",
        "traffic_impact": "high"
      }
    ],
    "events_upcoming_7d": [
      {
        "title": "Career Fair",
        "starts_on": "2026-07-08",
        "traffic_impact": "high"
      }
    ],
    "traffic_forecast": "high",
    "weather_signal": null,
    "campus_headline": "Finals week starts Monday — expect busier evenings"
  },
  "business_health": {
    "health_label": "strong_day",
    "revenue_today": 842.00,
    "revenue_change_pct_vs_last_week": 12.0,
    "customer_count_today": 67,
    "customer_change_pct_vs_7d_avg": 8.0,
    "cash_flow_signal": "healthy",
    "days_since_last_checkin": 0
  },
  "business_goal": {
    "goal": "increase_revenue",
    "goal_label": "Increase revenue"
  },
  "daily_checkin": {
    "checkin_date": "2026-07-06",
    "revenue": 842.00,
    "customer_count": 67,
    "note": null
  },
  "recent_trend": {
    "checkins_last_7d": [
      { "date": "2026-06-30", "revenue": 720.00, "customer_count": 58 },
      { "date": "2026-07-01", "revenue": 680.00, "customer_count": 55 }
    ],
    "revenue_7d_total": 5240.00,
    "revenue_trend_direction": "up",
    "best_weekdays": ["thursday", "friday", "saturday"],
    "checkin_streak_days": 5,
    "missing_days_last_7": 0
  }
}
```

## Input field requirements

| Section | Required? | Source |
|---------|-----------|--------|
| `meta` | ✅ | System |
| `campus_context` | ✅ | `businesses` + `campus_events` + rules |
| `campus_context.events_today` | ❌ | May be empty array |
| `campus_context.weather_signal` | ❌ | Omit or null |
| `business_health` | ✅ | Computed from `daily_checkins` |
| `business_goal` | ✅ | `businesses.business_goal` |
| `daily_checkin` | ✅ | Today's `daily_checkins` row — **AI not invoked without this** |
| `recent_trend` | ✅ | Last 7 `daily_checkins` rows (may be partial) |

## Input assembly rules

1. **No check-in today → do not call AI.** Zone 3 shows Daily Check-in invitation.
2. `campus_context` always populated — even if `events_today` is empty (season fallback).
3. `recent_trend.checkins_last_7d` may contain 1–7 entries — AI must handle partial history.
4. Full input stored in `ai_recommendations.input_snapshot` for debugging.

---

# 6. Daily Recommendation — Output Contract

## Output schema

AI must return **exactly one JSON object**. No markdown. No array of recommendations. No wrapper text.

```json
{
  "recommendation_title": "Extend hours to 8pm on Thursday",
  "reason": "Career fair at 2pm plus revenue up 12% this week. Your goal is to increase revenue.",
  "expected_impact": "+$120–180 estimated revenue",
  "confidence_level": "medium",
  "action_type": "extend_hours",
  "fallback_message": null
}
```

## Output field definitions

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `recommendation_title` | `string` | ✅ | Max 80 chars. Must start with action verb. One specific action. |
| `reason` | `string` | ✅ | Max 280 chars. Must reference campus context + data + business goal. |
| `expected_impact` | `string` | ❌ | Max 100 chars. Plain language estimate. Null if unknowable. |
| `confidence_level` | `enum` | ✅ | `high` \| `medium` \| `low` |
| `action_type` | `enum` | ✅ | See allowed values below |
| `fallback_message` | `string` | ❌ | Null for AI output. Populated only for `rule_based` source. |

## `action_type` allowed values

```
extend_hours | adjust_staffing | run_promotion | prepare_inventory
| improve_service | reduce_costs | capture_traffic | other
```

## Output validation rules

| Rule | Enforcement |
|------|-------------|
| Exactly one recommendation | Reject array responses; take first or fail to fallback |
| No chat content | Reject if response contains `"message"`, `"conversation"`, or `choices[]` |
| No financial advice | Reject if mentions loans, credit, investment, tax |
| Title is actionable | Must contain verb: extend, add, reduce, prepare, launch, etc. |
| Reason cites campus | Must contain reference to campus event, moment, or traffic |
| Reason cites goal | Must reference `business_goal` label or intent |

## Mapping to database

| Output field | DB column |
|--------------|-----------|
| `recommendation_title` | `ai_recommendations.recommendation_title` |
| `reason` | `ai_recommendations.reason` |
| `expected_impact` | `ai_recommendations.expected_impact` |
| `confidence_level` | `ai_recommendations.confidence_level` |
| `action_type` | `ai_recommendations.action_type` |
| `fallback_message` | `ai_recommendations.fallback_message` |
| — | `ai_recommendations.source` = `'ai'` |
| — | `ai_recommendations.recommendation_date` = today |

## Mapping to UI (Zone 3)

| Output field | UI element |
|--------------|------------|
| `recommendation_title` | Card title with ★ |
| `reason` | "Why" section |
| `expected_impact` | "Expected impact" section |
| `confidence_level` | Not shown to user in v1 — internal quality signal |
| `action_type` | Not shown — used for analytics and future filtering |
| Primary button | Always **"Got it"** — not derived from AI |

---

# 7. Fallback & Rule-Based Mode

When AI is unavailable, times out, or returns invalid JSON → generate `rule_based` recommendation.

## Fallback output schema

Same fields. `fallback_message` populated. `source = rule_based`.

```json
{
  "recommendation_title": "Prepare for career fair traffic on Thursday",
  "reason": "Career fair this Thursday at State University. Your goal is to increase revenue.",
  "expected_impact": null,
  "confidence_level": "medium",
  "action_type": "capture_traffic",
  "fallback_message": "Based on campus calendar. Record more check-ins for personalized tips."
}
```

## Rule-based priority logic (v1)

| Condition | Recommendation pattern |
|-----------|------------------------|
| High-traffic campus event within 3 days | `capture_traffic` — prepare for event |
| `health_label = needs_attention` | `reduce_costs` or `run_promotion` based on goal |
| `business_goal = improve_repeat_rate` + strong day | `improve_service` — loyalty focus |
| Exam week active | `extend_hours` or `prepare_inventory` |
| No campus events | Season-based generic tip |

**User experience:** Same card UI. No "AI error" message. `fallback_message` is internal — not shown unless debugging.

---

# 8. Weekly Brief — Input Contract

Generated once per week — typically Sunday night or first visit to Weekly Review in new week.

## Input schema

```json
{
  "meta": {
    "business_id": "uuid",
    "week_start": "2026-06-30",
    "week_end": "2026-07-06",
    "generated_at": "2026-07-06T22:00:00Z"
  },
  "campus_context": {
    "campus_name": "State University",
    "events_this_week": [
      {
        "title": "Career Fair",
        "starts_on": "2026-07-03",
        "event_type": "career",
        "traffic_impact": "high"
      }
    ],
    "events_next_week": [
      {
        "title": "Finals Week",
        "starts_on": "2026-07-08",
        "event_type": "season",
        "traffic_impact": "high"
      }
    ],
    "campus_moment": "exam_week"
  },
  "business_health": {
    "business_goal": "increase_revenue",
    "checkins_this_week": 6,
    "missing_days": 1,
    "total_revenue": 5240.00,
    "revenue_change_pct_vs_prior_week": 12.5,
    "avg_daily_customers": 62,
    "best_days": ["thursday", "friday", "saturday"],
    "worst_day": { "date": "2026-07-02", "revenue": 480.00 },
    "health_label": "strong_week",
    "cash_flow_signal": "healthy",
    "daily_checkins": [
      { "date": "2026-06-30", "revenue": 720.00, "customer_count": 58 }
    ]
  },
  "recent_recommendations": [
    {
      "date": "2026-07-03",
      "recommendation_title": "Extend hours to 8pm on Thursday",
      "acknowledged": true
    }
  ],
  "prior_week_brief": {
    "next_week_priority": "Capture career fair traffic",
    "confirmed": true
  }
}
```

## Input requirements

| Section | Required? | Minimum data |
|---------|-----------|--------------|
| `campus_context.events_this_week` | ❌ | May be empty |
| `campus_context.events_next_week` | ❌ | May be empty |
| `business_health.daily_checkins` | ✅ | ≥ 3 check-ins for quality brief; generate with fewer but flag low confidence |
| `recent_recommendations` | ❌ | Improves continuity |
| `prior_week_brief` | ❌ | First week has no prior |

---

# 9. Weekly Brief — Output Contract

Weekly Brief is **not a generic report**. It answers three questions:

1. What happened on campus this week?
2. How did my shop perform?
3. What is the most important focus for next week?

## Output schema

```json
{
  "week_summary": "Strong week with 12% revenue growth. Career fair Thursday drove peak traffic.",
  "campus_recap": {
    "headline": "Career fair and pre-finals rush shaped the week",
    "events": [
      {
        "title": "Career Fair",
        "date": "2026-07-03",
        "impact": "high",
        "note": "Drove Thursday lunch peak"
      }
    ],
    "campus_moment": "exam_week"
  },
  "business_health_summary": {
    "total_revenue": 5240.00,
    "revenue_change_pct": 12.5,
    "avg_daily_customers": 62,
    "best_days": ["thursday", "friday", "saturday"],
    "health_label": "strong_week",
    "goal_progress_pct": 68
  },
  "next_week_priority": "Stock up for finals week — extend evening hours Mon–Wed",
  "risk_notes": [
    {
      "type": "traffic",
      "message": "Tuesday historically dips — plan lighter staffing"
    }
  ],
  "suggested_goal_adjustment": null
}
```

## Output field definitions

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `week_summary` | `string` | ✅ | Max 400 chars. One paragraph. Campus + business combined. |
| `campus_recap` | `object` | ✅ | See sub-schema. Campus-first — recap leads with campus. |
| `business_health_summary` | `object` | ✅ | See sub-schema. Numbers + labels. |
| `next_week_priority` | `string` | ✅ | Max 120 chars. **One** focus for next week. Actionable. |
| `risk_notes` | `array` | ❌ | Max 3 items. Operational risks only — not financial. Empty array allowed. |
| `suggested_goal_adjustment` | `string` | ❌ | Null if current goal still appropriate. Max 200 chars. |

## `campus_recap` sub-schema

| Field | Type | Required |
|-------|------|----------|
| `headline` | `string` | ✅ |
| `events` | `array` | ❌ |
| `events[].title` | `string` | ✅ |
| `events[].date` | `date` | ✅ |
| `events[].impact` | `enum` | ✅ |
| `events[].note` | `string` | ❌ |
| `campus_moment` | `string` | ❌ |

## `business_health_summary` sub-schema

| Field | Type | Required |
|-------|------|----------|
| `total_revenue` | `number` | ✅ |
| `revenue_change_pct` | `number` | ✅ |
| `avg_daily_customers` | `number` | ✅ |
| `best_days` | `string[]` | ❌ |
| `health_label` | `enum` | ✅ |
| `goal_progress_pct` | `number` | ❌ |

## `risk_notes` item schema

| Field | Type | Allowed `type` values |
|-------|------|----------------------|
| `type` | `enum` | `traffic` \| `cash_flow` \| `checkin_gap` \| `event_miss` \| `other` |
| `message` | `string` | Max 150 chars. Informational — not financial advice. |

## `suggested_goal_adjustment` rules

- Only suggest if data strongly indicates current goal mismatch for 2+ weeks.
- Format: *"Consider shifting focus to improve cash flow — revenue is strong but mid-week dips are widening."*
- Maps to `business_goal` enum values — not free-form new goals.
- Null by default — **most weeks should not suggest goal changes.**

## Mapping to database

| Output field | DB column |
|--------------|-----------|
| `week_summary` | `weekly_briefs.week_summary` |
| `campus_recap` | `weekly_briefs.campus_recap` (jsonb) |
| `business_health_summary` | `weekly_briefs.business_health_summary` (jsonb) |
| `next_week_priority` | `weekly_briefs.next_week_priority` |
| `risk_notes` | `weekly_briefs.risk_notes` (jsonb) |
| `suggested_goal_adjustment` | `weekly_briefs.suggested_goal_adjustment` |

## Mapping to UI (Weekly Review)

| Output field | UI section |
|--------------|------------|
| `week_summary` | Top narrative |
| `campus_recap` | "Campus this week" zone — Layer 1 logic |
| `business_health_summary` | "Your week" zone — Layer 2 logic |
| `next_week_priority` | Primary action — confirm button |
| `risk_notes` | Subtle risk strip — max 1 shown on card |
| `suggested_goal_adjustment` | Optional footnote — link to Settings |

---

# 10. Generation Triggers

| Output | Trigger | Idempotency |
|--------|---------|-------------|
| Daily Recommendation | `daily_checkins` INSERT for today | One row per `(business_id, recommendation_date)`. Regenerate only if check-in UPDATE (TBD). |
| Weekly Brief | Cron Sunday 22:00 local OR first `/review/weekly` visit in new week | One row per `(business_id, week_start)` |

## Generation flow (daily)

```
Owner submits Daily Check-in
        │
        ▼
Insert daily_checkins
        │
        ▼
Assemble input JSON (§5)
        │
        ▼
Call AI API (or rule-based)
        │
        ▼
Validate output (§6)
        │
   ┌────┴────┐
   │         │
 valid    invalid
   │         │
   ▼         ▼
Insert    Rule-based
ai_rec...  fallback
source=ai  source=rule_based
        │
        ▼
Dashboard Zone 3 renders card
```

---

# 11. Safety & Guardrails

| Guardrail | Rule |
|-----------|------|
| No financial advice | Block output mentioning loans, credit, APR, investment |
| No medical / legal | Out of scope — reject |
| No guaranteed returns | `expected_impact` must use "estimated" language |
| One recommendation | Truncate or reject multi-item responses |
| Campus required in reason | Reject if reason has no campus reference |
| Goal required in reason | Reject if reason has no goal alignment |
| Max retries | 1 retry on invalid JSON → fallback |
| PII in output | Never include customer names or payment details |

---

# 12. Data Boundaries

AI engine v1 does **not** process:

| Data type | Status |
|-----------|--------|
| Bank transactions | ❌ |
| POS line items | ❌ |
| Employee schedules | ❌ |
| Inventory levels | ❌ |
| Customer PII / CRM | ❌ |
| Credit scores | ❌ |
| Tax data | ❌ |

AI engine v1 **only** processes:

- `campus_events` + season rules
- `daily_checkins` (revenue, customer_count, note)
- `businesses` (type, goal, campus_name)
- Computed health metrics
- Prior recommendations and briefs

> CampusFin provides **operational suggestions** — not financial decisions. All outputs include implicit disclaimer via informational framing.

---

# 13. Deferred (v1)

| Capability | When |
|------------|------|
| Prompt templates | Sprint 5+ |
| LLM provider selection | Implementation sprint |
| A/B testing recommendations | Post-launch |
| Owner feedback on recommendations | `recommendation_feedback` table |
| Multi-language AI output | i18n phase |
| Streaming generation | Not needed — card is instant |

---

# 14. Open Questions

| # | Question | Owner |
|---|----------|-------|
| 1 | LLM provider: OpenAI / Anthropic / other? | Founder + Eng |
| 2 | Regenerate recommendation on check-in edit? | Product |
| 3 | Show `confidence_level` to user in future? | Product |
| 4 | Weekly brief auto-generate vs on-demand? | Eng |
| 5 | Prompt versioning strategy | Eng |

---

## Cross-reference

- Database schema: `docs/DATABASE.md`
- Dashboard zone mapping: `docs/DATABASE.md` §5
- Dashboard experience: `docs/DESIGN-SYSTEM.md`
- Sprint Summary: `docs/DATABASE.md` §Sprint Summary

---

**Sprint 4 — Rule-based engine live. LLM + Weekly Brief deferred.**

---

# Sprint 5b.1 Implementation Note

## What changed

| Item | Status |
|------|--------|
| **OpenAI-compatible provider adapter** | ✅ `lib/ai/llm.ts` uses fetch to `{baseUrl}/chat/completions` |
| **OpenRouter support** | ✅ Default recommended provider for CN dev |
| **OpenAI official API** | ✅ Still compatible via env fallback |
| **Dashboard / DB / fallback** | ✅ Unchanged |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ENABLE_LLM` | `true` to enable LLM path; `false` → rule-based only |
| `LLM_PROVIDER` | e.g. `openrouter` — selects default base URL when `LLM_BASE_URL` unset |
| `LLM_API_KEY` | Primary API key (preferred over `OPENAI_API_KEY`) |
| `LLM_MODEL` | Primary model (preferred over `OPENAI_MODEL`); default `openai/gpt-4o-mini` |
| `LLM_BASE_URL` | API base; default `https://openrouter.ai/api/v1` when provider is openrouter |
| `OPENAI_API_KEY` | Legacy fallback key |
| `OPENAI_MODEL` | Legacy fallback model |

## Resolution priority

1. API key: `LLM_API_KEY` → `OPENAI_API_KEY`
2. Model: `LLM_MODEL` → `OPENAI_MODEL` → `openai/gpt-4o-mini`
3. Base URL: `LLM_BASE_URL` → openrouter default if `LLM_PROVIDER=openrouter` → `https://api.openai.com/v1`

## OpenRouter headers

When provider is OpenRouter, requests include:

- `Authorization: Bearer {key}`
- `HTTP-Referer: {NEXT_PUBLIC_SITE_URL}`
- `X-Title: CampusFin AI`

## Unchanged behavior

- `generateRecommendation(input)` public interface unchanged
- 8s timeout; errors throw → adapter retries once → rule-based fallback
- LLM success → `source = ai`; failure → `source = rule_based`
- No API keys in logs
