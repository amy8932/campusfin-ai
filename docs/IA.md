# CampusFin AI — Information Architecture

**Milestone 1:** Product Foundation  
**Sprint:** Sprint 1.1 — Information Architecture Optimization  
**Status:** Complete  
**Last updated:** 2026-07-06

---

## Table of Contents

1. [Product Structure](#1-product-structure)
2. [Dashboard Information Architecture](#2-dashboard-information-architecture)
3. [Page Definitions](#3-page-definitions)
4. [Page Naming Decisions](#4-page-naming-decisions)
5. [Business Goal Design](#5-business-goal-design)
6. [Navigation System](#6-navigation-system)
7. [User Journey](#7-user-journey)
8. [MVP Scope](#8-mvp-scope)
9. [Three Second Rule](#9-three-second-rule)
10. [Product Simplicity Review](#10-product-simplicity-review)
11. [Sprint Summary (Sprint 1)](#sprint-summary-sprint-1)
12. [Sprint 1.1 Change Log](#sprint-11-change-log)

---

## Product positioning in IA

CampusFin AI's competitive moat is **not AI** — it is **Campus Context**.

Generic business dashboards answer: *How is my revenue?*

CampusFin answers: *Given what's happening on campus this week, how should I run my shop?*

If you hide the logo, the product must **not** look like a generic AI analytics tool. Campus context must be **Layer 1** of the product — not a card buried below KPIs.

---

# 1. Product Structure

CampusFin AI is organized into three product zones.

```
CampusFin AI
│
├── PUBLIC                              (Acquire & convert)
│   └── Landing                           /
│
├── AUTHENTICATION                        (Identity & onboarding)
│   ├── Sign Up                           /signup
│   ├── Log In                            /login
│   ├── Forgot Password                   /forgot-password
│   └── Onboarding                        /onboarding
│       ├── Step 1 — Create Business
│       └── Step 2 — Set Business Goal      (same route, no new page)
│
└── APPLICATION                         (Daily campus operating system)
    ├── Today (Dashboard)                 /dashboard
    ├── Record Today                      /dashboard/record
    ├── Weekly Review                     /review/weekly
    └── Settings                          /settings
        ├── Business Profile              /settings/business
        └── Account                       /settings/account

Deferred (not in v1 primary IA):
    └── Pricing                           /pricing
    └── History (archive)                 /history   ← demoted, not primary nav
```

## Zone summaries

| Zone | Purpose | Who sees it |
|------|---------|-------------|
| **Public** | Sell campus-specific value, drive sign-up | Prospects |
| **Authentication** | Identity + business setup + goal selection | New and returning owners |
| **Application** | Daily campus-aware operating system | Authenticated owners |

## Design intent

- **Campus Context is the product's front door** — Dashboard opens with campus environment, not revenue charts.
- **Single daily home:** `/dashboard` — owners never wonder where to start.
- **No AI Chat zone** — recommendations appear as structured action cards.
- **Flat hierarchy:** Two levels max inside Application.
- **Three primary nav items** — down from four. History demoted; Pricing deferred.

---

# 2. Dashboard Information Architecture

## Positioning

The Dashboard is **not a generic business analytics page**.

It is a **Campus Operating View** — a single screen that connects what's happening at the university to what the owner should do in their shop today.

> **Dashboard job-to-be-done:**  
> "Tell me what's happening on campus, how my shop is doing because of it, and what I should do right now — in under 3 seconds."

## Information hierarchy (top → bottom)

Owners scan in this order. **Never invert these layers.**

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1 — CAMPUS CONTEXT          ★ Competitive moat     │
│  What's happening around campus that affects my shop?       │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2 — BUSINESS HEALTH                                  │
│  How is my shop performing right now?                       │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3 — ACTION                                           │
│  What should I do today — and why?                          │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4 — HISTORY TRENDS                                   │
│  Am I getting better or worse over time?                    │
└─────────────────────────────────────────────────────────────┘
```

---

### Layer 1 — Campus Context *(always visible, always first)*

**Purpose:** Anchor every session in the campus environment. This is what makes CampusFin irreplaceable for a generic BI tool.

| Component | Examples |
|-----------|----------|
| **Campus moment** | Exam week · Graduation season · Back-to-school · Midterm break |
| **Today's campus events** | Career fair · Sports game · Club festival · Guest lecture |
| **Environmental signals** | Weather (rain → delivery spike) · Holiday proximity |
| **Traffic forecast** | "Expected student foot traffic: High / Normal / Low" |

**Display rules:**
- One headline sentence at the very top of Dashboard: e.g. *"Finals week starts Monday — expect 30% higher evening traffic."*
- Never collapse Campus Context below Business Health.
- Even on empty state (no data logged), Campus Context must render with real campus signals.

**3-second test:** *"I immediately know what's happening on campus that affects my shop."*

---

### Layer 2 — Business Health

**Purpose:** Show the owner's current operating state — interpreted **in light of Layer 1**, not in isolation.

| Component | Examples |
|-----------|----------|
| **Today's revenue** | vs. same day last week |
| **Cash flow signal** | Healthy / Tight / At risk |
| **Order / customer count** | vs. 7-day average |
| **Business health score** | Single composite score with plain-language label |

**Display rules:**
- Maximum 3 KPIs visible without scrolling.
- Each KPI includes a one-line campus-aware annotation when relevant: e.g. *"Revenue up 12% — aligns with pre-finals rush."*
- Health score uses owner language: "Strong day" / "Normal" / "Needs attention" — not numeric jargon alone.

**3-second test:** *"I know if my shop is doing okay today."*

---

### Layer 3 — Action

**Purpose:** One clear, actionable recommendation tied to Campus Context + Business Health + Business Goal.

| Component | Content |
|-----------|---------|
| **Today's action** | One primary recommendation — not a list |
| **Why** | One sentence linking campus context + data: *"Career fair Thursday + your goal is revenue → extend happy hour to 8pm."* |
| **Expected impact** | Plain estimate: *"Could add ~$120–180 today."* |
| **Primary CTA** | Acknowledge · Snooze · or trigger Record Today if data missing |

**Display rules:**
- Exactly **one** primary action card — the most important thing today.
- All AI output lives here or in Weekly Review — never as free-form chat.
- Recommendations **must be filtered by Business Goal** set during onboarding (see §5).

**3-second test:** *"I know exactly what to do next and why."*

---

### Layer 4 — History Trends

**Purpose:** Help owners build long-term intuition — without leaving Dashboard for daily use.

| Component | Content |
|-----------|---------|
| **7-day revenue sparkline** | Minimal trend, no chart junk |
| **Weekly rhythm indicator** | "Your best days: Thu–Sat" |
| **Goal progress** | Progress toward current Business Goal |
| **Archive link** | "View past records →" links to `/history` (secondary, not nav) |

**Display rules:**
- Compact — occupies bottom of Dashboard, never competes with Layers 1–3.
- This layer replaces the need for a daily History visit for most owners.
- Full archive (`/history`) is for occasional deep lookup only.

**3-second test:** *"I can see if things are trending up or down."*

---

## Dashboard states

| State | Layer 1 | Layer 2 | Layer 3 | Layer 4 |
|-------|---------|---------|---------|---------|
| **First visit** (no data) | Full campus context | Empty KPIs with prompt | "Record today to unlock your first recommendation" | Hidden |
| **Daily return** (data exists) | Full campus context | Live KPIs | Today's action card | 7-day sparkline |
| **Missed yesterday** | Full campus context | Partial KPIs | "Record yesterday first" as primary action | Last known trend |

---

## What Dashboard is NOT

- ❌ A revenue-first analytics page
- ❌ A campus events browser (events inform Layer 1 — they are not a destination)
- ❌ An AI chat window
- ❌ A table of historical transactions

---

# 3. Page Definitions

## PUBLIC

### Landing (`/`)

| Field | Definition |
|-------|------------|
| **Purpose** | Communicate campus-specific value — not generic AI analytics. |
| **Primary User** | Campus-area shop owner evaluating tools. |
| **Core Components** | Hero (campus context angle), 3 benefit cards (campus events / business health / daily action), social proof, CTA. **No generic "AI-powered insights" copy.** |
| **Primary Action** | **Start free** → `/signup` |
| **Entry Point** | Direct URL, marketing, referrals. |
| **Exit Point** | Sign Up, Log In. |
| **Why this page exists** | Must immediately signal "built for campus shops" — not interchangeable with any SMB analytics tool. |

---

## AUTHENTICATION

### Sign Up (`/signup`)

| Field | Definition |
|-------|------------|
| **Purpose** | Create owner account with minimal friction. |
| **Primary User** | New owner ready to try. |
| **Core Components** | Email + password, terms, link to Log In. |
| **Primary Action** | **Create account** → `/onboarding` |
| **Entry Point** | Landing. |
| **Exit Point** | Onboarding. |
| **Why this page exists** | Standard SaaS gate. Must feel fast. |

---

### Log In (`/login`)

| Field | Definition |
|-------|------------|
| **Purpose** | Return owners to Dashboard in one step. |
| **Primary User** | Returning owner. |
| **Core Components** | Email + password, forgot password link. |
| **Primary Action** | **Log in** → `/dashboard` |
| **Entry Point** | Landing, bookmark. |
| **Exit Point** | Dashboard. |
| **Why this page exists** | Daily re-entry must be frictionless. |

---

### Forgot Password (`/forgot-password`)

| Field | Definition |
|-------|------------|
| **Purpose** | Self-service password recovery. |
| **Primary User** | Locked-out owner. |
| **Core Components** | Email input, confirmation state. |
| **Primary Action** | **Send reset link** |
| **Entry Point** | Log In. |
| **Exit Point** | Log In. |
| **Why this page exists** | Operational necessity — avoids manual support. |

---

### Onboarding (`/onboarding`)

Two steps. **One route. No new page.**

| Field | Definition |
|-------|------------|
| **Purpose** | Capture business identity + strategic goal so Dashboard is campus-aware and goal-aligned from first visit. |
| **Primary User** | New owner, first session. |
| **Core Components** | **Step 1:** Business name, type, campus/area name. **Step 2:** Business Goal selection (see §5). |
| **Primary Action** | Step 1: **Continue** → Step 2. Step 2: **Go to dashboard** → `/dashboard` |
| **Entry Point** | Sign Up completion. Required before app access. |
| **Exit Point** | Dashboard. |
| **Why this page exists** | Without campus identity + business goal, recommendations are generic — indistinguishable from any AI tool. |

---

## APPLICATION

### Today — Dashboard (`/dashboard`)

| Field | Definition |
|-------|------------|
| **Purpose** | Campus Operating View — four-layer hierarchy (§2). |
| **Primary User** | Owner, daily visit. |
| **Core Components** | Layer 1 Campus Context → Layer 2 Business Health → Layer 3 Action → Layer 4 History Trends. |
| **Primary Action** | Context-dependent: **Record today** (if no data) OR **Act on today's recommendation** (if data exists). |
| **Entry Point** | Log In, default app route. |
| **Exit Point** | Record Today, Weekly Review, History (via Layer 4 link), Settings. |
| **Why this page exists** | The entire product lives here for 80%+ of sessions. Campus context + action in one view. |

---

### Record Today (`/dashboard/record`)

| Field | Definition |
|-------|------------|
| **Purpose** | Capture today's essential numbers in under 2 minutes — the daily input ritual. |
| **Primary User** | Owner at open or close. |
| **Core Components** | Date (default today), revenue, customer/order count, optional note. |
| **Primary Action** | **Save & return** → `/dashboard` (Layers 2–3 update) |
| **Entry Point** | Dashboard Layer 3 CTA or Layer 2 empty state. |
| **Exit Point** | Dashboard. |
| **Why this page exists** | Structured input feeds health scores and campus-aware recommendations. Not a navigation destination — a task. |

---

### Weekly Review (`/review/weekly`)

| Field | Definition |
|-------|------------|
| **Purpose** | Weekly campus + business synthesis — the "look back, plan ahead" ritual (~3 min, once per week). |
| **Primary User** | Owner doing Sunday/Monday weekly check-in. |
| **Core Components** | Layer 1 recap (campus events this past week + next week), Layer 2 weekly health summary, Layer 3 next week's priority action, Layer 4 week-over-week trend. |
| **Primary Action** | **Confirm next week's focus** (aligned to Business Goal) |
| **Entry Point** | Sidebar / mobile tab, Dashboard Layer 4 link. |
| **Exit Point** | Dashboard. |
| **Why this page exists** | Dashboard handles *today*. Weekly Review handles *this week* — different time horizon, same four-layer logic. |

---

### History — Archive (`/history`)

| Field | Definition |
|-------|------------|
| **Purpose** | Occasional deep lookup of past daily records and weekly reviews. |
| **Primary User** | Owner verifying a past entry or revisiting old advice. |
| **Core Components** | Reverse-chronological card list, grouped by week. Read-only. |
| **Primary Action** | **Open a past entry** |
| **Entry Point** | Dashboard Layer 4 "View past records" link only — **not in primary nav.** |
| **Exit Point** | Dashboard. |
| **Why this page exists** | Trust and auditability. Low frequency — does not deserve a daily nav slot. |

---

### Settings (`/settings`)

| Field | Definition |
|-------|------------|
| **Purpose** | Business profile, account, and Business Goal (editable). Infrequent. |
| **Primary User** | Owner updating context or credentials. |
| **Core Components** | Links to Business Profile, Account. Business Goal visible and editable on Business Profile. |
| **Primary Action** | Context-dependent save. |
| **Entry Point** | Avatar menu / sidebar footer — not a daily destination. |
| **Exit Point** | Sub-pages or Dashboard. |
| **Why this page exists** | SaaS utility. Must exist; must not compete with Dashboard. |

---

### Settings: Business Profile (`/settings/business`)

| Field | Definition |
|-------|------------|
| **Purpose** | Edit business name, type, campus area, **Business Goal**. |
| **Primary User** | Owner after relocation, goal shift, or correction. |
| **Core Components** | Onboarding fields (editable) + Business Goal selector. |
| **Primary Action** | **Save changes** |
| **Entry Point** | Settings. |
| **Exit Point** | Settings or Dashboard. |
| **Why this page exists** | Campus context and goal alignment degrade without editable profile. |

---

### Settings: Account (`/settings/account`)

| Field | Definition |
|-------|------------|
| **Purpose** | Email, password, log out, delete account. |
| **Primary User** | Any authenticated owner. |
| **Core Components** | Standard account management. |
| **Primary Action** | **Save** or **Log out** |
| **Entry Point** | Settings. |
| **Exit Point** | Log In (after log out). |
| **Why this page exists** | Standard SaaS hygiene. |

---

# 4. Page Naming Decisions

## Record Today *(formerly "Log Today")*

| | |
|---|---|
| **Old name** | Log Today |
| **New name** | **Record Today** |
| **Route** | `/dashboard/record` *(was `/dashboard/log`)* |
| **Owner-facing label (ZH)** | 记今天 |

**Why changed:**

- "Log" is developer language (log files, log entries). Business owners never say *"I need to log today."*
- Owners say: *"记一下今天的账"* / *"把今天营业情况记下来"* — **Record** matches this mental model.
- "Record Today" sounds like a 30-second daily ritual, not a software task.
- Pairs naturally with Dashboard Layer 3: *"Record today to unlock your recommendation."*

---

## Weekly Review *(formerly "Weekly Report")*

| | |
|---|---|
| **Old name** | Weekly Report |
| **New name** | **Weekly Review** |
| **Route** | `/review/weekly` *(was `/reports/weekly`)* |
| **Owner-facing label (ZH)** | 本周复盘 |

**Why changed:**

- "Report" implies something you **receive and file away** — passive, bureaucratic.
- Owners actively **复盘** (review and reflect) every week — this is a ritual, not a document.
- "Weekly Review" matches the owner's question: *"这周做得怎么样？下周怎么办？"*
- Aligns with campus context: review includes what happened on campus this week and what's coming.

---

## Names kept unchanged

| Name | Route | Reason to keep |
|------|-------|----------------|
| **Today** (nav label for Dashboard) | `/dashboard` | Universal, time-grounded. Owner opens app asking "what about today?" |
| **History** | `/history` | Clear archive semantics. Demoted from nav but name still valid for deep lookup. |
| **Settings** | `/settings` | Industry standard. Owners expect it. Infrequent use justifies generic name. |
| **Onboarding** | `/onboarding` | Internal/product term — owners see step titles, not route name. |

---

# 5. Business Goal Design

## What it is

A single strategic priority the owner selects during onboarding. All Layer 3 recommendations and Weekly Review priorities are **filtered and framed** through this goal.

## Options (v1)

| Goal | Owner language (ZH) | What AI optimizes for |
|------|---------------------|----------------------|
| **Increase revenue** | 提升营业额 | Upsell timing, traffic capture, event-based promotions |
| **Improve repeat rate** | 提高复购率 | Loyalty moments, regular customer patterns |
| **Improve cash flow** | 改善现金流 | Expense timing, slow-day strategies, prep cost control |
| **Improve customer satisfaction** | 提升用户评价 | Service quality signals, complaint prevention |

Single select. One goal active at a time. Changeable in Settings → Business Profile.

---

## Where it lives in IA

```
/onboarding
  Step 1 — Create Business        (identity + campus)
  Step 2 — Set Business Goal        (strategy)           ← NEW
       ↓
/dashboard
  Layer 3 — Action                  (filtered by goal)
       ↓
/review/weekly
  Layer 3 — Next week's focus       (aligned to goal)
       ↓
/settings/business
  Business Goal (editable)          (owner changes strategy)
```

**No new page.** Step 2 is a second screen on the existing `/onboarding` route.

---

## Why this design

| Decision | Rationale |
|----------|-----------|
| **In onboarding, not Settings-first** | Goal must exist before first Dashboard visit — otherwise first recommendation is generic and product loses credibility immediately. |
| **Single select, not multi** | Owners have one dominant worry at a time. Multiple goals dilute recommendations and violate "one primary action" principle. |
| **Same four options, no free text** | Constrained choices keep AI output focused and testable. Free text invites vague prompts and bad recommendations. |
| **Editable in Settings** | Businesses evolve (survival mode → growth mode). Goal changes without re-onboarding. |
| **Not a Dashboard page** | Goal is a **lens**, not a destination. It shapes Layer 3 — it doesn't need its own screen. |

---

## How it connects to Campus Context

Recommendations combine **Campus Context × Business Health × Business Goal**:

> *"Finals week starts Monday **[Campus]** · Revenue down 8% vs last week **[Health]** · Your goal is repeat customers **[Goal]** → Launch a 'study bundle' for regulars this weekend. Expected impact: 15–20 returning customers."*

Without Business Goal, the same data might suggest a revenue promotion — wrong for an owner focused on loyalty.

---

# 6. Navigation System

## Design principles

1. **Three primary nav items** — down from four. History removed from daily nav.
2. **Dashboard is always one click away** — logo / "Today" returns home.
3. **Campus Context visible on Dashboard top** — not hidden in a sub-page.
4. **Settings deprioritized** — avatar menu + sidebar footer, never prominent.

---

## Desktop navigation

### Sidebar (primary) — 3 items

| Item | Destination | Why it exists |
|------|-------------|---------------|
| **Today** | `/dashboard` | Daily campus operating view. 80%+ of sessions. |
| **Weekly Review** | `/review/weekly` | Weekly rhythm — different time horizon from Today. |
| **Settings** | `/settings` | Utility. Last position. |

**Removed from nav:** History → accessible via Dashboard Layer 4 only.

**Sidebar footer:** Business name + campus area + active Business Goal icon/label (context reminder).

### Top bar

| Element | Why it exists |
|---------|---------------|
| **CampusFin logo** | Brand anchor → Dashboard. |
| **Current date** | Grounds owner in "today." |
| **Campus moment badge** | e.g. "Exam week" — reinforces Layer 1 without opening Dashboard on return visits. |
| **Avatar menu** | Account, log out. |

**Omitted:** Search, notifications bell, chat, History link, multi-store switcher.

---

## Mobile navigation

### Bottom tab bar — 3 tabs

| Tab | Destination |
|-----|-------------|
| **Today** | `/dashboard` |
| **Review** | `/review/weekly` |
| **Settings** | `/settings` |

**Record Today:** Full-screen task from Dashboard — not a tab.

---

## Public & auth navigation

| Zone | Navigation |
|------|------------|
| **Public** | Logo, Log In, **Start free**. No Pricing link in v1 header (defer). |
| **Auth / Onboarding** | Logo only. Focused forms. Step indicator on onboarding (Step 1 of 2). |

---

# 7. User Journey

```
Landing → Sign Up → Onboarding (Business + Goal) → Dashboard → Record Today → Campus-aware Action → Weekly Review → Return Tomorrow
```

---

## Stage 1: Landing

| Dimension | Detail |
|-----------|--------|
| **User thinks** | "I run a shop near campus. Does this understand my world?" |
| **User sees** | Campus-first headline — not "AI-powered analytics." e.g. *"Know what's happening on campus — and what to do about it."* |
| **User does** | Clicks **Start free**. |

---

## Stage 2: Sign Up

| Dimension | Detail |
|-----------|--------|
| **User thinks** | "Quick, I hope." |
| **User sees** | Email + password. Nothing else. |
| **User does** | Creates account → `/onboarding`. |

---

## Stage 3: Onboarding — Step 1 (Create Business)

| Dimension | Detail |
|-----------|--------|
| **User thinks** | "They need to know my shop. One minute max." |
| **User sees** | Business name, type (Coffee Shop), campus name. "Step 1 of 2." |
| **User does** | Fills 3 fields → **Continue**. |

---

## Stage 4: Onboarding — Step 2 (Business Goal)

| Dimension | Detail |
|-----------|--------|
| **User thinks** | "What's my biggest headache right now?" |
| **User sees** | Four goal options with plain language. Single select. "Step 2 of 2." |
| **User does** | Selects **Increase revenue** → **Go to dashboard**. |

---

## Stage 5: Dashboard (first visit)

| Dimension | Detail |
|-----------|--------|
| **User thinks** | "Show me something about MY campus — not a blank chart." |
| **User sees** | **Layer 1:** *"Career fair this Thursday — expect high foot traffic."* **Layer 2:** Empty KPIs. **Layer 3:** *"Record today to unlock your first recommendation."* |
| **User does** | Clicks **Record today**. |

---

## Stage 6: Record Today

| Dimension | Detail |
|-----------|--------|
| **User thinks** | "Two numbers, done." |
| **User sees** | Revenue + customer count. Large inputs. |
| **User does** | Enters $842, 67 customers → saves. |

---

## Stage 7: Dashboard (return after recording)

| Dimension | Detail |
|-----------|--------|
| **User thinks** | "What should I do about the career fair?" |
| **User sees** | **Layer 1:** Career fair Thursday. **Layer 2:** Revenue above average. **Layer 3:** *"Extend hours to 8pm Thursday — career fair foot traffic + your revenue goal. Expected impact: +$120–180."* **Layer 4:** First day of trend line. |
| **User does** | Reads action. Done in **under 3 minutes**. |

---

## Stage 8: Weekly Review (Sunday)

| Dimension | Detail |
|-----------|--------|
| **User thinks** | "How was this week? What's coming on campus?" |
| **User sees** | Past week campus events recap + next week preview. Weekly health. One priority for next week aligned to goal. |
| **User does** | Confirms next week's focus. **3–5 minutes.** |

---

## Stage 9: Return tomorrow

| Dimension | Detail |
|-----------|--------|
| **User thinks** | "What's campus like today? Am I okay?" |
| **User sees** | Layer 1 campus moment first. Layer 2 health. Layer 3 action if needed. |
| **User does** | 3-second scan. Optional record. Leave. **Habit established.** |

---

# 8. MVP Scope

## Must Have

| Feature | Why |
|---------|-----|
| Landing (campus-positioned copy) | Acquisition with differentiated message. |
| Sign Up / Log In / Forgot Password | Identity. |
| Onboarding Step 1 + Step 2 (Business Goal) | Campus identity + strategic lens from day one. |
| Dashboard four-layer hierarchy | Core product. Campus Context as Layer 1. |
| Record Today | Daily input ritual. |
| Campus-aware action card (Layer 3) | Proves value — filtered by goal + campus. |
| Weekly Review | Weekly rhythm with campus recap. |
| Settings (business + account + goal edit) | SaaS minimum. |
| 3-item navigation | Today · Weekly Review · Settings. |

## Should Have

| Feature | Why |
|---------|-----|
| History archive page (`/history`) | Trust — but accessed from Dashboard only, not nav. |
| Campus moment badge in top bar | Reinforces campus positioning on every screen. |
| Pricing page | B2B conversion — defer until beta validates demand. |
| Email reminder to record | Retention — after core loop proven. |

## Could Have

| Feature | Why deferred |
|---------|--------------|
| Automated campus event ingestion | Manual/seed data sufficient for MVP validation. |
| Weather integration | Enhances Layer 1 — not required to prove campus angle. |
| PDF export of Weekly Review | Nice-to-have for owner sharing. |
| Multi-location | Complexity — single shop first. |

## Won't Have (Version 1)

| Feature | Why excluded |
|---------|--------------|
| AI chat | Wrong product model. |
| Analytics hub | Duplicates Dashboard. |
| Campus Events page | Layer 1 replaces it. |
| Notifications center | Campus moment badge + Layer 3 action sufficient. |
| Admin panel | No customers yet. |
| POS integration | Manual input validates demand first. |

---

# 9. Three Second Rule

## Dashboard (`/dashboard`) — updated

**3-second understanding:** *"Here's what's happening on campus → my shop is [okay / not] → I should [do X]."*

| Pass? | Recommendation |
|-------|----------------|
| ⚠️ → ✅ after Sprint 1.1 | **Previously failed** — opened with revenue KPIs like any analytics tool. **Now passes** if Layer 1 campus headline is visually dominant. Campus headline must be largest text on page. |

## Record Today (`/dashboard/record`)

**3-second understanding:** *"Two numbers — revenue and customers. Done."*

| Pass? | ✅ |

## Weekly Review (`/review/weekly`)

**3-second understanding:** *"Here's my week + what's coming on campus next week."*

| Pass? | ✅ — Lead with campus recap, not revenue chart. |

## Onboarding Step 2

**3-second understanding:** *"Pick my biggest business priority — one tap."*

| Pass? | ✅ — Four options, no paragraph reading required. |

## History (`/history`)

**3-second understanding:** *"Past days and weeks — find anything."*

| Pass? | ✅ — Not in daily path; standard archive pattern. |

---

# 10. Product Simplicity Review

## Page deletion analysis

For each page: *If we delete it, does the product get simpler without losing core value?*

| Page | Delete? | Verdict |
|------|---------|---------|
| **Landing** | No | No acquisition without it. |
| **Pricing** | Defer v1 | **Removed from v1 sitemap.** Landing CTA goes direct to Sign Up. Add when ready to charge. Product gets simpler. |
| **Sign Up / Log In / Forgot Password** | No | Required. |
| **Onboarding** | No | Required for campus + goal context. |
| **Dashboard** | No | The product. |
| **Record Today** | No | Required input ritual. Could become drawer later — keep as route for MVP. |
| **Weekly Review** | No | Only weekly touchpoint. Cannot merge into Dashboard without cluttering daily view. |
| **History** | Partial | **Removed from primary nav.** Page kept for archive deep-link from Dashboard Layer 4. Daily users never need it. Product nav gets simpler. |
| **Settings hub** | No | Required utility — but only 2 sub-links. Minimal. |
| **Settings: Business Profile** | No | Campus + goal must be editable. |
| **Settings: Account** | No | SaaS minimum. |

## Pages never to build

| Page | Reason |
|------|--------|
| AI Chat | Wrong product. |
| Analytics hub | Duplicates Dashboard Layer 2 + 4. |
| Campus Events browser | Layer 1 replaces it entirely. |
| Business Goal page | Goal is a lens in onboarding/settings — not a destination. |
| Notifications center | Layer 3 action is the notification. |

## Final page count

| Zone | v1 pages |
|------|----------|
| Public | 1 (Landing) |
| Auth | 4 (Sign Up, Log In, Forgot Password, Onboarding) |
| Application | 5 routes (Dashboard, Record Today, Weekly Review, History archive, Settings + 2 sub) |
| **Primary nav items** | **3** |

## Simplicity verdict

Sprint 1.1 **reduces daily navigation from 4 to 3 items** and **defers Pricing** without losing the core loop. Campus Context as Dashboard Layer 1 increases information on the home screen but **decreases cognitive load** — owners no longer need to interpret raw numbers without context.

---

# Sprint Summary (Sprint 1)

*Original Sprint 1 deliverable — preserved for reference.*

Sprint 1 established the initial IA: three product zones, page definitions, navigation, user journey, MVP scope, three-second rule, and simplicity review.

Key Sprint 1 decisions carried forward: Dashboard as daily home, no AI Chat, flat hierarchy, manual input for MVP.

Sprint 1.1 supersedes specific decisions where noted in [Sprint 1.1 Change Log](#sprint-11-change-log).

---

# Sprint 1.1 Change Log

## 1. 修改了哪些内容

| Area | Change |
|------|--------|
| **Dashboard 信息层级** | 重构为四层：Campus Context → Business Health → Action → History Trends |
| **Dashboard 定位** | 从「通用经营分析页」改为「Campus Operating View（校园经营视图）」 |
| **页面命名** | Log Today → **Record Today**；Weekly Report → **Weekly Review** |
| **路由** | `/dashboard/log` → `/dashboard/record`；`/reports/weekly` → `/review/weekly` |
| **Onboarding** | 增加 Step 2：Business Goal 选择（同一路由，无新页面） |
| **Business Goal 设计** | 四个目标选项；融入 Onboarding、Dashboard Layer 3、Weekly Review、Settings |
| **导航** | 主导航从 4 项减为 3 项；History 移出主导航 |
| **Pricing** | 从 v1 主 IA 推迟（Deferred） |
| **User Journey** | 更新全流程，体现 Campus-first + Business Goal |
| **Three Second Rule** | Dashboard 三秒法则改为 campus → health → action |
| **MVP Scope** | 更新 Must Have / Should Have，反映上述变更 |
| **Simplicity Review** | 逐页删除分析，明确 History 降级、Pricing 推迟 |

---

## 2. 为什么修改

| Problem (Sprint 1) | Fix (Sprint 1.1) |
|--------------------|------------------|
| Dashboard 以经营数据开头，与任意 AI 商业工具有限无差 | Campus Context 升为 Layer 1，打开即见校园环境 |
| Campus 事件只是 Dashboard 上一张卡片 | Campus 成为产品核心信息层，贯穿 Dashboard + Weekly Review |
| 「Log Today」是开发者语言 | 「Record Today / 记今天」符合老板日常心理模型 |
| 「Weekly Report」暗示被动接收 | 「Weekly Review / 本周复盘」符合老板主动复盘习惯 |
| AI 建议缺少战略锚点 | Business Goal 让所有建议有方向，避免泛泛而谈 |
| History 占据 daily nav 但使用频率低 | 移出主导航，保留 archive 页面供偶尔查阅 |
| Pricing 在 plans 未定时增加 IA 复杂度 | 推迟到 beta 验证需求后再加 |

---

## 3. 对产品竞争力有什么帮助

| Before | After |
|--------|-------|
| 隐藏 Logo 可冒充任意 SMB 分析工具 | Campus Context 作为第一层，品牌辨识度内置在 IA 中 |
| AI 是卖点但无差异化 | AI 变为 Goal × Campus × Data 的决策引擎 — 竞品难以复制校园层 |
| 老板看到数字，自己解读 | 产品先告诉老板「校园发生什么」，再解读数字 |
| 建议泛泛：「提升营销」 | 建议具体：「考试周 + 你的目标是复购 → 推自习套餐」 |
| 4 个 daily nav 项，有干扰 | 3 个 nav 项，每日路径更清晰 |

**核心提升：** CampusFin 的 IA 现在表达的是一个 **campus-aware operating system**，而不是 **AI + dashboard template**。

---

## 4. 对后续 Sprint 有什么影响

| Sprint | Impact |
|--------|--------|
| **Sprint 2 — Design System** | Dashboard 必须按四层结构设计组件 zones；Campus Context 需要最大视觉权重；Record Today / Weekly Review 命名更新 |
| **Sprint 3 — Database** | 新增 `business_goal` 字段；campus 关联字段；campus_events 数据模型支撑 Layer 1 |
| **Sprint 4 — AI Engine** | 推荐逻辑必须输入三元组：Campus Context + Business Health + Business Goal |
| **Implementation** | 路由变更：`/dashboard/record`、`/review/weekly`；Onboarding 两步；nav 3 项 |
| **Marketing copy** | Landing 必须从 campus angle 重写 — 与 IA 对齐 |

---

## 5. 是否建议进入 Sprint 2

**建议：是 — 待 Founder 确认 Sprint 1.1 后可进入 Sprint 2。**

Sprint 2 建议 focus：

> **Design System + Dashboard 四层布局规范（仅文档）**

| Deliverable | Priority |
|-------------|----------|
| Campus Context zone 视觉规范（Layer 1 最大字重 / 位置） | P0 |
| 四层 Dashboard wireframe（ASCII 或结构化描述） | P0 |
| Record Today / Weekly Review 页面布局 | P1 |
| Onboarding Step 2 Business Goal UI 规范 | P1 |
| Empty states（首次访问 / 无数据） | P1 |

**Sprint 2 不做：** React 代码、Supabase schema、AI prompts。

---

**Sprint 1.1 完成。等待确认后进入 Sprint 2。**
