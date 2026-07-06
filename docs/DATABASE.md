# CampusFin AI — Database

**Milestone 2:** Build MVP  
**Sprint:** Sprint 4 — Supabase Schema Implementation + Daily Check-in MVP  
**Status:** Complete  
**Last updated:** 2026-07-06

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology](#2-technology)
3. [Entity Relationship Diagram](#3-entity-relationship-diagram)
4. [Table Definitions](#4-table-definitions)
5. [Dashboard Data Mapping](#5-dashboard-data-mapping)
6. [Computed Metrics](#6-computed-metrics)
7. [Row Level Security](#7-row-level-security)
8. [Migrations Strategy](#8-migrations-strategy)
9. [Data Boundaries (v1)](#9-data-boundaries-v1)
10. [Deferred Fields & Tables](#10-deferred-fields--tables)
11. [Open Questions](#11-open-questions)
12. [Sprint Summary](#sprint-summary)
13. [Sprint 4 — Implementation Status](#sprint-4--implementation-status)

---

# 1. Overview

This document defines the **v1 database schema** for CampusFin AI.

**Design goals:**

- Support Dashboard four zones: Campus → Health → Action → History
- Store **Daily Check-in** (今日经营打卡) as the sole business data input for v1
- Persist AI recommendations and weekly briefs as structured records
- Single-owner, single-business per account for v1
- Campus-aware, not generic BI

**Product language note:** Users see **Daily Check-in** (今日经营打卡). Route may remain `/dashboard/record` — database table is `daily_checkins`.

---

# 2. Technology

| Layer | Choice |
|-------|--------|
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase `auth.users` |
| App schema | `public` |
| ID type | `uuid` (gen_random_uuid()) |
| Timestamps | `timestamptz` with `now()` default |
| Enums | Postgres `enum` types for fixed vocabularies |

---

# 3. Entity Relationship Diagram

```
auth.users
    │
    │ 1:1
    ▼
profiles ─────────────────────────────────────────┐
    │                                              │
    │ 1:N (v1 enforced: 1 business per owner)      │
    ▼                                              │
businesses ◄──────────────────────────────────────┤
    │                                              │
    ├── 1:N ──► daily_checkins                     │
    ├── 1:N ──► ai_recommendations                 │
    └── 1:N ──► weekly_briefs                      │
                                                   │
campus_events ◄── linked by campus_name ──────────┘
    (shared per campus, not per business)
```

**Relationship rules (v1):**

| Relationship | Cardinality | Enforcement |
|--------------|-------------|-------------|
| `profiles` ↔ `auth.users` | 1:1 | PK = `auth.users.id` |
| `profiles` → `businesses` | 1:N | App logic limits to 1 in v1 |
| `businesses` → `daily_checkins` | 1:N | Unique `(business_id, checkin_date)` |
| `businesses` → `ai_recommendations` | 1:N | Unique `(business_id, recommendation_date)` |
| `businesses` → `weekly_briefs` | 1:N | Unique `(business_id, week_start)` |
| `campus_events` → campus | N:1 | `campus_name` text match (no `campuses` table in v1) |

---

# 4. Table Definitions

---

## 4.1 `profiles`

### Purpose

Extends `auth.users` with owner identity. One row per registered user.

### Why this table exists

Supabase Auth stores credentials only. CampusFin needs display name and profile metadata separate from business data.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | PK. FK → `auth.users(id)` ON DELETE CASCADE |
| `full_name` | `text` | ❌ | Owner display name |
| `avatar_url` | `text` | ❌ | Profile image URL |
| `created_at` | `timestamptz` | ✅ | Default `now()` |
| `updated_at` | `timestamptz` | ✅ | Default `now()` |

### Relationships

- `id` → `auth.users.id`
- Referenced by `businesses.owner_id`

### RLS

| Policy | Rule |
|--------|------|
| SELECT | `auth.uid() = id` |
| UPDATE | `auth.uid() = id` |
| INSERT | Via trigger on `auth.users` create |

### Deferred (v1)

| Field | Reason |
|-------|--------|
| `phone` | Not needed for MVP |
| `locale` | Single language v1 |
| `notification_preferences` | Email reminders are Should Have |

---

## 4.2 `businesses`

### Purpose

Stores shop identity, campus affiliation, and strategic **Business Goal**. The anchor entity for all operational data.

### Why this table exists

Daily Check-ins, AI recommendations, and weekly briefs all belong to a business — not directly to a user. Separating owner (`profiles`) from shop (`businesses`) preserves future multi-store expansion without v1 complexity.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | PK. Default `gen_random_uuid()` |
| `owner_id` | `uuid` | ✅ | FK → `profiles(id)` ON DELETE CASCADE |
| `name` | `text` | ✅ | Shop name, e.g. "Sunrise Coffee" |
| `business_type` | `business_type` enum | ✅ | See enum below |
| `campus_name` | `text` | ✅ | Campus or area name, e.g. "State University" |
| `business_goal` | `business_goal` enum | ✅ | Strategic lens for AI output |
| `business_timezone` | `text` | ✅ | IANA timezone. Default `'Asia/Shanghai'`. See [Timezone](#timezone) |
| `created_at` | `timestamptz` | ✅ | Default `now()` |
| `updated_at` | `timestamptz` | ✅ | Default `now()` |

### Enums

```sql
-- business_type
'coffee_shop' | 'bubble_tea' | 'restaurant' | 'print_shop'
| 'nail_salon' | 'hair_salon' | 'other'

-- business_goal
'increase_revenue' | 'improve_repeat_rate' | 'improve_cash_flow'
| 'improve_satisfaction'
```

### Relationships

- `owner_id` → `profiles.id`
- Parent of `daily_checkins`, `ai_recommendations`, `weekly_briefs`
- Linked to `campus_events` via `campus_name` (soft reference, no FK)

### RLS

| Policy | Rule |
|--------|------|
| SELECT | `owner_id = auth.uid()` |
| INSERT | `owner_id = auth.uid()` |
| UPDATE | `owner_id = auth.uid()` |
| DELETE | `owner_id = auth.uid()` |

### Deferred (v1)

| Field | Reason |
|-------|--------|
| `operating_hours` | Not used in Dashboard v1 |
| `address` | Campus name sufficient for MVP |
| `campus_id` | No `campuses` master table yet — text match only |
| `logo_url` | Settings enhancement |
| `currency` | Default CNY display in UI; multi-currency later |

### Timezone

`checkin_date` is resolved in **`businesses.business_timezone`**, not UTC.

| Rule | Detail |
|------|--------|
| Default | `Asia/Shanghai` for all new businesses in v1 |
| "Today" | `getBusinessDateString(business_timezone)` in app layer |
| Future | Editable in Business Profile (Settings) |

This prevents owners near midnight from logging to the wrong calendar day.

---

## 4.3 `daily_checkins`

### Purpose

Stores **Daily Check-in** (今日经营打卡) — the owner's once-per-day business input. Powers Business Health, trends, and AI input.

### Why this table exists

CampusFin v1 has no POS integration. This table is the **single source of truth** for business performance data. Every KPI and AI recommendation derives from here.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | PK |
| `business_id` | `uuid` | ✅ | FK → `businesses(id)` ON DELETE CASCADE |
| `checkin_date` | `date` | ✅ | Business-local date per `businesses.business_timezone` |
| `revenue` | `numeric(12,2)` | ✅ | Daily revenue. Must be ≥ 0 |
| `customer_count` | `integer` | ✅ | Customers or orders. Must be ≥ 0 |
| `note` | `text` | ❌ | Optional context, max 140 chars (app-enforced) |
| `created_at` | `timestamptz` | ✅ | When record was created |
| `updated_at` | `timestamptz` | ✅ | Last edit |

### Constraints

| Constraint | Rule |
|------------|------|
| Unique | `(business_id, checkin_date)` — one check-in per day per business |
| Check | `revenue >= 0` |
| Check | `customer_count >= 0` |

### Relationships

- `business_id` → `businesses.id`

### RLS

| Policy | Rule |
|--------|------|
| SELECT | Business owned by `auth.uid()` |
| INSERT | Business owned by `auth.uid()` |
| UPDATE | Business owned by `auth.uid()` |
| DELETE | Business owned by `auth.uid()` |

```sql
-- RLS pattern (all daily_checkins policies)
business_id IN (
  SELECT id FROM businesses WHERE owner_id = auth.uid()
)
```

### Deferred (v1)

| Field | Reason |
|-------|--------|
| `expenses` | Cash flow computed from revenue only in v1 |
| `cash_on_hand` | Manual cash tracking — Could Have |
| `order_count` vs `customer_count` | Unified as `customer_count` for all business types |
| `itemized_sales` | No inventory / SKU in v1 |
| `source` | No POS — always `manual` implicitly |

---

## 4.4 `campus_events`

### Purpose

Stores campus events and moments that drive **Zone 1 — Today's Campus**. Shared across all businesses at the same campus.

### Why this table exists

Campus Context is CampusFin's competitive moat. Events must be queryable by campus and date — separate from per-business data. Supports seeded academic calendar data and future API ingestion.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | PK |
| `campus_name` | `text` | ✅ | Matches `businesses.campus_name` |
| `title` | `text` | ✅ | e.g. "Career Fair", "Finals Week" |
| `event_type` | `campus_event_type` enum | ✅ | See enum below |
| `starts_on` | `date` | ✅ | Event start date |
| `ends_on` | `date` | ❌ | Event end date (null = single day) |
| `traffic_impact` | `traffic_impact` enum | ✅ | `high` \| `normal` \| `low` |
| `description` | `text` | ❌ | Optional detail for AI input |
| `source` | `event_source` enum | ✅ | `seed` \| `manual` \| `api` |
| `created_at` | `timestamptz` | ✅ | Default `now()` |

### Enums

```sql
-- campus_event_type
'academic' | 'career' | 'sports' | 'cultural' | 'holiday' | 'weather' | 'season'

-- traffic_impact
'high' | 'normal' | 'low'

-- event_source
'seed' | 'manual' | 'api'
```

### Relationships

- Soft link to `businesses` via `campus_name` (no FK — events are campus-scoped, not business-scoped)

### RLS

| Policy | Rule |
|--------|------|
| SELECT | Authenticated users whose `businesses.campus_name` matches `campus_events.campus_name` |
| INSERT | Service role only (v1) — owners do not create campus events |
| UPDATE | Service role only |
| DELETE | Service role only |

```sql
-- SELECT policy
campus_name IN (
  SELECT campus_name FROM businesses WHERE owner_id = auth.uid()
)
```

### Deferred (v1)

| Field | Reason |
|-------|--------|
| `campus_id` FK | No `campuses` master table |
| `latitude` / `longitude` | Geo not needed v1 |
| `university_id` | Text `campus_name` sufficient |
| `weather_data` | Rule-based weather chip; live API later |
| Owner-submitted events | Could Have — v1 is read-only for owners |

---

## 4.5 `ai_recommendations`

### Purpose

Persists **one daily recommendation per business** — Zone 3 **Today's Priority**. Structured output from AI or rule-based fallback.

### Why this table exists

- Dashboard reads a stored record — not live AI on every page load
- Enables History archive of past recommendations
- Supports "Got it" acknowledgment tracking
- Decouples AI generation from UI rendering

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | PK |
| `business_id` | `uuid` | ✅ | FK → `businesses(id)` ON DELETE CASCADE |
| `recommendation_date` | `date` | ✅ | The day this priority applies to |
| `recommendation_title` | `text` | ✅ | Action verb headline, max ~80 chars |
| `reason` | `text` | ✅ | 1–2 sentences linking campus + data + goal |
| `expected_impact` | `text` | ❌ | e.g. "+$120–180 estimated revenue" |
| `confidence_level` | `confidence_level` enum | ✅ | `high` \| `medium` \| `low` |
| `action_type` | `action_type` enum | ✅ | See enum below |
| `fallback_message` | `text` | ❌ | Shown when `source = rule_based` |
| `source` | `recommendation_source` enum | ✅ | `ai` \| `rule_based` |
| `acknowledged_at` | `timestamptz` | ❌ | When owner tapped "Got it" |
| `input_snapshot` | `jsonb` | ❌ | Frozen AI input for debugging (not shown to user) |
| `created_at` | `timestamptz` | ✅ | Default `now()` |

### Enums

```sql
-- confidence_level
'high' | 'medium' | 'low'

-- action_type
'extend_hours' | 'adjust_staffing' | 'run_promotion' | 'prepare_inventory'
| 'improve_service' | 'reduce_costs' | 'capture_traffic' | 'other'

-- recommendation_source
'ai' | 'rule_based'
```

### Constraints

| Constraint | Rule |
|------------|------|
| Unique | `(business_id, recommendation_date)` — one priority per day |

### Relationships

- `business_id` → `businesses.id`
- Generated after `daily_checkins` for same date (or rule-based if no check-in)

### RLS

| Policy | Rule |
|--------|------|
| SELECT | Business owned by `auth.uid()` |
| INSERT | Service role or edge function (not direct client insert) |
| UPDATE | Business owned by `auth.uid()` — `acknowledged_at` only from client |
| DELETE | Service role only |

### Deferred (v1)

| Field | Reason |
|-------|--------|
| `feedback_rating` | Thumbs up/down — Could Have |
| `executed` | Whether owner acted on advice — future loop |
| `raw_llm_response` | `input_snapshot` sufficient for v1 |

---

## 4.6 `weekly_briefs`

### Purpose

Stores **Weekly Review** (本周复盘) output — one brief per business per week. Answers campus recap, weekly performance, and next-week priority.

> **Sprint 4:** Schema migrated only. **Generation logic and Weekly Review page deferred.**

### Why this table exists

Weekly Review is a separate time horizon from daily Dashboard. Persisting briefs enables History archive, goal progress tracking, and consistent weekly experience without re-generating on each visit.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `uuid` | ✅ | PK |
| `business_id` | `uuid` | ✅ | FK → `businesses(id)` ON DELETE CASCADE |
| `week_start` | `date` | ✅ | Monday of the brief week (ISO week) |
| `week_end` | `date` | ✅ | Sunday of the brief week |
| `week_summary` | `text` | ✅ | One-paragraph weekly narrative |
| `campus_recap` | `jsonb` | ✅ | Structured campus events this past week |
| `business_health_summary` | `jsonb` | ✅ | Structured weekly KPIs |
| `next_week_priority` | `text` | ✅ | Single focus for coming week |
| `risk_notes` | `jsonb` | ❌ | Array of risk strings, may be empty |
| `suggested_goal_adjustment` | `text` | ❌ | Null if no change suggested |
| `confirmed_at` | `timestamptz` | ❌ | When owner confirmed weekly focus |
| `source` | `recommendation_source` enum | ✅ | `ai` \| `rule_based` |
| `input_snapshot` | `jsonb` | ❌ | Frozen input for debugging |
| `created_at` | `timestamptz` | ✅ | Default `now()` |

### `campus_recap` JSON shape

```json
{
  "events": [
    { "title": "Career Fair", "date": "2026-07-03", "impact": "high" }
  ],
  "campus_moment": "exam_week",
  "headline": "Finals week drove higher evening traffic"
}
```

### `business_health_summary` JSON shape

```json
{
  "total_revenue": 5840.00,
  "revenue_change_pct": 12.5,
  "avg_daily_customers": 62,
  "best_days": ["thursday", "friday", "saturday"],
  "health_label": "strong_week",
  "goal_progress_pct": 68
}
```

### `risk_notes` JSON shape

```json
[
  { "type": "cash_flow", "message": "Revenue strong but Wed–Thu dip may tighten weekend cash" }
]
```

### Constraints

| Constraint | Rule |
|------------|------|
| Unique | `(business_id, week_start)` |

### Relationships

- `business_id` → `businesses.id`
- Aggregates from `daily_checkins` for the week
- References `campus_events` for the week (via input, not FK)

### RLS

| Policy | Rule |
|--------|------|
| SELECT | Business owned by `auth.uid()` |
| INSERT | Service role or edge function |
| UPDATE | Business owned by `auth.uid()` — `confirmed_at` only from client |
| DELETE | Service role only |

### Deferred (v1)

| Field | Reason |
|-------|--------|
| `pdf_url` | Export is Could Have |
| `comparison_to_peers` | No benchmark data yet |

---

# 5. Dashboard Data Mapping

## Zone → Table mapping

### Zone 1 — Today's Campus

| Data needed | Source table | Required? | Fallback when missing |
|-------------|--------------|-----------|------------------------|
| Campus name | `businesses.campus_name` | ✅ | — (set at onboarding) |
| Today's events | `campus_events` WHERE `campus_name` match AND date range includes today | ❌ | Rule-based season chip: *"Exam season continues at {campus}"* |
| Campus moment (exam week, etc.) | `campus_events` WHERE `event_type = 'season'` | ❌ | Academic calendar rule from `week_start` / month |
| Traffic forecast | Derived from `campus_events.traffic_impact` | ❌ | Default `normal` |
| Weather signal | `campus_events` WHERE `event_type = 'weather'` | ❌ | Omit weather chip |
| Campus headline | Computed from above | ✅ | *"{Campus moment} continues at {campus_name}"* |

---

### Zone 2 — Business Health

| Data needed | Source table | Required? | Fallback when missing |
|-------------|--------------|-----------|------------------------|
| Today's revenue | `daily_checkins` WHERE `checkin_date = today` | ❌ | Display `—` (not `$0`) |
| Revenue vs last week | `daily_checkins` today vs same weekday last week | ❌ | Omit comparison line |
| Customer count | `daily_checkins.customer_count` today | ❌ | Display `—` |
| Customer vs 7-day avg | `daily_checkins` last 7 days | ❌ | Omit comparison |
| Cash flow signal | Computed from revenue trend (see §6) | ❌ | *"Record check-in to see cash flow"* |
| Health label | Computed `health_label` (see §6) | ❌ | *"No data yet"* |
| Campus-aware KPI note | `campus_events` + `daily_checkins` | ❌ | Omit annotation |

---

### Zone 3 — Today's Priority

| Data needed | Source table | Required? | Fallback when missing |
|-------------|--------------|-----------|------------------------|
| Today's recommendation | `ai_recommendations` WHERE `recommendation_date = today` | ❌ | If no check-in: **Check-in invitation** (not AI). If check-in but no AI: **rule-based** from `campus_events` |
| Acknowledged state | `ai_recommendations.acknowledged_at` | ❌ | Show full card |
| Business goal context | `businesses.business_goal` | ✅ | Always available post-onboarding |

**Zone 3 state machine:**

```
No check-in today     →  "Complete Daily Check-in" CTA (no row in ai_recommendations)
Check-in exists,
  no recommendation   →  Generate via AI Engine → insert ai_recommendations
Recommendation exists →  Render Today's Priority Card
AI failed               →  rule_based row with fallback_message
```

---

### Zone 4 — Weekly Trend

| Data needed | Source table | Required? | Fallback when missing |
|-------------|--------------|-----------|------------------------|
| 7-day revenue sparkline | `daily_checkins` last 7 days | ❌ | **Hide Zone 4** if < 2 days of data |
| Best days rhythm | `daily_checkins` aggregated by weekday | ❌ | Omit after first week |
| Goal progress | `daily_checkins` vs goal-type target (computed) | ❌ | Omit bar |
| Trend direction | Computed from 7-day series | ❌ | Omit arrow |
| Archive link | — | ✅ | Always show link; `/history` reads `daily_checkins` + `weekly_briefs` |

---

## Summary matrix

| Zone | Primary tables | Minimum data to render |
|------|----------------|------------------------|
| **Today's Campus** | `businesses`, `campus_events` | `businesses.campus_name` only |
| **Business Health** | `daily_checkins` | 0 check-ins → empty state |
| **Today's Priority** | `ai_recommendations`, `daily_checkins`, `businesses` | Check-in invitation OR recommendation row |
| **Weekly Trend** | `daily_checkins`, `businesses` | ≥ 2 days of check-ins |

---

# 6. Computed Metrics

Not stored in v1 — computed at read time from `daily_checkins`.

| Metric | Logic | Used in |
|--------|-------|---------|
| `revenue_change_pct` | `(today - same_weekday_last_week) / same_weekday_last_week * 100` | Zone 2 |
| `customer_change_pct` | Same pattern for `customer_count` | Zone 2 |
| `health_label` | `strong_day` / `normal` / `needs_attention` based on revenue vs 7-day avg thresholds | Zone 2 |
| `cash_flow_signal` | `healthy` / `tight` / `at_risk` from 7-day revenue slope | Zone 2 |
| `traffic_forecast` | Max `traffic_impact` from today's `campus_events` | Zone 1 |
| `goal_progress_pct` | Goal-type-specific formula on 7-day or 30-day window | Zone 4 |

**v1 simplification:** Cash flow is **revenue-trend-based only** — not actual cash on hand. Label clearly in UI: *"Based on revenue trend"* — not bank data.

---

# 7. Row Level Security

## Principles

1. Owners access **only their own business** data.
2. `campus_events` are **read-only** for owners — written by service role / seed scripts.
3. `ai_recommendations` and `weekly_briefs` are **inserted by backend** — not direct client writes (except `acknowledged_at` / `confirmed_at`).
4. No cross-tenant data leakage via `campus_name` — events are public within matched campus but contain no PII.

## Policy summary

| Table | Owner SELECT | Owner INSERT | Owner UPDATE | Service INSERT |
|-------|-------------|-------------|-------------|----------------|
| `profiles` | ✅ own | trigger | ✅ own | — |
| `businesses` | ✅ own | ✅ own | ✅ own | — |
| `daily_checkins` | ✅ own business | ✅ own business | ✅ own business | — |
| `campus_events` | ✅ matching campus | ❌ | ❌ | ✅ |
| `ai_recommendations` | ✅ own business | ❌ | ✅ `acknowledged_at` only | ✅ |
| `weekly_briefs` | ✅ own business | ❌ | ✅ `confirmed_at` only | ✅ |

---

# 8. Migrations Strategy

| Order | Migration | Notes |
|-------|-----------|-------|
| 1 | Enums | All enum types |
| 2 | `profiles` | Extends existing migration |
| 3 | `businesses` | New |
| 4 | `daily_checkins` | New |
| 5 | `campus_events` | New + seed script for academic calendar |
| 6 | `ai_recommendations` | New |
| 7 | `weekly_briefs` | New |
| 8 | RLS policies | All tables |
| 9 | Indexes | See below |

## Recommended indexes

```sql
-- daily_checkins
CREATE INDEX idx_checkins_business_date ON daily_checkins (business_id, checkin_date DESC);

-- campus_events
CREATE INDEX idx_events_campus_dates ON campus_events (campus_name, starts_on, ends_on);

-- ai_recommendations
CREATE INDEX idx_recommendations_business_date ON ai_recommendations (business_id, recommendation_date DESC);

-- weekly_briefs
CREATE INDEX idx_briefs_business_week ON weekly_briefs (business_id, week_start DESC);
```

**Note:** Existing `supabase/migrations/20260706000000_initial_schema.sql` contains early `profiles` only. Sprint 3 schema supersedes it — new migration file required in implementation sprint.

---

# 9. Data Boundaries (v1)

CampusFin v1 is an **operating assistant** — not a financial system.

## Explicitly out of scope

| Capability | Status | Reason |
|------------|--------|--------|
| POS integration | ❌ Won't Have v1 | Manual Daily Check-in validates demand first |
| Bank transaction sync | ❌ Won't Have v1 | No bank APIs, no account linking |
| Inventory management | ❌ Won't Have v1 | Scope creep — different product |
| Employee management | ❌ Won't Have v1 | Single-owner v1 |
| Multi-store | ❌ Won't Have v1 | Schema allows future `businesses` rows; app enforces 1 |
| Complex financial statements | ❌ Won't Have v1 | Not P&L, not balance sheet |
| Loan approval / credit scoring | ❌ Won't Have v1 | **CampusFin is not a lender** |
| Credit line recommendations | ❌ Won't Have v1 | No financial decision-making |
| Tax filing | ❌ Won't Have v1 | Partner opportunity later |

## What CampusFin does (v1)

| Capability | Boundary |
|------------|------------|
| Revenue tracking | Owner-entered via Daily Check-in only |
| Cash flow signal | **Trend-based estimate** from revenue — not bank balance |
| Campus awareness | Read-only event data + rule-based season |
| Daily action | One AI recommendation — operational, not financial |
| Weekly brief | Performance summary + next-week focus — not financial advice |
| Risk notes | Operational risks (traffic dip, event miss) — **not credit risk** |

> **Legal/product boundary:** All `expected_impact` and `risk_notes` are **informational estimates** for business operations. CampusFin does not provide financial advice, lending decisions, or investment recommendations.

---

# 10. Deferred Fields & Tables

## Tables not in v1

| Table | When |
|-------|------|
| `campuses` | When multiple campuses need canonical IDs |
| `checkin_reminders` | Email/push reminder system |
| `recommendation_feedback` | Thumbs up/down on AI cards |
| `pos_connections` | POS integration phase |

## Fields deferred across tables

See per-table **Deferred (v1)** sections above.

---

# 11. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Seed `campus_events` per campus or global academic calendar template? | Zone 1 quality at launch |
| 2 | Regenerate `ai_recommendations` if owner edits check-in same day? | Data consistency |
| 3 | `goal_progress_pct` formula per `business_goal` type — define thresholds? | Zone 4 accuracy |
| 4 | Store computed metrics vs compute on read? | Performance at scale — v1 compute on read is fine |
| 5 | ~~Timezone for `checkin_date`~~ | ✅ Resolved — `business_timezone` on `businesses`, default `Asia/Shanghai` |

---

# Sprint Summary

## 1. 修改了什么

| File | Content |
|------|---------|
| `docs/DATABASE.md` | 完整 v1 数据库设计：6 张表、字段、枚举、RLS、索引、Dashboard 映射、数据边界 |
| `docs/AI-ENGINE.md` | AI Recommendation 输入/输出 JSON 契约、Weekly Brief 契约、fallback 规则 |

**未修改：** 应用代码、Supabase 实现、其他文档。

---

## 2. 核心数据库决策

| Decision | Rationale |
|----------|-----------|
| Table name `daily_checkins` not `daily_logs` | 对齐产品语言「Daily Check-in / 今日经营打卡」 |
| `businesses` separate from `profiles` | 未来多店扩展；v1 应用层限制 1 business |
| `business_goal` on `businesses` | 战略锚点，AI 输入必需 |
| `campus_events` campus-scoped, not business-scoped | 同校区商家共享事件数据 |
| `ai_recommendations` one row per business per day | 对齐「一天一个 Today's Priority」 |
| `weekly_briefs` with JSONB structured fields | 周报需要结构化 + 可扩展 |
| Cash flow = revenue trend only | 不做银行集成；明确非真实现金流 |
| AI/brief inserts via service role | 防止客户端伪造推荐 |

---

## 3. AI 输出格式决策

见 `docs/AI-ENGINE.md`。核心：

- 输入：Campus Context + Business Health + Business Goal + Daily Check-in + Recent Trend
- 输出：结构化 JSON，6 个必填字段，一天一条
- Weekly Brief：6 个输出字段，回答校园/经营/下周重点
- Fallback：AI 失败时 `rule_based` + `fallback_message`，用户无感知

---

## 4. 对后续开发的影响

| Sprint | Impact |
|--------|--------|
| **Sprint 4 (implementation)** | New Supabase migration replacing early `profiles`-only schema |
| **API routes** | `POST /dashboard/record` → insert `daily_checkins` → trigger AI → insert `ai_recommendations` |
| **Dashboard UI** | Four zones map 1:1 to query patterns in §5 |
| **Seed script** | `campus_events` academic calendar required for Zone 1 on day 0 |
| **Type generation** | `supabase gen types` from this schema |

---

## 5. 仍然存在的问题

| # | Issue |
|---|-------|
| 1 | `campus_events` seed data strategy undefined |
| 2 | `goal_progress_pct` formulas per goal type not numerically specified |
| 3 | Timezone handling for `checkin_date` |
| 4 | Whether editing a check-in regenerates AI recommendation same day |
| 5 | Weekly brief generation trigger — cron vs on-demand on first visit |

---

## 6. 是否建议进入 Sprint 4

**建议：是 — 待 Founder 确认 Sprint 3 后进入 Sprint 4。**

推荐 Sprint 4 focus：

> **Supabase 实现 + Dashboard 骨架（首个可运行 milestone）**

| Deliverable | Priority |
|-------------|----------|
| Supabase migration (6 tables + RLS) | P0 |
| `campus_events` seed data | P0 |
| Daily Check-in API + form | P0 |
| Dashboard four-zone layout (mock data → real queries) | P0 |
| AI recommendation edge function (can start rule-based) | P1 |

**Sprint 4 不做：** 完整 AI prompt 调优、Weekly Review 页面、Payment。

---

**Sprint 3 完成。Sprint 4 实现见下方。**

---

# Sprint 4 — Implementation Status

## Sprint 4 已实现

| Item | Location |
|------|----------|
| Supabase migration (enums, 6 tables, indexes, RLS) | `supabase/migrations/20260706140000_sprint4_schema.sql` |
| Campus events seed (北京某高校) | `supabase/migrations/20260706140100_seed_campus_events.sql` |
| `upsert_ai_recommendation` RPC | Same migration — allows rule-based insert without service role in app |
| `business_timezone` on `businesses` | Migration + `lib/timezone.ts` |
| Daily Check-in page | `/dashboard/record` — UI label: **Daily Check-in / 今日经营打卡** |
| Rule-based recommendation | `lib/ai/rule-based.ts` → `ai_recommendations` on check-in |
| Dashboard four zones (real data) | `/dashboard` |
| Business setup (first-time) | `/setup` |
| TypeScript types | `types/database.ts` |

## Sprint 4 未实现

| Item | Status |
|------|--------|
| Real LLM / OpenAI / Claude API | Deferred |
| Weekly Brief generation + page | Schema only — deferred |
| Payment | Deferred |
| Multi-store | Deferred |
| POS integration | Deferred |
| AI Chat | Never |

## Migration files

| File | Purpose |
|------|---------|
| `20260706000000_initial_schema.sql` | Early `profiles` only (superseded by Sprint 4 for new installs) |
| `20260706140000_sprint4_schema.sql` | Full Sprint 4 schema |
| `20260706140100_seed_campus_events.sql` | MVP campus event seed data |
