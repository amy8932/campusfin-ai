# CampusFin AI — 3-Minute Demo Script

**Audience:** Portfolio reviewers, AI product interviews, beta partners  
**Duration:** ~3 minutes  
**Prerequisite:** Logged-in demo account with today's check-in completed

---

## Opening (20 sec)

> "CampusFin AI is an operating assistant for campus-area small businesses.
>
> Every day, the owner opens the app, records two numbers, and gets **one** practical action — not a chatbot, not a report.
>
> Think of it as a experienced campus shop manager who already knows what's happening on campus today."

---

## Problem (25 sec)

> "Campus merchants — coffee shops, bubble tea, print shops — don't lack data entirely. They lack **daily decisions**.
>
> Exam week shifts demand to evenings. Career fairs spike foot traffic. Rain kills dine-in.
>
> Most owners react from habit. CampusFin connects campus rhythm to their own numbers and gives them one thing to do **today**."

---

## Demo — Dashboard walkthrough (90 sec)

**[Screen: Dashboard home]**

> "This is today's Dashboard. Four zones, under three minutes total."

1. **Campus Context** (15 sec)  
   > "Zone 1: what's happening on campus — exam week, upcoming career fair, weather. Campus comes first. That's our moat."

2. **Business Health** (15 sec)  
   > "Zone 2: today's revenue and customers vs. last week. The owner already entered these in Daily Check-in."

3. **Today's Priority** (35 sec)  
   > "Zone 3: the AI decision card. One recommendation — extend hours, reduce inventory, optimize queue.
   >
   > 'Today's Signals' explains **why today** — campus + numbers + goal.
   >
   > 'Why this action?' is one sentence — no consultant jargon.
   >
   > Expected impact, difficulty, time estimate, confidence — all derived from existing data, no extra AI call."

4. **Feedback** (15 sec)  
   > "Owner taps ✓ Executed, rates helpfulness. Takes under 5 seconds. This does **not** change today's tip — it feeds tomorrow's learning."

5. **CampusFin Learning** (10 sec)  
   > "Zone below: CampusFin Learning. Shows the last recommendation, feedback, what CampusFin learned, and recent actions. Pure visualization — rule-based, no LLM."

---

## AI Pipeline (30 sec)

> "Under the hood: check-in triggers Input Builder → campus context + memory + goal → structured prompt → OpenRouter → JSON validator.
>
> If the LLM fails, rule-based fallback kicks in silently. The owner never sees an error.
>
> We store the full input snapshot for debugging and eval. Twelve test scenarios with an AI Judge score recommendations 0–14."

---

## Closing (15 sec)

> "CampusFin is AI-native but product-first: one action, campus-first, explainable, and it learns from owner feedback over time.
>
> MVP is live — Daily Check-in, AI recommendations, feedback loop, and learning timeline. Happy to walk through the eval pipeline or prompt architecture next."

---

## Demo checklist

- [ ] Demo account has business + campus configured
- [ ] Today's check-in completed (revenue > 0)
- [ ] Today's Priority card visible
- [ ] At least 2–3 days of recommendation history for Learning card
- [ ] Optional: submit feedback live to show ✓ 已记录 state
- [ ] Screenshots in `docs/assets/` (when captured)

---

## If LLM is off

> "We're showing rule-based mode today — same UI, same schema. Flip `ENABLE_LLM=true` with an API key for live LLM generation."
