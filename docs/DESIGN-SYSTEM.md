# CampusFin AI — Dashboard Experience Design

**Milestone 1:** Product Foundation  
**Sprint:** Sprint 2 — Dashboard Experience Design  
**Status:** Complete  
**Last updated:** 2026-07-06

> **Scope note:** This document defines **product experience and layout logic** only.  
> Visual design system (color, typography, buttons, tokens) is deferred to a future sprint.

---

## Table of Contents

1. [Dashboard Experience](#1-dashboard-experience)
2. [Dashboard Information Hierarchy](#2-dashboard-information-hierarchy)
3. [Dashboard Zones](#3-dashboard-zones)
4. [First Visit Experience](#4-first-visit-experience)
5. [Daily Check-in Experience](#5-daily-check-in-experience)
6. [Empty States](#6-empty-states)
7. [AI Card Design](#7-ai-card-design)
8. [Campus Card Design](#8-campus-card-design)
9. [Dashboard Design Principles](#9-dashboard-design-principles)
10. [Sprint Summary](#sprint-summary)

---

# 1. Dashboard Experience

## What this is

CampusFin AI is a **campus operating system** — not a BI dashboard, not an ERP, not a chatbot.

A business owner opens the product once per day, spends **3–5 minutes**, and leaves knowing what campus means for their shop today.

---

## The daily loop

```
Open app
    ↓
3-second scan (Campus → Health → Action)
    ↓
Need Daily Check-in? ──No──→ Read recommendation → Done (~30 sec)
    │
   Yes
    ↓
Record Today (~2 min)
    ↓
Return to Dashboard → AI recommendation appears
    ↓
Acknowledge action → Close app
    ↓
Return tomorrow
```

**Total time:** 30 seconds (already recorded) to 5 minutes (full check-in + review).

---

## Step-by-step experience

### Step 1 — Open product

| Dimension | Detail |
|-----------|--------|
| **User sees** | Dashboard loads directly to **Today's Campus** (Zone 1). No splash screen, no chat prompt, no onboarding tooltip overlay. |
| **User thinks** | *"What's happening at campus today?"* — not *"Where do I click?"* |
| **Why they return tomorrow** | The first thing they see is **their world** (campus), not software. It feels like opening a morning briefing, not logging into a tool. |

---

### Step 2 — 3-second scan

| Dimension | Detail |
|-----------|--------|
| **User sees** | Zone 1 headline → Zone 2 health summary (3 KPIs max) → Zone 3 action card (or check-in prompt). |
| **User thinks** | Three questions answered instantly: (1) Campus? (2) Shop okay? (3) What to do? |
| **Why they return tomorrow** | No cognitive load. They don't interpret charts — the product interprets for them. Habit forms because the scan is **effortless**. |

**3-second scan path:**

```
Eyes land on campus headline
    → glance at health label ("Strong day" / "Needs attention")
        → land on action card or "Record today" button
```

---

### Step 3 — Daily Check-in decision

| Dimension | Detail |
|-----------|--------|
| **User sees** | If today's data is missing: Zone 3 shows a single prompt — *"Record today to unlock your recommendation"* with one button. Zone 2 KPIs show placeholders, not fake zeros. |
| **User thinks** | *"I haven't logged today yet — takes 2 minutes."* OR *"Already logged — let me see what to do."* |
| **Why they return tomorrow** | The product **never guilt-trips**. It states what's needed and why — one sentence. Missing data feels like an unlocked feature, not a failure. |

**Trigger rules:**

| Condition | Zone 3 shows |
|-----------|--------------|
| No data ever recorded | "Record your first day — unlock campus-aware insights" |
| Today not yet recorded | "Record today — unlock your recommendation" |
| Today recorded | Today's Recommendation Card (AI) |
| Yesterday missed, today recorded | Recommendation + subtle note: "Yesterday unrecorded — trend may be incomplete" |

---

### Step 4 — Record Today (if needed)

| Dimension | Detail |
|-----------|--------|
| **User sees** | Full-screen focused form: 2 required fields, 1 optional. Large tap targets. Progress hint: *"~30 seconds left."* |
| **User thinks** | *"Revenue, customers, done."* — like closing the cash register, not filling a tax form. |
| **Why they return tomorrow** | Completing check-in is **fast and satisfying**. Dashboard immediately updates — instant reward. |

See [§5 Daily Check-in Experience](#5-daily-check-in-experience) for full spec.

---

### Step 5 — View AI recommendation

| Dimension | Detail |
|-----------|--------|
| **User sees** | Zone 3 transforms into **Today's Recommendation Card**: one action, one reason, one impact estimate. Not a paragraph. Not a chat thread. |
| **User thinks** | *"That makes sense — career fair is Thursday and I want more revenue."* |
| **Why they return tomorrow** | The recommendation connects **campus + their shop + their goal**. It feels personal and timely — not generic AI advice they could get from ChatGPT. |

---

### Step 6 — Close product

| Dimension | Detail |
|-----------|--------|
| **User sees** | Optional: tap **"Got it"** on action card. Dashboard remains on screen — no forced confirmation modal. |
| **User thinks** | *"I know what to do today. Done."* |
| **User does** | Closes tab / locks phone. Total session: **under 5 minutes**. |
| **Why they return tomorrow** | They leave with **one clear action**, not a to-do list. Tomorrow brings new campus context — reason to open again. |

---

## Session time budget

| Scenario | Duration | Steps |
|----------|----------|-------|
| **Quick scan** (already recorded) | ~30 sec | Open → scan → read action → close |
| **Standard daily** | ~2–3 min | Open → scan → record → read action → close |
| **Catch-up** (missed yesterday) | ~4–5 min | Open → record yesterday → record today → read action → close |

---

## Retention loop — why owners come back

| Day | Hook |
|-----|------|
| **Day 1** | Campus context is immediately useful — even before data exists. |
| **Day 2** | First trend appears. Owner sees cause-and-effect. |
| **Day 3+** | Recommendation quality improves. Owner trusts the product's memory. |
| **Weekly** | Weekly Review (separate page) — different rhythm, same campus lens. |

**The product earns return visits by changing every day** (campus events, seasons, weather) — not by nagging notifications.

---

# 2. Dashboard Information Hierarchy

## Full layout (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│  CampusFin          Wed, Jul 6              [Exam Week]  (avatar)│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ ZONE 1: TODAY'S CAMPUS ──────────────────────────────────┐  │
│  │                                                            │  │
│  │  Finals week starts Monday                                 │  │
│  │                                                            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ Exam Week   │ │ Career Fair │ │ Traffic: High ↑     │  │  │
│  │  │ · Active    │ │ · Thu 2pm   │ │ · Rain tomorrow   │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ ZONE 2: BUSINESS HEALTH ─────────────────────────────────┐  │
│  │                                                            │  │
│  │  Today: Strong day                                         │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │  │
│  │  │ Revenue      │  │ Cash Flow    │  │ Customers    │       │  │
│  │  │ $842         │  │ Healthy      │  │ 67           │       │  │
│  │  │ ↑ 12% vs LW  │  │              │  │ ↑ 8% vs avg  │       │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ ZONE 3: TODAY'S PRIORITY ────────────────────────────────┐  │
│  │                                                            │  │
│  │  ★ Extend hours to 8pm on Thursday                         │  │
│  │                                                            │  │
│  │  Why: Career fair + your goal is revenue                   │  │
│  │  Impact: +$120–180 estimated                               │  │
│  │                                                            │  │
│  │  ┌──────────────────┐                                      │  │
│  │  │     Got it  →    │  ← single primary button             │  │
│  │  └──────────────────┘                                      │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ ZONE 4: WEEKLY TREND ────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Last 7 days    ▁▂▃▅▆▇  ↑ trending up                    │  │
│  │  Best days: Thu–Sat    Goal: Revenue · 68% of target      │  │
│  │                                        View past records → │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [Today]        [Weekly Review]        [Settings]                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Why this order — and why it cannot change

| Position | Zone | Why it must be here | What breaks if moved |
|----------|------|---------------------|----------------------|
| **1st** | Today's Campus | CampusFin's moat. Owner's first question is always *"What's happening outside my shop?"* — not *"What's my revenue?"* | Product becomes generic BI. Indistinguishable from any analytics tool. |
| **2nd** | Business Health | Numbers only matter **after** campus context. Revenue "up 12%" means nothing without knowing it's exam week. | Owner misinterprets data. Recommendations lose campus linkage. |
| **3rd** | Today's Priority | Action is the **output** of campus + health. Owner came for a decision, not a report. | Product becomes read-only analytics. Owner still wonders "so what?" |
| **4th** | Weekly Trend | Historical context supports long-term thinking but is **not urgent**. Bottom placement respects daily time budget. | Dashboard feels like Excel — owner drowns in charts before seeing what to do. |

**Invariant rule:** `Campus → Health → Action → History` — never swap, never collapse.

---

## Visual weight (experience-level, not pixel-level)

| Zone | Relative visual weight | Rationale |
|------|------------------------|-----------|
| Zone 1 | **Largest** — headline + supporting chips | 3-second rule: campus first |
| Zone 2 | **Medium** — 3 compact KPI cards | Scannable, not dominant |
| Zone 3 | **High emphasis** — one card, clear CTA | The reason owner opened the app |
| Zone 4 | **Smallest** — single compact strip | Present but not competing |

---

# 3. Dashboard Zones

## Zone 1 — Today's Campus

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Answer: *"What is happening on campus that affects my shop today?"* |
| **Contains** | Campus moment headline, exam/season badge, today's events, weather signal, traffic forecast (High / Normal / Low) |
| **Why it must exist** | Without it, CampusFin has no differentiation. This is the product. |
| **If deleted** | Product becomes a generic revenue tracker. Owner has no reason to choose CampusFin over Excel or any SMB tool. Paying customers leave. |

---

## Zone 2 — Business Health

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Answer: *"How is my shop doing right now?"* |
| **Contains** | Plain-language day label ("Strong day"), revenue, cash flow signal, customer/order count, optional campus-aware annotation per KPI |
| **Why it must exist** | Campus context without shop data is weather app. Owner needs both halves. |
| **If deleted** | Recommendations have no data anchor. AI becomes opinion, not insight. Owner loses trust. |

---

## Zone 3 — Today's Priority

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Answer: *"What is the one thing I should do today?"* |
| **Contains** | Single recommendation OR check-in prompt (if data missing). Title, reason, impact, one primary button. |
| **Why it must exist** | This is the **output** of the operating system. Without action, the product is a report — owners don't pay for reports. |
| **If deleted** | Owner reads numbers and still doesn't know what to do. Daily session has no closure. Product fails the 5-minute value test. |

---

## Zone 4 — Weekly Trend

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Answer: *"Am I getting better or worse over time?"* |
| **Contains** | 7-day sparkline, best-days rhythm, goal progress bar, link to History archive |
| **Why it must exist** | Daily view is tactical. Owners need proof the product remembers and that their actions compound. |
| **If deleted** | Owner has no long-term memory on Dashboard. Must visit separate History page daily — violates simplicity. Retention drops after week 1. |

---

# 4. First Visit Experience

## Problem

A blank Dashboard kills activation. Owners conclude: *"There's nothing here — I'll come back later"* — and never return.

## Principle

**First visit must deliver campus value before business data exists.**

Campus Context (Zone 1) requires **zero owner input**. It must render immediately using campus name from onboarding.

---

## First visit layout (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│  Welcome, Sunrise Coffee ☕                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ ZONE 1: TODAY'S CAMPUS ──────────────── FULL, LIVE DATA ──┐  │
│  │                                                            │  │
│  │  Finals week starts Monday                                 │  │
│  │  [Exam Week]  [Career Fair · Thu]  [Traffic: High ↑]       │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ ZONE 2: BUSINESS HEALTH ────────────── EMPTY, HONEST ─────┐  │
│  │                                                            │  │
│  │  No data yet                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │ Revenue      │  │ Cash Flow    │  │ Customers    │     │  │
│  │  │ —            │  │ —            │  │ —            │     │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ ZONE 3: TODAY'S PRIORITY ───────────── INVITATION ─────────┐  │
│  │                                                            │  │
│  │  Record your first day                                     │  │
│  │  Takes ~30 seconds. Unlock your first campus-aware tip.    │  │
│  │                                                            │  │
│  │  ┌──────────────────────┐                                  │  │
│  │  │   Record today  →    │                                  │  │
│  │  └──────────────────────┘                                  │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ZONE 4: hidden on first visit (no trend data yet)               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## What is populated vs empty on first visit

| Zone | First visit state | Data source |
|------|-------------------|-------------|
| **Zone 1 — Campus** | ✅ Fully populated | Campus name from onboarding + seeded campus calendar / season logic |
| **Zone 2 — Health** | ⬜ Empty placeholders (`—`) | No owner data yet — show dashes, not `$0` |
| **Zone 3 — Priority** | ✅ Check-in invitation | Product logic — not AI |
| **Zone 4 — Trend** | 🚫 Hidden entirely | Appears after day 2+ of recorded data |

---

## What to show before owner inputs anything

| Content | Example | Why |
|---------|---------|-----|
| Personalized greeting | *"Welcome, Sunrise Coffee"* | Ownership feeling — this is MY shop's dashboard |
| Campus headline | *"Finals week starts Monday"* | Immediate campus value — product works on day 0 |
| Business Goal reminder | Small label: *"Your focus: Increase revenue"* | Connects onboarding to dashboard — goal is visible |
| Campus events | Career fair, exam week badge | Proves product knows their campus |
| Traffic forecast | *"High ↑"* even without shop data | Sets expectation: product will connect campus to business |

---

## What NOT to do on first visit

| Anti-pattern | Why it fails |
|--------------|--------------|
| Show `$0.00` revenue | Feels broken, not empty |
| Show generic AI tip without data | Feels made up — owner distrusts immediately |
| Show empty charts | Excel anxiety — owner leaves |
| Show onboarding tour / tooltips | Violates 3-second rule — owner wants value, not a lesson |
| Show "No data" as sole message | Dead end — no forward motion |

---

# 5. Daily Check-in Experience

**Product name:** Record Today (记今天)  
**Experience name:** Daily Check-in — the owner's daily ritual.

---

## When it triggers

| Trigger | Where shown | Priority |
|---------|-------------|----------|
| Today has no record | Zone 3 replaces recommendation with check-in prompt | **Primary action** |
| Owner taps "Record today" on Zone 3 | Navigate to `/dashboard/record` | User-initiated |
| Yesterday missing (optional) | Subtle banner in Zone 2: *"Yesterday not recorded"* + link | Secondary — never blocks today |

**Does NOT trigger via:** push notification (v1), email (Should Have), modal on login.

---

## The form (`/dashboard/record`)

### Required fields (2 only)

| Field | Input type | Validation | Why required |
|-------|------------|------------|--------------|
| **Revenue** | Currency input | > 0 | Core health metric. Drives all KPIs and AI. |
| **Customer count** | Number input | ≥ 0 | Traffic proxy. Connects to campus forecast validation. |

### Optional fields

| Field | Input type | Default | Why optional |
|-------|------------|---------|--------------|
| **Note** | Short text (140 chars) | Empty | Captures context AI can't infer: *"AC broke, fewer dine-in"*. Hidden behind "Add a note" expand. |
| **Date** | Date picker | Today | Only shown when recording a past day (catch-up). Not visible for normal daily flow. |

**No other fields in v1.** No expenses, no inventory, no itemized sales.

---

## Flow (ASCII)

```
Dashboard (Zone 3: "Record today")
        │
        ▼ tap
┌───────────────────────────────┐
│  Record Today                 │
│                               │
│  Revenue *     [$ ________]   │
│  Customers *   [  ________]   │
│                               │
│  + Add a note (optional)      │
│                               │
│  ┌─────────────────────────┐  │
│  │   Save & return  →      │  │
│  └─────────────────────────┘  │
│                               │
│  ~30 seconds                  │
└───────────────────────────────┘
        │
        ▼ save
Dashboard (refreshed)
```

**Time budget:** Form fill ~30–60 sec. Save + return ~2 sec. **Total: under 2 minutes** including reading the new recommendation.

---

## How Dashboard changes after check-in

| Zone | Before check-in | After check-in |
|------|-----------------|----------------|
| **Zone 1** | Unchanged | Unchanged — campus doesn't depend on owner data |
| **Zone 2** | Placeholders (`—`) | Live KPIs populate with animation (subtle, not flashy) |
| **Zone 3** | "Record today" prompt | **Today's Recommendation Card** appears (see §7) |
| **Zone 4** | Hidden (day 1) or previous trend | Updates if ≥ 2 days of data |

---

## How AI appears

AI does **not** appear as chat, typing animation, or loading spinner longer than 1 second.

| Step | Experience |
|------|------------|
| Owner taps Save | Brief save confirmation — button state change |
| Return to Dashboard | Zone 2 KPIs animate in. Zone 3 card **replaces** check-in prompt |
| Recommendation card | Pre-structured card — title, reason, impact. Feels instant, not "generated" |
| If AI unavailable | Zone 3 shows campus-only tip (rule-based fallback): *"Career fair Thursday — consider extending hours."* No error message. |

**Key rule:** Owner never sees "AI is thinking..." — the product presents a **conclusion**, not a process.

---

# 6. Empty States

Every empty state must answer: **what's missing, why it matters, and what to do next.**

Never show bare "No data."

---

## State matrix

| State | Zone 1 | Zone 2 | Zone 3 | Zone 4 |
|-------|--------|--------|--------|--------|
| **Just registered** | ✅ Full campus | `—` placeholders | "Record your first day" | Hidden |
| **No data today** | ✅ Full campus | Yesterday's data + "Today: not recorded" | "Record today" CTA | Previous trend if ≥ 2 days |
| **3 days no record** | ✅ Full campus | Stale data + amber label: *"Last recorded: 3 days ago"* | "Catch up — record missing days" with date links | Frozen at last known |
| **No campus data** | Rule-based fallback (season only) | Per above | Campus-only tip (no AI) | Per above |
| **AI unavailable** | ✅ Full campus | ✅ Live KPIs | Rule-based campus tip (no "AI error") | Per above |

---

## Empty state copy — examples

### Just registered (Zone 3)

```
Record your first day
Takes ~30 seconds. Unlock your first campus-aware tip.

[ Record today → ]
```

### No data today (Zone 3)

```
Record today
You haven't logged today yet. One number away from your daily tip.

[ Record today → ]
```

### 3 days no record (Zone 2 + Zone 3)

Zone 2 label: `Last recorded: Friday · data may be outdated`

Zone 3:
```
Catch up on missing days
Your trends are paused. Record the last 3 days to restore accuracy.

[ Record Friday → ]  [ Record Saturday → ]  [ Record Sunday → ]
```

### No campus event data (Zone 1)

```
Exam season continues
No specific campus events today — traffic expected: Normal

[ Based on academic calendar for {campus name} ]
```

### AI unavailable (Zone 3)

```
Tip for today
Career fair this Thursday — consider prepping extra inventory.
Based on campus calendar · Your goal: Increase revenue

[ Got it → ]
```

No mention of "AI error" or "service unavailable."

---

# 7. AI Card Design

## Today's Recommendation Card

AI output is **one card** — not a conversation, not a list, not a report section.

---

## Card structure (ASCII)

```
┌─ TODAY'S PRIORITY ──────────────────────────────────────────────┐
│                                                                 │
│  ★  Extend hours to 8pm on Thursday                            │  ← TITLE (action verb + specifics)
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Why                                                            │  ← REASON label (not "AI says")
│  Career fair at 2pm + revenue up 12% this week.                │
│  Your goal: Increase revenue.                                   │
│                                                                 │
│  Expected impact                                                │  ← IMPACT label
│  +$120–180 estimated revenue                                    │
│                                                                 │
│  ┌─────────────────────┐                                        │
│  │      Got it  →      │                                        │  ← single PRIMARY BUTTON
│  └─────────────────────┘                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Field definitions

| Field | Rules | Example |
|-------|-------|---------|
| **Title** | Starts with action verb. Max 12 words. Specific to today or tomorrow. | *"Extend hours to 8pm on Thursday"* |
| **Why** | 1–2 sentences. Must reference campus context + data + business goal. Label: "Why" — not "AI analysis" or "Insight". | *"Career fair at 2pm + revenue up 12%. Your goal: Increase revenue."* |
| **Expected impact** | Plain range estimate. Label: "Expected impact". Omit if truly unknowable — never fabricate precision. | *"+$120–180 estimated revenue"* |
| **Primary button** | Single CTA. Default: **"Got it"**. Alternative when action is external: **"I'll do this"**. Never "Chat more" or "Tell me more". | `[ Got it → ]` |

---

## What this card deliberately excludes

| Excluded | Why |
|----------|-----|
| Chat input | Trains wrong behavior. Product is not ChatGPT. |
| "Ask a follow-up" link | Invites endless conversation. Violates 5-minute rule. |
| Multiple recommendations | One action per day. Owner is not a project manager. |
| Confidence percentage | Feels like ML demo, not business advice. |
| Source citations / footnotes | Owner doesn't care about data pipeline — they care about the action. |
| Thumbs up / down | Feedback loop deferred — don't clutter v1 card. |

---

## Why this design

| Principle | How the card delivers |
|-----------|----------------------|
| **Actionable** | Title is a verb — owner knows what to do |
| **Trustworthy** | "Why" links campus + their data + their goal — not a black box |
| **Calm** | One card, one button — Linear/Apple restraint |
| **Not AI-branded** | No robot icon, no "AI-powered" badge, no sparkle emoji |
| **Closure** | "Got it" ends the session — owner feels done |

---

## Card states

| State | Card shows |
|-------|------------|
| **Data recorded today** | Full recommendation card |
| **Data not recorded** | Check-in invitation (not AI card) |
| **AI unavailable** | Rule-based campus tip — same card structure, no AI branding |
| **Owner tapped "Got it"** | Card collapses to single line: *"Today's priority: Extend hours Thursday ✓"* — still visible, no longer dominant |

---

# 8. Campus Card Design

## Today's Campus

The largest, topmost element on Dashboard. Always Zone 1. Always renders — even with zero business data.

---

## Card structure (ASCII)

```
┌─ TODAY'S CAMPUS ────────────────────────────────────────────────┐
│                                                                 │
│  Finals week starts Monday — expect busier evenings             │  ← HEADLINE (1 sentence)
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ 📅 Exam Week │  │ 🎓 Career    │  │ 👥 Traffic           │  │
│  │    Active    │  │    Fair·Thu  │  │    High ↑            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐                                               │
│  │ 🌧 Rain      │  ← only if weather affects operations         │
│  │    tomorrow  │                                               │
│  └──────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component definitions

| Component | Content | Always shown? |
|-----------|---------|---------------|
| **Headline** | One sentence connecting campus moment to business implication | ✅ Always |
| **Campus moment chip** | Exam week / Graduation / Back-to-school / Midterm break | ✅ If active |
| **Event chip** | Named event + date: *"Career Fair · Thu"* | ✅ If event exists |
| **Traffic forecast** | High ↑ / Normal → / Low ↓ with one-line basis | ✅ Always (rule-based from season + events) |
| **Weather chip** | Only shown when weather affects foot traffic (rain, extreme heat) | ⚠️ Conditional |

---

## Headline examples

| Campus state | Headline |
|--------------|----------|
| Exam week starting | *"Finals week starts Monday — expect busier evenings"* |
| Career fair tomorrow | *"Career fair tomorrow at 2pm — lunch rush likely"* |
| Graduation season | *"Graduation weekend — higher walk-in traffic expected"* |
| Quiet period | *"Midterm break — traffic may be lighter this week"* |
| Rain forecast | *"Rain expected tomorrow — delivery orders may increase"* |

---

## Why Campus Card is always Layer 1

| Reason | Explanation |
|--------|-------------|
| **Competitive moat** | No other SMB tool leads with campus context. This IS the product. |
| **Owner mental model** | Shop owners already think campus-first: *"School starts Monday — I need more milk."* CampusFin mirrors how they already think. |
| **Daily return hook** | Campus changes every day. Revenue alone doesn't change enough to drive daily opens. |
| **AI quality** | Recommendations without campus context are generic. Campus Card is the input owners see — makes AI feel smart. |
| **3-second rule** | Owner's first question is always about the environment, not their spreadsheet. |

**If Campus Card moves below Business Health:** Product fails the "hide the logo" test — becomes interchangeable with any analytics tool.

---

## Campus Card — no data fallback

When campus event API has no data:

```
┌─ TODAY'S CAMPUS ────────────────────────────────────────────────┐
│                                                                 │
│  Exam season continues at {Campus Name}                         │
│                                                                 │
│  [ Exam Season ]    [ Traffic: Normal → ]                       │
│                                                                 │
│  Based on academic calendar                                     │
└─────────────────────────────────────────────────────────────────┘
```

Never empty. Never "No campus data." Academic calendar + season logic provides minimum viable campus context.

---

# 9. Dashboard Design Principles

Ten rules. Non-negotiable.

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Campus First** | Zone 1 is always top, always populated, always largest. |
| 2 | **Business Second** | KPIs interpret campus — never lead the page. |
| 3 | **Action Third** | One recommendation closes the session. Owner leaves with a verb. |
| 4 | **History Last** | Trends support decisions — they don't replace them. Bottom of page only. |
| 5 | **Three-Second Scan** | Campus → Health label → Action. No scrolling required for core comprehension. |
| 6 | **One Screen** | Daily loop completes without navigating away from Dashboard (check-in excepted). |
| 7 | **One Action** | One primary button per page. One recommendation per day. |
| 8 | **No Blank States** | Empty data shows invitation, not absence. Campus always renders. |
| 9 | **No Chat** | AI is a card, not a conversation. Conclusions, not processes. |
| 10 | **Five-Minute Max** | If a session exceeds 5 minutes, the design has failed. |

---

# Sprint Summary

## 1. 修改了什么

| Deliverable | Content |
|-------------|---------|
| `docs/DESIGN-SYSTEM.md` | 从占位符完整重写为 Sprint 2 Dashboard 体验设计文档 |
| **§1** | 老板一天完整使用流程（打开 → 3 秒浏览 → Check-in → AI 建议 → 关闭） |
| **§2** | Dashboard 四层 ASCII 布局 + 顺序不可交换的理由 |
| **§3** | 四个 Zone 的定义、目的、删除后果 |
| **§4** | 首次访问体验 — 避免空 Dashboard |
| **§5** | Daily Check-in（Record Today）完整体验 — 2 字段、2 分钟内完成 |
| **§6** | 5 种空状态的具体表达方式 |
| **§7** | Today's Recommendation Card 结构与设计理由 |
| **§8** | Today's Campus Card 结构 + 永远第一层的理由 |
| **§9** | 10 条 Dashboard 设计原则 |

**未修改：** 应用代码、数据库、`PRODUCT.md`、`IA.md`、`DATABASE.md`、`AI-ENGINE.md`、`ROADMAP.md`。

**刻意未包含：** 颜色、字体、按钮样式、组件 token — 留给未来 Sprint。

---

## 2. 为什么这样设计

| 设计选择 | 原因 |
|----------|------|
| Campus Card 永远第一层 | CampusFin 的竞争力是校园场景，不是 AI。老板先关心「学校发生什么」，再关心「我赚了多少」。 |
| 每日只有一个 AI 建议 | 老板不是项目经理。一个行动 = 会话闭环。多个建议 = 决策瘫痪。 |
| AI 以卡片呈现，不是对话 | 避免 ChatGPT 心智模型。老板要结论，不要聊天。 |
| Check-in 只有 2 个必填字段 | 2 分钟以内完成。多一个字段 = 多 30 秒 = 留存下降。 |
| 首次访问 Campus 满数据、经营数据空 | 注册当天就要证明产品有价值。校园数据不需要老板输入。 |
| Zone 4 在首日隐藏 | 没有趋势数据时不展示空图表。避免 Excel 焦虑。 |
| 「Got it」作为唯一按钮 | 会话自然结束。老板感到「做完了」，不是「还有更多要看」。 |

---

## 3. 最大的产品提升

**Sprint 1.1 定义了 IA 层级（Campus → Health → Action → History）。**

**Sprint 2 将层级转化为可执行的产品体验：**

| Before (IA only) | After (Experience design) |
|------------------|---------------------------|
| 四层结构是文档概念 | 每层有 ASCII 布局、字段定义、状态变化规则 |
| 「Campus First」是原则 | Campus Card 有具体组件、headline 示例、无数据 fallback |
| 「Record Today」是路由名 | Daily Check-in 有完整流程、触发规则、2 分钟时间预算 |
| 「空状态」是一句话 | 5 种空状态各有具体文案和 Zone 级行为 |
| AI 输出未定义形态 | Recommendation Card 有标题/原因/影响/按钮的严格规范 |

**核心提升：** Dashboard 从一个「信息架构概念」变为一个 **老板可以在 3 秒内完成扫描、5 分钟内完成使用的操作系统体验**。

---

## 4. 对 Sprint 3 有什么影响

Sprint 3 建议 focus（待 Founder 确认）：

| Area | Sprint 2 输出 → Sprint 3 输入 |
|------|-------------------------------|
| **DATABASE.md** | `daily_log`（revenue, customer_count, note, date）、`business_goal`、`campus_events` 表结构可从 Zone 定义推导 |
| **AI-ENGINE.md** | Recommendation Card 的输入 = Campus Context + Health KPIs + Business Goal；输出 = title + why + impact 三元组 |
| **Implementation** | 四个 Zone 对应四个 React 组件区域；Card 结构可直接映射为组件 props |
| **Campus data** | Zone 1 fallback 逻辑（academic calendar + season）需在 Sprint 3 定义数据来源 |

**Sprint 3 不应做：** UI 像素实现（除非 Founder 调整优先级）。建议继续文档先行：Database schema + AI output contract。

---

## 5. 还有哪些问题需要继续思考

| # | Open question | Why it matters |
|---|---------------|----------------|
| 1 | **Campus 数据从哪来？** 手动录入 / 学术日历 API / 合作学校？ | Zone 1 的质量取决于数据源。MVP 可用 rule-based，但需定义边界。 |
| 2 | **Traffic forecast 的算法？** 纯规则还是 ML？ | 错误预测会损害信任。v1 建议保守：High / Normal / Low 三档 + 学术日历。 |
| 3 | **「Got it」之后反馈闭环？** 是否追踪老板是否执行了建议？ | 影响 AI 质量迭代，但增加复杂度。建议 v1 仅记录 acknowledge 时间戳。 |
| 4 | **Missed days 的 catch-up UX** — 连续 3 天未记录时，是否强制补录？ | 当前设计为邀请式，不强制。需用真实用户验证是否足够。 |
| 5 | **不同业态的 KPI 差异** — 美甲店「客户数」vs 打印店「订单数」？ | Zone 2 标签可能需按 business type 变化。建议 v1 统一为「Customers」文案。 |
| 6 | **Visual Design System 何时启动？** | Sprint 2 定义了体验层级和相对视觉权重，但无 color/type token。需排期 Sprint 4 或合并入 Sprint 3 UI 实现前。 |

---

**Sprint 2 完成。等待 Founder 审核。不自动进入 Sprint 3。**
