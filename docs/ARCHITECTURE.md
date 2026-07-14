# CampusFin AI — Architecture

High-level map of the codebase. For AI pipeline details see [AI-WORKFLOW.md](./AI-WORKFLOW.md).

---

## Repository layout

```
CampusFin-AI/
├── app/                    # Next.js App Router
├── components/             # React UI components
├── lib/                    # Business logic & AI engine
├── supabase/               # Database migrations & RPC
├── scripts/                # Eval runner & tooling
├── testcases/              # Eval scenario JSON files
├── reports/                # Generated eval reports
├── docs/                   # Product & engineering docs
└── types/                  # Shared TypeScript types
```

---

## `app/` — Routes & pages

| Path | Purpose |
|------|---------|
| `app/(dashboard)/dashboard/page.tsx` | Main Dashboard — 4 zones + Priority + Learning |
| `app/(dashboard)/dashboard/record/` | Daily Check-in form |
| `app/(dashboard)/setup/` | Business onboarding |
| `app/(auth)/login/` | Sign in |
| `app/(auth)/signup/` | Sign up |
| `app/page.tsx` | Marketing landing |
| `middleware.ts` | Auth session refresh |

Server Components fetch Supabase data. Server Actions handle mutations.

---

## `lib/ai/` — AI engine

| File | Role |
|------|------|
| `prompts.ts` | System + Developer prompt, few-shots, `PROMPT_VERSION` |
| `input-builder.ts` | Builds `PromptInput` JSON from business + check-in + campus |
| `llm.ts` | OpenRouter / OpenAI-compatible API call |
| `validator.ts` | Output validation before storage |
| `adapter.ts` | `generateTodayRecommendation()` — LLM + retry + fallback |
| `rule-based.ts` | Deterministic fallback recommendations |
| `memory.ts` | `loadRecommendationMemory()` for prompt continuity |
| `presentation.ts` | Decision card UI data (signals, badges) — no LLM |
| `learning.ts` | Learning card UI data — no LLM |
| `judge.ts` | AI Judge for eval scoring |
| `index.ts` | Public exports |

---

## `lib/` — Other modules

| Path | Role |
|------|------|
| `lib/actions/checkin.ts` | Save check-in, trigger recommendation generation |
| `lib/actions/feedback.ts` | `submitRecommendationFeedback()` |
| `lib/campus/context.ts` | Campus moment, events, headline |
| `lib/business.ts` | Owner business lookup |
| `lib/health.ts` | Health labels, goal labels |
| `lib/supabase/` | Browser + server Supabase clients |
| `lib/timezone.ts` | Business timezone date strings |

---

## `components/` — Dashboard UI

| Path | Role |
|------|------|
| `components/dashboard/campus-zone.tsx` | Zone 1 — Campus context |
| `components/dashboard/health-zone.tsx` | Zone 2 — Business health |
| `components/dashboard/priority-zone.tsx` | Zone 3 — Today's Priority decision card |
| `components/dashboard/learning-card.tsx` | CampusFin Learning timeline |
| `components/dashboard/feedback-button.tsx` | ✓ Executed / Later + modal |
| `components/dashboard/trend-zone.tsx` | Zone 4 — 7-day trend |
| `components/ui/` | shadcn/ui primitives (Button, Card, Input…) |

---

## `supabase/` — Database

| Path | Role |
|------|------|
| `supabase/migrations/` | Schema: businesses, checkins, recommendations, feedback, events |
| RPC | `upsert_ai_recommendation` — atomic recommendation storage |

Key tables: `businesses`, `daily_checkins`, `ai_recommendations`, `recommendation_feedback`, `campus_events`.

See [DATABASE.md](./DATABASE.md) for full schema.

---

## `scripts/` — Evaluation

| File | Role |
|------|------|
| `scripts/eval.ts` | Runs 12 testcases: Generate → Validator → Judge → report |

```bash
npm run eval
```

Output: `reports/evaluation-report.md`

---

## `testcases/` — Eval scenarios

12 JSON files (`001_exam_week.json` … `012_event_cancelled.json`) covering exam week, rain, career fair, thesis season, revenue decline, etc.

---

## Data flow summary

```
Check-in (Server Action)
  → adapter.generateTodayRecommendation()
    → memory.loadRecommendationMemory()
    → input-builder.buildPromptInput()
    → llm.generateRecommendation()
    → validator.validateRecommendationOutput()
    → supabase RPC upsert
  → Dashboard reads ai_recommendations + input_snapshot
  → presentation.buildRecommendationPresentation()
  → learning.buildLearningCard()
```

---

## Documentation index

| Doc | Topic |
|-----|-------|
| [PRODUCT-OVERVIEW.md](./PRODUCT-OVERVIEW.md) | Product story (3-min read) |
| [AI-WORKFLOW.md](./AI-WORKFLOW.md) | Pipeline diagram |
| [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) | Founder demo script |
| [PORTFOLIO-HIGHLIGHTS.md](./PORTFOLIO-HIGHLIGHTS.md) | AI-native highlights |
| [AI-ENGINE.md](./AI-ENGINE.md) | Engine implementation |
| [AI-PROMPTS.md](./AI-PROMPTS.md) | Prompt architecture |
| [DATABASE.md](./DATABASE.md) | Schema reference |
