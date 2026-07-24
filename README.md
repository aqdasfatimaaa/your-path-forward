# AI Life Navigator

**Confusion in. Clarity out.**

AI Life Navigator is an AI-powered planning platform that turns any big, overwhelming life goal — changing careers, studying abroad, searching for a job, starting a business, or anything else — into a clear, personalized, step-by-step roadmap. Instead of generic "how to become an X" articles that assume everyone's starting point is the same, this app asks the right questions for *your specific type of goal*, then builds a plan around your actual situation, time, and constraints.

---

## Table of Contents

- [The Problem](#the-problem)
- [Why I Built This](#why-i-built-this)
- [Who It's For](#whos-its-for)
- [Live App](#live-app)
- [How It Works (End to End)](#how-it-works-end-to-end)
- [Features](#features)
- [Why Category-Locked Questions Matter](#why-category-locked-questions-matter)
- [The AI Features](#the-ai-features)
- [Tools, Services, and AI Models Used](#tools-services-and-ai-models-used)
- [Why These Tools](#why-these-tools)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Data & Privacy](#data--privacy)
- [Known Limitations / Next Steps](#known-limitations--next-steps)
- [How to Run the Project Locally](#how-to-run-the-project-locally)

---

## The Problem

When someone decides they want to change something big in their life — switch careers, move abroad for study, start a business, find a new job — the advice available to them is almost always generic. A blog post titled "How to Become an AI Engineer" assumes the same starting point for every reader. A "Study Abroad Guide" doesn't know if you're a final-year student or someone five years into a career. None of it accounts for how much time you actually have per week, what you're starting from, or what's realistically achievable in your timeframe.

The result is decision paralysis: people know *what* they want, but not the concrete, ordered sequence of steps to get there — and they waste time reading generic content that has to be manually adapted to their real situation.

## Why I Built This

Everyone eventually faces a goal that feels too big to break down alone — a career pivot, a big move, a business idea, a job search after a gap. What's missing isn't motivation or information; it's a way to turn a vague goal into an ordered, personalized plan that reflects the *type* of goal it actually is. A study-abroad plan and a business-launch plan should never look like the same template with different words swapped in — they involve genuinely different processes, timelines, and gaps to close. I wanted an app that recognizes this from the start, asks the right category-specific questions, and builds a roadmap that actually reflects the real-world path for that specific goal.

## Who It's For

Anyone facing a major, complex personal or professional goal who doesn't know how to structure the path forward — students deciding on a career direction, people planning to study abroad, job seekers restructuring their search, and aspiring entrepreneurs validating an idea. It's especially useful for people early in a decision, when the goal still feels abstract and the first step isn't obvious.

## Live App

**https://your-path-forward-nine.vercel.app/**

---

## How It Works (End to End)

1. **Homepage.** The user lands on a calm, clear landing page explaining what the app does, then clicks "Start Your Journey."

2. **Goal Category Selection.** The user picks one of five categories: *Career Change or New Skill*, *Study Abroad*, *Job Search*, *Start a Business*, or *Something Else*. This single choice drives every downstream form field and every AI system prompt — it is never left for the AI to guess.

3. **Category-Specific Details Form.** Based on the selected category, the form shows different fields (e.g. Study Abroad asks about the field of study and target country; Start a Business asks about the business idea and existing resources), plus two universal fields: available time per week and target timeframe.

4. **AI Clarifying Questions.** The user's category, details, time, and timeframe are sent to Groq (Llama 3.3 70B) with a system prompt that has explicit, separate instructions for each category. The AI generates 2–4 follow-up questions relevant only to that category (e.g. Study Abroad → target country, budget, language test status, degree level; Start a Business → capital, solo vs. co-founder, existing audience). The user answers these (as free text or multiple choice).

5. **Roadmap Generation.** All collected context (category, details, clarifying answers, time, timeframe) is sent to Groq again, this time to generate a full roadmap: 4–8 chronological milestones, each with actionable tasks, plus a "Gaps to Close" section identifying what's missing (skills, documents, savings, test scores, connections — whatever is relevant to that specific category) and why each gap matters.

6. **Dashboard.** The roadmap renders as an expandable, checkable milestone list with a progress bar. Tasks can be marked complete, and completion state is saved.

7. **What-If Scenarios.** On request, the AI generates 2–3 realistic alternate paths toward the same goal (again, category-appropriate — e.g. "direct application vs. education agent vs. scholarship" for Study Abroad, not the same shape as a business's "bootstrapped vs. investor-backed vs. side business" paths), each with timeframe, difficulty, pros, tradeoffs, and a "best for" recommendation.

8. **Ask Your Navigator.** A chat interface where the user can ask questions about their specific journey. Every message is sent along with the user's full context (category, details, clarifying answers, and generated roadmap) so answers stay grounded in their actual situation instead of giving generic advice.

9. **Progress / Next Best Step.** A focused screen that deterministically reads the user's saved roadmap and shows the single next incomplete task, in the correct milestone order, with a short reason why it's next — not a randomly generated suggestion.

10. **Persistence.** All of this — category, form answers, clarifying answers, roadmap, task completion, What-If comparisons, and chat history — is saved to a Supabase Postgres table (`app_state`), scoped per device via a device ID stored in `localStorage` and enforced server-side through Row Level Security, so the plan survives refreshes and repeat visits.

---

## Features

- **Category-first intake**: user explicitly picks their goal type (Career, Study Abroad, Job Search, Business, or Something Else) — no AI guesswork on what kind of goal this is
- **Conditional details form**: form fields change based on category, so a career-change user and a study-abroad user are never asked the same questions
- **AI-generated, category-locked clarifying questions**: 2–4 follow-up questions per goal, genuinely different in content and intent depending on category
- **Personalized, realistic roadmap**: 4–8 milestones broken into specific actionable tasks, generated from the user's full context, not a generic template
- **"Gaps to Close" section**: identifies concrete gaps (skills, documents, funds, test scores, connections — whatever applies) with a short explanation of why each matters
- **Honesty check**: if the stated timeframe is unrealistic given the user's available time, the AI says so explicitly in a "note" field instead of pretending the goal is achievable on schedule
- **Interactive checklist**: mark tasks complete; a progress bar reflects real completion percentage
- **What-If Scenarios**: compare 2–3 realistic alternate paths toward the same goal, each with timeframe, difficulty, pros, tradeoffs, and a "best for" recommendation
- **Ask Your Navigator**: a chat that answers questions using the user's actual category, details, and roadmap as context — not generic advice
- **Progress / Next Best Step**: deterministically surfaces the single next actual incomplete task from the saved roadmap, in milestone order
- **Persistence across sessions**: all state (category, answers, roadmap, task completion, chat history) is saved to Supabase and reloads automatically, scoped per device
- **Per-device data protection**: Row Level Security policies ensure one device can never read or modify another device's data

## Why Category-Locked Questions Matter

An earlier version of this app let the AI infer the goal type purely from free text and improvise its own follow-up questions. In testing, this sometimes produced questions that felt interchangeable across very different goals — a risk when the whole premise of the app is that different goals need genuinely different treatment.

The fix: the user explicitly selects a category through the UI (not the AI). That category label is then passed as a hard constraint into every AI system prompt — for clarifying questions, for the roadmap, and for What-If Scenarios — with separate, explicit rules written for each of the five categories. This guarantees a Study Abroad journey and a Start a Business journey never resemble each other, because the category is a known, user-provided fact by the time the AI is ever called, not something the model has to detect on its own.

## The AI Features

This app has **three separate AI-powered features**, all served through Groq (Llama 3.3 70B Versatile), all called server-side so the API key is never exposed to the browser.

### 1. AI Clarifying Questions

Once the user selects a category and fills in the details form, this system prompt generates follow-up questions specific to that category:

```
You are an intake specialist for a life/goal planning tool. The user has
already told you their goal category is exactly: {category}. Generate
2-4 short, highly specific follow-up questions appropriate ONLY to this
category. Follow these category rules strictly and do not blend them:

- If category is "Career Change or New Skill": ask about specific
  transferable experience, target seniority/entry level, and the biggest
  perceived obstacle (e.g. lack of a portfolio, no formal credential).
- If category is "Study Abroad": ask about target country/countries (or
  openness to multiple), budget range or funding plan, language
  proficiency/test status (e.g. IELTS/TOEFL), and degree level.
- If category is "Job Search": ask about target industry/role, work
  authorization/location constraints, and current resume/portfolio
  readiness.
- If category is "Start a Business": ask about available starting
  capital, whether they plan to work solo or find co-founders, and
  whether they have an existing customer/audience.
- If category is "Something Else": infer 2-4 sensible clarifying
  questions from their free-text goal description, but keep them
  concrete and specific to what they actually wrote, not generic.

For each question, specify whether it's best answered as short free text
or as 3-5 multiple-choice options (list them if choice type). Respond
ONLY in valid JSON with this shape:
{
  "questions": [
    { "id": "q1", "question": "...", "type": "text", "options": null },
    { "id": "q2", "question": "...", "type": "choice", "options": ["...", "...", "..."] }
  ]
}
```

### 2. Roadmap Generation

Once clarifying answers are collected, this system prompt builds the full personalized roadmap:

```
You are an expert strategist for the goal category: {category}. Given
the user's full context (their category-specific details, clarifying
question answers, available weekly time, and timeframe), generate a
realistic, personalized roadmap specific to this category's real-world
process (e.g. a Study Abroad roadmap should reflect actual stages like
research/shortlisting, standardized tests, applications, funding,
visa — a Business roadmap should reflect validation, initial setup,
first customers, growth — do not use generic "learn a skill" language
unless the category is genuinely skill-based).

Break the roadmap into 4-8 milestones in chronological order. For each
milestone, list 2-5 specific, actionable tasks. Identify concrete gaps
between where the person is now and their goal — these could be skills,
documents, savings, test scores, connections, or anything relevant to
THIS category — and briefly explain why each gap matters. Be realistic
about the given timeframe and weekly time — if unrealistic, say so
honestly in a "note" field. Keep tone encouraging and clear, never vague.
Respond ONLY in valid JSON with this shape:
{
  "note": "...",
  "milestones": [
    { "title": "...", "tasks": [ { "task": "...", "done": false } ] }
  ],
  "gaps": [ { "item": "...", "why": "..." } ]
}
```

### 3. Ask Your Navigator (contextual chat)

```
You are the user's personal navigator for their goal in the category:
{category}. You have full context of their specific details, clarifying
answers, and their generated roadmap. Answer questions specifically in
relation to their actual journey and category — reference their real
milestones and details rather than generic advice. Keep answers concise
and actionable. If a question is outside what their context can answer
confidently, say so honestly rather than guessing.
```

*(A fourth AI call, using a similarly category-locked prompt, powers the What-If Scenarios comparison — see [Features](#features) above.)*

**Why this design:** every prompt forces the model to work strictly within the user-declared category rather than inferring it, requires honesty about unrealistic timeframes rather than blind encouragement, and keeps the "why" attached to every gap and every step so the user understands the reasoning, not just a checklist to blindly follow.

---

## Tools, Services, and AI Models Used

| Tool | Role |
|---|---|
| **Lovable** | AI app builder used to design and build the frontend and backend logic |
| **Groq, Llama 3.3 70B Versatile** | Powers all three AI features (clarifying questions, roadmap generation, What-If comparison, and the contextual chat), called via server-side functions so the API key is never exposed to the client |
| **Supabase** | Postgres database for persisting category, form answers, clarifying answers, roadmap, task completion, What-If results, and chat history — scoped per device via Row Level Security |
| **GitHub** | Version control and public code hosting |
| **Vercel** | Live deployment hosting |

## Why These Tools

- **Lovable** was used to move quickly from idea to a working full-stack app without hand-wiring every piece of boilerplate, while still allowing custom logic for the category-branching flow and the AI system prompts.
- **Groq** was chosen because it serves Llama 3.3 70B with very low latency — important for an app where the user is waiting on three separate AI calls across the journey (clarifying questions, roadmap, and potentially What-If/chat) and shouldn't feel like they're waiting on a slow request each time.
- **Supabase** was chosen as a lightweight, free-tier-friendly Postgres database with built-in Row Level Security, making per-device data scoping straightforward without requiring full user accounts for an MVP.
- **Vercel** was chosen for deployment because it deploys directly from GitHub and has a generous free tier suitable for a student project.
- **GitHub** for standard version control and to satisfy the public-repo requirement.

## Screenshots

*(See the `/screenshots` folder in this repo.)*

| Screen | Description |
|---|---|
| ![Homepage](https://github.com/aqdasfatimaaa/your-path-forward/raw/main/screenshots/homepage.png) | Homepage / landing screen |
| ![Category Selection](https://github.com/aqdasfatimaaa/your-path-forward/raw/main/screenshots/category-selection.png) | Goal Category Selection |
| ![Details Form](https://github.com/aqdasfatimaaa/your-path-forward/raw/main/screenshots/details-form.png) | Category-specific details form |
| ![Clarifying Questions](https://github.com/aqdasfatimaaa/your-path-forward/raw/main/screenshots/clarifying-questions.png) | AI-generated clarifying questions for that category |
| ![Roadmap Dashboard](https://github.com/aqdasfatimaaa/your-path-forward/raw/main/screenshots/roadmap-dashboard.png) | Generated roadmap with milestones and tasks |
| ![What-If Scenarios](https://github.com/aqdasfatimaaa/your-path-forward/raw/main/screenshots/whatif-scenarios.png) | What-If path comparison |
| ![Ask Your Navigator](https://github.com/aqdasfatimaaa/your-path-forward/raw/main/screenshots/ask-navigator.png) | Contextual chat with the Navigator |
| ![Progress Screen](https://github.com/aqdasfatimaaa/your-path-forward/raw/main/screenshots/progress-screen.png) | Progress / Next Best Step |
| ![Supabase Data](https://github.com/aqdasfatimaaa/your-path-forward/raw/main/screenshots/supabase-data.png) | Real persisted user data in the Supabase `app_state` table |

## Architecture

```
User → Frontend (React, via Lovable)
         ↓ (category + details + clarifying answers)
      Server-side functions
         ↓                          ↓
    Groq API (Llama 3.3 70B)     Supabase (Postgres)
   (clarifying questions,         (app_state table:
    roadmap, what-if,              category, details,
    chat responses)                roadmap, progress,
                                    chat history — per
                                    device via RLS)
```

- The **Groq API key** is used only from server-side functions, never from the browser.
- The **Supabase anon/publishable key** is safe to expose client-side; every read/write is scoped by a per-device UUID (stored in `localStorage`) and enforced by Row Level Security policies on the `app_state` table, so one device can never read or modify another device's row.

## Data & Privacy

- The app stores the user's stated goal, category, form answers, clarifying answers, generated roadmap, task completion state, What-If results, and chat history — no passwords, payment details, or other sensitive credentials are ever requested.
- Data is scoped per device via a randomly generated device ID; Row Level Security policies on the `app_state` table enforce that a device can only read, insert, update, or delete its own row.
- All AI calls are made server-side; the Groq API key is never exposed to the client or committed to the repository.

## Known Limitations / Next Steps

- Data is currently scoped per-device rather than tied to a user account, so switching browsers or devices starts a fresh journey. Adding lightweight authentication (email/OTP) on top of the existing per-device schema would enable cross-device sync.
- The "Something Else" category relies entirely on the AI to infer relevant clarifying questions from free text; it doesn't yet learn from past "Something Else" entries to suggest similar categories.
- The "Refresh My Roadmap" (adapting the plan when circumstances change) and export/share features are partially implemented and are a natural next step to fully complete the "adapts to changing circumstances" part of the original vision.
- No offline support — the app requires an internet connection for every AI-powered step.

## How to Run the Project Locally

1. Clone the repo:

```
git clone https://github.com/aqdasfatimaaa/your-path-forward.git
cd your-path-forward
```

2. Install dependencies:

```
npm install
```

3. Create a `.env` file in the root with:

```
GROQ_API_KEY=your_groq_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_PROJECT_ID=your_supabase_project_id
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
```

4. Run the SQL below in your own Supabase project's SQL Editor to create the required table and policies:

```sql
create table public.app_state (
  device_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.app_state to anon, authenticated;
alter table public.app_state enable row level security;

create policy "device can read own row"
  on public.app_state for select to anon, authenticated
  using (device_id = current_setting('request.headers', true)::json->>'x-device-id');
create policy "device can insert own row"
  on public.app_state for insert to anon, authenticated
  with check (device_id = current_setting('request.headers', true)::json->>'x-device-id');
create policy "device can update own row"
  on public.app_state for update to anon, authenticated
  using (device_id = current_setting('request.headers', true)::json->>'x-device-id')
  with check (device_id = current_setting('request.headers', true)::json->>'x-device-id');
create policy "device can delete own row"
  on public.app_state for delete to anon, authenticated
  using (device_id = current_setting('request.headers', true)::json->>'x-device-id');
```

5. Run the dev server:

```
npm run dev
```

6. Open the local URL shown in your terminal.
