# CampusFin AI — AI Recommendation Quality Review

**Milestone 2:** Build MVP  
**Sprint:** Sprint 5c — AI Quality Review  
**Status:** In Progress — Manual review framework  
**Prompt version under test:** `campusfin-daily-v1`  
**Last updated:** 2026-07-06

> **Scope:** This document defines how to evaluate LLM-generated Today's Priority recommendations against CampusFin product positioning.  
> **No code changes.** Reviewers run scenarios manually (staging / production with `ENABLE_LLM=true`) and record results here.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Quality Rubric](#2-quality-rubric)
3. [Scoring Guide (0–2 per dimension)](#3-scoring-guide-02-per-dimension)
4. [Pass Standard](#4-pass-standard)
5. [How to Run a Review](#5-how-to-run-a-review)
6. [Test Matrix (12 Scenarios)](#6-test-matrix-12-scenarios)
7. [Review Log Template](#7-review-log-template)
8. [Sprint 5c Summary](#sprint-5c-summary)

---

# 1. Purpose

Sprint 5b proved the LLM pipeline works: OpenRouter → Validator → `ai_recommendations.source = ai`.

Sprint 5c answers a different question:

> **Does the AI output actually feel like CampusFin AI — not ChatGPT, not a consultant, not generic SMB advice?**

This review validates:

- **Campus-first** thinking (the moat)
- **One daily action** (product model)
- **30-minute executability** (owner reality)
- **Simplified Chinese voice** (v1 output language)

---

# 2. Quality Rubric

Each recommendation is scored on **7 dimensions**. Each dimension: **0, 1, or 2 points**.

| # | Dimension | Question |
|---|-----------|----------|
| 1 | **Campus-first** | Does it clearly reference a campus event, campus moment, or campus traffic signal? |
| 2 | **Business Health** | Does it use today's or recent business data — not campus alone? |
| 3 | **Goal Alignment** | Does it connect to the owner's `business_goal`? |
| 4 | **One Action** | Is there exactly one action — no lists, no alternatives? |
| 5 | **30-minute Rule** | Can the owner **start** this within 30 minutes? |
| 6 | **Owner Control** | Is the action fully under the owner's control (no waiting on university/weather)? |
| 7 | **Language** | Simplified Chinese, concise, practical — not consultant / ChatGPT / MBA tone? |

**Total score: 14 points maximum.**

### Thinking chain check (informational, not scored separately)

A passing recommendation should implicitly follow:

```
Campus Context → Business Health → Business Goal → ONE Action
```

If the chain is reversed (data first, campus as afterthought), dimension 1 likely scores 0–1.

---

# 3. Scoring Guide (0–2 per dimension)

### 1. Campus-first

| Score | Criteria |
|-------|----------|
| **0** | No campus reference; generic advice that could apply to any shop anywhere |
| **1** | Vague campus mention ("students are busy") without specific event/moment/traffic |
| **2** | Clear reference to exam week, career fair, rain, thesis season, enrollment, etc. |

### 2. Business Health

| Score | Criteria |
|-------|----------|
| **0** | Ignores revenue, customer count, or trend entirely |
| **1** | Mentions data but loosely ("business is okay") without numbers or direction |
| **2** | Cites specific data (today's revenue, vs last week, vs 7-day avg, trend direction) |

### 3. Goal Alignment

| Score | Criteria |
|-------|----------|
| **0** | Action contradicts or ignores stated goal |
| **1** | Action is compatible with goal but reason doesn't mention goal |
| **2** | Reason explicitly links action to goal label (e.g. 提升营业额, 改善现金流) |

### 4. One Action

| Score | Criteria |
|-------|----------|
| **0** | Multiple actions, numbered list, or "consider A and B" |
| **1** | Single title but reason suggests secondary actions |
| **2** | One verb-led action in title; reason supports that single action only |

### 5. 30-minute Rule

| Score | Criteria |
|-------|----------|
| **0** | Long-term project (renovation, hiring, loyalty program setup, lease) |
| **1** | Theoretically doable today but realistically needs hours of prep |
| **2** | Owner can start within 30 minutes (adjust hours, launch promo, reassign staff, change menu focus) |

### 6. Owner Control

| Score | Criteria |
|-------|----------|
| **0** | Suggests waiting (等学生回来, 等天气好转, 等学校通知) |
| **1** | Mostly controllable but depends on uncertain external factor |
| **2** | Fully owner-controlled operational move |

### 7. Language

| Score | Criteria |
|-------|----------|
| **0** | English-heavy, jargon (KPI/ROI/赋能/抓手), chatbot tone, or report style |
| **1** | Chinese but too long, consultant-like, or "As an AI" self-reference |
| **2** | Concise Simplified Chinese; sounds like a sharp campus shop manager; ≤2 sentence reason |

---

# 4. Pass Standard

| Total Score | Verdict | Action |
|-------------|---------|--------|
| **≥ 12** | ✅ **Beta-ready** | Prompt quality acceptable for limited beta rollout |
| **10–11** | ⚠️ **Optimize Few-shot** | Add or refine few-shot examples for weak dimensions; re-test failing scenarios |
| **< 10** | ❌ **Revise Prompt** | System Prompt / Developer Prompt / Guardrails need structural changes (Sprint 5d) |

### Per-scenario pass

| Rule | Threshold |
|------|-----------|
| Individual scenario | **≥ 10/14** AND no dimension scored **0** on Campus-first, One Action, or Owner Control |
| Full matrix | **≥ 10 of 12 scenarios pass** for Beta-ready |

### Automatic fail (regardless of score)

- Financial / loan / investment / tax / legal advice
- Multiple recommendations in one output
- English in `recommendation_title` or `reason`
- Chat-style output or follow-up questions
- Fabricated campus events not in input

---

# 5. How to Run a Review

1. Set `ENABLE_LLM=true` with OpenRouter configured (see `docs/AI-ENGINE.md` Sprint 5b.1).
2. Create or use a test business with matching `campus_name`, `business_goal`, and campus events (seed: 北京某高校).
3. Submit Daily Check-in with scenario-specific revenue / customer_count.
4. Fetch result from Supabase `ai_recommendations` where `source = 'ai'`.
5. Score all 7 dimensions; record in Test Matrix below.
6. If `source = rule_based`, check `input_snapshot.fallback_reason` — scenario is **invalid for AI quality review** until LLM succeeds.

**Fields to copy from DB:**

```sql
SELECT
  recommendation_title,
  reason,
  expected_impact,
  confidence_level,
  action_type,
  source,
  input_snapshot
FROM ai_recommendations
WHERE business_id = '<uuid>'
  AND recommendation_date = '<date>'
ORDER BY created_at DESC
LIMIT 1;
```

---

# 6. Test Matrix (12 Scenarios)

> Fill **Actual output** and **Score** after each manual run.  
> **Expected behavior** describes what a high-quality CampusFin recommendation should do — not exact wording.

---

## Scenario ① — 咖啡店 · 考试周 · 提升营业额

| Field | Content |
|-------|---------|
| **Business type** | `coffee_shop` |
| **Campus moment** | 考试周 (exam week) |
| **Goal** | `increase_revenue` |
| **Health signal** | Strong day — revenue +15% vs 7-day avg |
| **Input** | _TBD — paste `input_snapshot.prompt_input` or construct check-in: revenue ¥920, customers 78, exam week active, traffic high_ |
| **Expected behavior** | Campus-first: exam week evening study traffic. Action: extend hours or capture peak (e.g. 延长晚间营业). Links revenue data + 提升营业额. One action, startable today. |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ② — 咖啡店 · 雨天 · 改善现金流

| Field | Content |
|-------|---------|
| **Business type** | `coffee_shop` |
| **Campus moment** | 雨天 (weather event) |
| **Goal** | `improve_cash_flow` |
| **Health signal** | Revenue -18% vs same day last week |
| **Input** | _TBD — revenue ¥580, customers 42, weather_signal rain, traffic low_ |
| **Expected behavior** | Acknowledge rain reduces foot traffic. Action: reduce waste / push delivery / cut prep — not "wait for sun." Links cash flow goal. Cost-control or traffic capture without long-term spend. |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ③ — 奶茶店 · 开学季 · 提升营业额

| Field | Content |
|-------|---------|
| **Business type** | `bubble_tea` |
| **Campus moment** | 开学季 (back to school) |
| **Goal** | `increase_revenue` |
| **Health signal** | Normal — steady traffic, new student influx |
| **Input** | _TBD — revenue ¥1,100, customers 95, season event 开学季, traffic high_ |
| **Expected behavior** | Campus-first: new students discovering shops. Action: limited welcome promo or extended lunch hours. Not generic "marketing campaign." |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ④ — 打印店 · 论文季 · 提升用户评价

| Field | Content |
|-------|---------|
| **Business type** | `print_shop` |
| **Campus moment** | 论文季 (thesis season) |
| **Goal** | `improve_satisfaction` |
| **Health signal** | High traffic — near capacity (89 customers) |
| **Input** | _TBD — revenue ¥1,450, customers 89, thesis deadline week_ |
| **Expected behavior** | Campus-first: thesis printing peak. Action: service speed (快速通道), not blind discount. Links satisfaction goal and queue pain. |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ⑤ — 文印店 · 客流下降 · 改善现金流

| Field | Content |
|-------|---------|
| **Business type** | `print_shop` |
| **Campus moment** | Steady week, no major event |
| **Goal** | `improve_cash_flow` |
| **Health signal** | Needs attention — revenue -20% vs 7-day avg |
| **Input** | _TBD — revenue ¥680, customers 38, no campus events, trend down_ |
| **Expected behavior** | Uses declining data. Action: reduce variable costs, adjust hours, or targeted small promo — protects cash without big spend. Must still mention campus rhythm (even if "平稳"). |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ⑥ — 轻食店 · 雨天 · 控制成本

| Field | Content |
|-------|---------|
| **Business type** | `restaurant` (light meal) |
| **Campus moment** | 雨天 |
| **Goal** | `improve_cash_flow` (cost reduction angle) |
| **Health signal** | Revenue below avg, dine-in down |
| **Input** | _TBD — revenue ¥520, customers 35, rain, cash_flow_signal tight_ |
| **Expected behavior** | Rain → less dine-in. Action: reduce prep / push takeaway combo / cut waste. `action_type` likely `reduce_costs`. Not extend hours blindly. |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ⑦ — 咖啡店 · 招聘会 · 提高复购率

| Field | Content |
|-------|---------|
| **Business type** | `coffee_shop` |
| **Campus moment** | 招聘会 (career fair, high traffic in 1–3 days) |
| **Goal** | `improve_repeat_rate` |
| **Health signal** | Normal day, upcoming event |
| **Input** | _TBD — revenue ¥750, customers 55, career fair upcoming high traffic_ |
| **Expected behavior** | Campus-first: career fair traffic. Action: loyalty gesture for returning customers OR prep for repeat visits after fair — aligned with 提高复购率, not pure revenue chase. |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ⑧ — 花店 · 毕业季

| Field | Content |
|-------|---------|
| **Business type** | `other` (flower shop) |
| **Campus moment** | 毕业季 (graduation season) |
| **Goal** | `increase_revenue` |
| **Health signal** | Strong day — graduation orders rising |
| **Input** | _TBD — revenue ¥1,800, customers 42, graduation season event_ |
| **Expected behavior** | Campus-first: graduation bouquets/demand. Action: prepare inventory or same-day pickup offer. Specific to graduation — not generic flower shop tip. |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ⑨ — 早餐店 · 开学第一周

| Field | Content |
|-------|---------|
| **Business type** | `restaurant` (breakfast) |
| **Campus moment** | 开学第一周 |
| **Goal** | `increase_revenue` |
| **Health signal** | Strong morning traffic |
| **Input** | _TBD — revenue ¥980, customers 120, early semester, traffic high_ |
| **Expected behavior** | Campus-first: students re-establishing routines. Action: extend morning hours or bundle breakfast combo. Fast to execute. |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ⑩ — 奶茶店 · 正常工作日

| Field | Content |
|-------|---------|
| **Business type** | `bubble_tea` |
| **Campus moment** | None — steady normal week |
| **Goal** | `increase_revenue` |
| **Health signal** | Normal — no strong signal |
| **Input** | _TBD — revenue ¥850, customers 70, no events, traffic normal_ |
| **Expected behavior** | Hardest scenario — must avoid generic ChatGPT advice. Still cite campus rhythm ("本周平稳"). Action: small concrete move (今日限时第二杯半价). Must use data + goal even without big campus event. |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ⑪ — 咖啡店 · 营业额连续下降

| Field | Content |
|-------|---------|
| **Business type** | `coffee_shop` |
| **Campus moment** | Post-exam quiet period |
| **Goal** | `improve_cash_flow` |
| **Health signal** | 3-day revenue trend down, needs_attention |
| **Input** | _TBD — revenue ¥620, customers 48, trend down 3 days, post-exam lull_ |
| **Expected behavior** | Interprets decline in campus context (post-exam lull). Action: reduce costs or targeted promo — not panic or long-term pivot. Links 改善现金流. |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

## Scenario ⑫ — 打印店 · 校园活动取消

| Field | Content |
|-------|---------|
| **Business type** | `print_shop` |
| **Campus moment** | Expected high-traffic event **cancelled** |
| **Goal** | `improve_cash_flow` |
| **Health signal** | Revenue flat, anticipated traffic won't arrive |
| **Input** | _TBD — revenue ¥900, customers 50, cancelled career fair in events_today, traffic forecast revised to normal/low_ |
| **Expected behavior** | Campus-first: cancelled event changes traffic expectation. Action: adjust staffing/prep downward — avoid overstock. Owner-controlled. Must NOT say "wait for event." |
| **Actual output** | _TBD_ |
| **Score** | _/14_ |
| **Pass/Fail** | _TBD_ |

---

# 7. Review Log Template

Copy for each review session:

```markdown
## Review Session — YYYY-MM-DD

**Reviewer:**  
**Environment:** staging / production  
**Prompt version:** campusfin-daily-v1  
**Model:** openai/gpt-4o-mini via OpenRouter  

| # | Scenario | Score | Pass | Weak dimensions | Notes |
|---|----------|-------|------|-----------------|-------|
| ① | 咖啡店·考试周 | /14 | | | |
| ② | 咖啡店·雨天 | /14 | | | |
| ... | | | | | |

**Matrix pass rate:** /12  
**Average score:** /14  
**Verdict:** Beta-ready / Optimize Few-shot / Revise Prompt  
**Top 3 issues:**  
1.  
2.  
3.  
**Recommended Sprint 5d actions:**  
-  
```

---

# Sprint 5c Summary

## New files

| File | Purpose |
|------|---------|
| `docs/AI-QUALITY-REVIEW.md` | Quality rubric, 12-scenario test matrix, pass standards, review log template |

## Quality scoring system

- **7 dimensions × 0–2 points = 14 total**
- Dimensions: Campus-first, Business Health, Goal Alignment, One Action, 30-minute Rule, Owner Control, Language
- Automatic fail rules for financial advice, multi-action, English output, chat tone

## 12 test scenarios

| # | Scenario | Goal | Key test |
|---|----------|------|----------|
| ① | 咖啡店 · 考试周 | increase_revenue | Campus peak → capture traffic |
| ② | 咖啡店 · 雨天 | improve_cash_flow | Weather + decline → cost control |
| ③ | 奶茶店 · 开学季 | increase_revenue | Seasonal influx → promo |
| ④ | 打印店 · 论文季 | improve_satisfaction | Peak + queue → service |
| ⑤ | 文印店 · 客流下降 | improve_cash_flow | Decline without event |
| ⑥ | 轻食店 · 雨天 | improve_cash_flow | Rain → reduce costs |
| ⑦ | 咖啡店 · 招聘会 | improve_repeat_rate | Event + loyalty |
| ⑧ | 花店 · 毕业季 | increase_revenue | Season-specific inventory |
| ⑨ | 早餐店 · 开学第一周 | increase_revenue | Routine re-establishment |
| ⑩ | 奶茶店 · 正常工作日 | increase_revenue | No event — avoid generic |
| ⑪ | 咖啡店 · 连续下降 | improve_cash_flow | Trend + campus lull |
| ⑫ | 打印店 · 活动取消 | improve_cash_flow | Cancelled event → adjust prep |

## Launch standard (Beta)

| Score | Decision |
|-------|----------|
| ≥ 12/14 per scenario, ≥ 10/12 scenarios pass | ✅ Beta-ready |
| 10–11/14 | ⚠️ Optimize few-shot (Sprint 5d) |
| < 10/14 | ❌ Revise System/Developer Prompt (Sprint 5d) |

## Next: Sprint 5d — Prompt Iteration

| Step | Deliverable |
|------|-------------|
| Run all 12 scenarios | Fill Actual output + Score in this doc |
| Aggregate weak dimensions | Identify patterns (e.g. normal-week generic, goal missing) |
| Few-shot expansion | Add 2–3 scenarios for failing dimensions |
| Prompt patch | Targeted System/Developer Prompt edits — version bump to `campusfin-daily-v2` |
| Re-run matrix | Confirm ≥ 10/12 pass before beta widen |

**Sprint 5c complete when:** Founder signs off review framework and first review session is scheduled.  
**Sprint 5d begins when:** First matrix run reveals scores below Beta threshold.

---

**Cross-references:** `docs/AI-PROMPTS.md` · `docs/AI-ENGINE.md` · `lib/ai/prompts.ts` (read-only reference)
