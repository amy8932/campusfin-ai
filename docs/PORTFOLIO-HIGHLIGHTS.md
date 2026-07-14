# CampusFin AI — Portfolio Highlights

Why CampusFin is an **AI-native product**, not a dashboard with AI bolted on.

---

## From Rule-based to LLM

CampusFin started with a working rule-based engine — same JSON schema, same Dashboard. Sprint 5 upgraded the decision layer to LLM while keeping rule-based as silent fallback. This mirrors production AI product design: ship a reliable baseline, add intelligence incrementally, never break the user path. The owner cannot tell whether today's tip came from AI or rules unless they inspect `source` in the database.

---

## Prompt Engineering

CampusFin's prompt encodes a fixed thinking order: Campus Context → Business Health → Goal → Memory → Feedback → One Action. The System Prompt defines identity (campus shop manager, not consultant). The Developer Prompt enforces strict JSON-only output with 14 action types. Few-shot examples teach campus-first reasoning in Simplified Chinese. Prompt version is tracked in every `input_snapshot` for regression testing.

---

## Validation Layer

LLM output passes through `validateRecommendationOutput()` before reaching the user. Checks include: single JSON object, Chinese text, verb-led title (8–20 chars), campus reference in reason, goal alignment, 30-minute rule, and forbidden patterns (financing, hiring, waiting). Failed validation triggers one retry, then rule-based fallback. This is a production-grade guardrail — not trust-the-model.

---

## Memory Layer

`loadRecommendationMemory()` reads the last 7 recommendations before today and injects `recommendation_memory` into PromptInput: last recommendation, repeat count, last 7 days, and last feedback. The AI avoids repeating the same action type unless campus context strongly justifies it. Memory is read-only at inference time — no vector DB, no embeddings. Simple, auditable, debuggable.

---

## Feedback Loop

Owners rate recommendations: executed or not, helpfulness (good/neutral/bad). Feedback is stored in `recommendation_feedback` and does **not** affect today's generation. It feeds **next day's** memory as `last_feedback`. The prompt teaches gradual learning: one feedback ≠ preference, repeated signals = preference. This closes the loop from recommendation → action → learning → better recommendation.

---

## Explainable AI

Sprint 7.1 added an explainable decision card without extra LLM calls. `presentation.ts` derives Today's Signals (3 bullets), Why This Action (one sentence), difficulty badge, time estimate, and confidence from `input_snapshot` and stored fields. The owner sees **why**, not just **what**. Explainability is assembled locally — fast, free, and deterministic.

---

## Learning Timeline

Sprint 7.2–7.3 added CampusFin Learning: latest recommendation, owner feedback, learned insight (rule-based sentence), recent actions with date labels, and learning progress count. `learning.ts` reuses `buildRecommendationMemory()` for consistency with the AI pipeline. The timeline makes the feedback loop visible — turning invisible AI learning into a product feature owners can trust.
