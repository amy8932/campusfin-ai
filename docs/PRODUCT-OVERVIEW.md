# CampusFin AI

**CampusFin AI is an AI operating assistant that helps campus merchants make one practical operating decision every day.**

---

## 1. Problem

Campus-area merchants — coffee shops, bubble tea stores, print shops, light meal counters — operate in a rhythm driven by exams, career fairs, rain, graduation, and enrollment. Most owners decide day-to-day from gut feel, not structured signals.

They rarely have time for dashboards, reports, or consultant-style analysis. What they need is **one clear action today** — grounded in campus context and their own numbers.

---

## 2. Solution

CampusFin combines five inputs to generate **ONE** daily action:

| Input | Role |
|-------|------|
| **Campus Context** | What is happening on campus today? |
| **Business Health** | How is the shop performing? |
| **Business Goal** | What is the owner trying to achieve? |
| **Recommendation Memory** | What was recommended recently? |
| **Owner Feedback** | Did the owner execute it? Was it helpful? |

The output is not a chat, not a report — it is **one operational recommendation** the owner can start within 30 minutes.

---

## 3. Core Product Loop

```
Daily Check-in
        ↓
Campus Context
        ↓
Business Health
        ↓
LLM Recommendation
        ↓
Explainable Decision
        ↓
Owner Feedback
        ↓
Learning Memory
        ↓
Next Recommendation
```

Each day the loop repeats. Feedback does not change today's recommendation — it shapes **tomorrow's** learning.

---

## 4. Core Features

| Feature | Description |
|---------|-------------|
| **Daily Check-in** | Owner records revenue, customer count, and optional note in under 2 minutes |
| **Today's Priority** | One AI-generated action with signals, rationale, and expected impact |
| **Campus Context** | Exam week, career fairs, weather, and campus events on the Dashboard |
| **Business Health** | Today vs. last week and 7-day trend at a glance |
| **Owner Feedback** | ✓ Executed / Later — plus helpfulness rating |
| **CampusFin Learning** | Shows how CampusFin learns the owner's operating style over time |

---

## 5. AI Features

| Capability | Purpose |
|------------|---------|
| **Prompt Engineering** | Campus-first thinking order; one action; Simplified Chinese output |
| **Structured Output** | Strict JSON schema: title, reason, impact, confidence, action_type |
| **Validation** | Rejects invalid, unsafe, or off-brand LLM output before it reaches the user |
| **Rule-based Fallback** | Silent fallback when LLM is off or fails — Dashboard never breaks |
| **Memory** | Last 7 days of recommendations feed continuity into the next prompt |
| **Feedback Learning** | Owner execution + helpfulness gradually shapes future recommendations |
| **Explainable AI** | Decision card shows signals, rationale, difficulty, time, and confidence |

---

## 6. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js Server Actions, Supabase (Postgres + Auth) |
| AI | OpenRouter (OpenAI-compatible API), structured JSON output |
| Deployment | Vercel |
| Quality | Eval runner (`npm run eval`), AI Judge, 12 scenario testcases |

---

## Related Docs

- [AI Workflow](./AI-WORKFLOW.md) — technical pipeline diagram
- [Architecture](./ARCHITECTURE.md) — folder structure
- [Demo Script](./DEMO-SCRIPT.md) — 3-minute founder demo
- [Portfolio Highlights](./PORTFOLIO-HIGHLIGHTS.md) — AI-native product story
