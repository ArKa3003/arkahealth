# ARKA‑ED Mobile — The Complete Beginner‑to‑App‑Store Playbook

**A step‑by‑step build guide (with copy‑paste Cursor prompts) + an evidence‑backed plan to get the app into resident and medical‑student curricula.**

Audience: You, a complete beginner. Written so you never have to guess what to do next.
Primary user of the product: **Residents** (interns/PGY‑1 through senior residents), with medical students as a secondary track.
Build target: A **native iOS + Android app built with Expo / React Native** that talks to your existing `arka-ed` backend.

---

## How to read this document

This playbook has two halves, because you asked two different questions:

1. **PART A — BUILD IT (Sections 0–10).** How to actually build a polished, App‑Store‑ready app, step by step, using Cursor. Every step tells you *what to do*, *why*, *the exact prompt to paste into Cursor*, *how to check it worked*, and *what to paste if it breaks*.
2. **PART B — MAKE IT STICK (Sections 11–15).** How to make ARKA‑ED genuinely marketable and adoptable into a curriculum the way Anki became standard — backed by real research — and how to answer an instructor who says *"this isn't useful."*

> **Golden rules for a beginner using Cursor**
> 1. **One prompt at a time.** Paste a prompt, wait for Cursor to finish, *test that it works*, then move on. Never paste the next prompt until the current step runs.
> 2. **Read what Cursor says.** When Cursor proposes file changes, click **Accept** only after skimming them. If something looks scary, ask Cursor *"explain what this change does in plain English"* before accepting.
> 3. **Commit constantly.** After every working step, save your progress in git (Section 0.6). This is your undo button. If you ever break things badly, you can return to the last working version.
> 4. **Errors are normal.** Software breaks 20 times before it works once. When you hit a red error, copy the *entire* error text and paste it into Cursor with: *"I got this error. Explain it simply and fix it without changing unrelated code."*
> 5. **You are the product owner, Cursor is the engineer.** Your job is to describe what you want clearly and to verify the result — not to memorize code.

---
# PART A — BUILD THE APP

---

## Section 0 — Orientation: what you already have, and what you're adding

### 0.1 The mental model (read this once, slowly)

Think of ARKA‑ED as having **two pieces**:

- **The "brain" (backend + database).** You already have this. It lives in your `ARKAEDAPP` folder. It is a Next.js application named `arka-ed`. It already contains: a full database design (questions, clinical cases, flashcards with spaced repetition, study sessions, analytics, achievements, study groups, leaderboards, CME certificates, even LMS/LTI hooks), user login, Stripe billing, AI study features, and — crucially — **a set of "mobile" API endpoints** specifically built to be called by a phone app. You do **not** need to rebuild any of this.
- **The "face" (the mobile app).** This is what you're building now. It is a separate app that runs on a phone, shows beautiful screens, and calls the brain over the internet to get questions, record answers, and show progress. This is the part Apple and Google put in their stores.

> Analogy: your backend is the kitchen (it already cooks the food). The mobile app is the dining room and waiter — it takes orders and serves what the kitchen makes. You're building a gorgeous dining room, not a second kitchen.

**Why a separate Expo app instead of wrapping your website?** Apple frequently rejects apps that are just a website in a shell (App Store Review Guideline 4.2 — "minimum functionality"). A real React Native app gives you native navigation, offline study, push notifications, Face ID login, and the smooth feel reviewers (and residents) expect. It's more work, but it's the version that survives review and feels professional.

### 0.2 The exact technology you'll use (and what each word means)

| Thing | Plain‑English meaning | Why we use it |
|---|---|---|
| **Expo** | A toolkit that makes React Native apps dramatically easier — no Xcode/Android Studio wrangling to start. | Fastest professional path for a beginner. Industry‑standard. |
| **React Native** | The language/framework for writing one codebase that becomes both an iOS and Android app. | Build once, ship to both stores. |
| **TypeScript** | JavaScript with a spell‑checker for code. Catches mistakes before they ship. | Your backend already uses it; fewer bugs. |
| **Expo Router** | The "GPS" that decides which screen shows for which tap. File‑based, like your Next.js app. | Familiar structure, less to learn. |
| **NativeWind** | Tailwind CSS for mobile — style screens with short class names. | Your web app already uses Tailwind; same design language. |
| **TanStack Query** | The "waiter" that fetches data from your backend and caches it. | Handles loading/error/offline automatically. |
| **Zustand** | A tiny notebook for app‑wide state (e.g., who's logged in). | Already used in your web app. |
| **EAS (Expo Application Services)** | Expo's cloud that builds your real `.ipa`/`.aab` files and submits them to the stores. | You don't need a Mac with Xcode to ship. |

### 0.3 Your backend's mobile endpoints (the "menu" your app will order from)

Your `arka-ed` backend already exposes these phone‑facing routes (found under `app/api/mobile/`):

- `POST /api/mobile/auth/login` — exchange email + password for access tokens.
- `POST /api/mobile/auth/refresh` — get a fresh token when the old one expires.
- `GET  /api/mobile/v1/study/home` — the data for the home/dashboard screen.
- `GET/POST /api/mobile/v1/study/sessions` — start and manage study sessions.

Plus the broader web API your app can reuse (questions, cases, flashcards, analytics, notifications, Stripe, AI). **Step 1 of building is to confirm exactly what these return**, and add any missing mobile endpoints. We'll do that with a Cursor prompt, not by hand.

### 0.4 What "done" looks like (your definition of finished)

You'll know you're finished when **all** of these are true:

- A resident can download ARKA‑ED from the App Store / Google Play, sign up, and log in.
- They can do a timed or tutor‑mode question set on imaging appropriateness, see the **AIIE score** with the SHAP‑style "why," and get evidence‑based feedback.
- They can review **flashcards with spaced repetition** that sync across phone and web.
- They can see **progress/analytics** (accuracy by topic, streak, mastery).
- It works **offline** for studying and syncs when back online.
- It sends **push notifications** ("12 cards due today").
- It looks polished: smooth animations, dark mode, no layout glitches, fast.
- It passes **App Store and Google Play review** and is live.

### 0.5 Accounts you must create first (free unless noted)

Do these before any code. Use the *same email* everywhere to stay sane.

1. **GitHub** (github.com) — stores your code safely in the cloud.
2. **Expo account** (expo.dev) — needed for cloud builds/submission.
3. **Apple Developer Program** (developer.apple.com) — **$99/year**, required to publish on iOS. Enroll early; identity verification can take 24–48h.
4. **Google Play Console** (play.google.com/console) — **$25 one‑time**, required to publish on Android.
5. (Already have, presumably) your backend's hosting (Vercel) and database (Supabase/Postgres). Keep those login details handy.

### 0.6 Install the tools on your computer (one‑time)

You'll mostly let Cursor run commands for you, but install these first.

1. **Cursor** — download from cursor.com, install, open it.
2. **Node.js (LTS version)** — download from nodejs.org (the "LTS" button). This lets your computer run JavaScript tools.
3. **Git** — usually pre‑installed on Mac. On Windows, install from git‑scm.com.
4. On your **phone**, install the **"Expo Go"** app from the App Store / Play Store. This lets you see your app live on your real phone while building — no store submission needed during development.

To check installs worked, open Cursor's built‑in terminal (top menu: **Terminal → New Terminal**) and run:

```bash
node --version
git --version
```

You should see version numbers (e.g. `v20.x.x`). If you see "command not found," tell Cursor: *"`node --version` says command not found on [Mac/Windows]. Walk me through fixing my PATH."*

> **From here on, you live in Cursor.** Everything else in Part A is: open Cursor, paste a prompt, accept changes, test, commit.
---

## Section 1 — Create the project and lock in your standards

**Goal of this section:** create an empty‑but‑professional Expo app, connect it to GitHub, and give Cursor a "rulebook" so every prompt after this produces consistent, high‑quality code.

### Step 1.1 — Make a home for the mobile app

Decide where the mobile app lives. Recommended: a **brand‑new folder next to your existing project**, e.g. `arka-ed-mobile`. Keeping it separate from `ARKAEDAPP` keeps the "kitchen" and "dining room" cleanly apart.

In Cursor: **File → Open Folder**, create/choose an empty folder named `arka-ed-mobile`, open it. Then **Terminal → New Terminal**.

### Step 1.2 — Prompt: scaffold the app

> **Paste into Cursor chat:**
```
Create a new Expo app (latest SDK, TypeScript template) in the current empty folder.
Requirements:
- Use Expo Router (file-based routing) with a typed routes setup.
- Set up NativeWind v4 (Tailwind for React Native) and create a tailwind.config with an ARKA design system: navy #0F172A, teal #14B8A6, slate #1E293B, plus semantic colors (success green, danger red, warning amber). Configure dark mode.
- Install and configure: @tanstack/react-query, zustand, expo-secure-store, axios, react-native-reanimated, expo-haptics, @expo/vector-icons.
- Create a clean folder structure: app/ (routes), components/ (ui/, study/, cases/, flashcards/, analytics/, layout/), lib/ (api/, stores/, hooks/, utils/), constants/, assets/.
- Add an app.json with name "ARKA-ED", a slug, iOS bundle identifier com.arkahealth.ed, Android package com.arkahealth.ed, portrait orientation, and a placeholder icon/splash.
- Verify the app launches with `npx expo start` and show me the exact command to run.
Do NOT add any backend code — this app only calls an external API.
After creating, summarize the folder structure in plain English.
```

**How to verify:** Cursor will tell you to run `npx expo start`. Run it. A QR code appears in the terminal. Open **Expo Go** on your phone and scan it (same Wi‑Fi). You should see a starter screen on your phone. 🎉 That's your app running live.

**If it breaks:** paste the full red error and: *"This happened when I ran `npx expo start`. Fix it and explain what was wrong."*

### Step 1.3 — Prompt: connect to GitHub (your safety net)

> **Paste into Cursor chat:**
```
Initialize a git repository here. Create a sensible .gitignore for an Expo/React Native project (ignore node_modules, .expo, build artifacts, .env files). Make an initial commit titled "chore: scaffold ARKA-ED mobile app". Then give me the exact step-by-step instructions (with the buttons to click on github.com) to create a new PRIVATE GitHub repository called arka-ed-mobile and push this code to it. Assume I have never used GitHub before.
```

Follow the printed instructions. From now, after each working step, commit with:

> **Paste into Cursor chat:** `Commit all current changes with a clear conventional-commit message describing what we just did, and push to GitHub.`

### Step 1.4 — Prompt: the Cursor rulebook (do this once; it pays off forever)

This file teaches Cursor your project's conventions so you don't have to repeat them.

> **Paste into Cursor chat:**
```
Create a `.cursorrules` file at the project root for the ARKA-ED mobile app. Include:

PROJECT: ARKA-ED is a premium medical education app for imaging-ordering appropriateness, for residents and medical students. It is the mobile front-end for an existing Next.js backend ("arka-ed"). The app does NOT contain business logic or a database — it calls the backend's REST API.

SCORING IP — CRITICAL: All appropriateness scores are "AIIE scores" (ARKA Imaging Intelligence Engine), ARKA's proprietary 1–9 scale (1–3 Usually Not Appropriate=red, 4–6 May Be Appropriate=amber, 7–9 Usually Appropriate=green) generated by ARKA's own evidence-based engine with transparent SHAP-style factor attributions. NEVER label anything "ACR rating" or reproduce ACR Appropriateness Criteria content. Use the field name `aiieScore`.

STACK: Expo (latest), Expo Router, TypeScript strict (no `any`), NativeWind v4, TanStack Query for all server data, Zustand for client state, expo-secure-store for tokens.

CODING RULES:
- Strict TypeScript; explicit prop interfaces; no React.FC.
- Every screen handles loading, error, empty, and success states.
- All server calls go through a typed API client in lib/api/. No fetch() scattered in components.
- Reusable styled primitives live in components/ui/. Use a cn() helper for conditional classes.
- Accessibility: every touchable has accessibilityLabel and role; min 44x44pt targets; respect reduced motion.
- Animations via react-native-reanimated; keep them subtle (150–300ms).
- Comments explain WHY, not WHAT.
- Use expo-haptics for key interactions (answer submit, correct/incorrect).

DESIGN: 8px radius cards, 6px buttons; spacing on a 4px scale; full dark-mode support; teal is the primary/interactive color; green=correct, red=incorrect, amber=partial/warning.

SAFETY: This is an educational tool, not a diagnostic device. Include a non-diagnostic disclaimer where clinical content is shown.

Format it as Cursor expects and keep it concise but complete.
```

Commit after this.

> ✅ **Checkpoint:** You have a running app on your phone, code backed up on GitHub, and a rulebook. You haven't written a line of code by hand — and you won't have to.

---

## Section 2 — Connect the app to your backend (the most important section)

**Goal:** make your phone app talk to your `arka-ed` backend reliably and securely. Everything else depends on this.

### Step 2.1 — Prompt: discover and document the real API (run from your BACKEND folder)

First, open your **backend** in a *second* Cursor window: **File → Open Folder → `ARKAEDAPP`**. We need an accurate contract of what the mobile endpoints return.

> **Paste into Cursor chat (in the ARKAEDAPP window):**
```
Audit this Next.js backend for everything a mobile app needs. Specifically:
1. List every route under app/api/mobile/ and, for each, document the HTTP method, required headers, request body shape, and the exact JSON response shape (read the code; infer types from the Prisma schema in prisma/schema.prisma).
2. Identify the auth scheme the mobile routes use (JWT? session? refresh tokens?) and how long tokens last.
3. List which CORE features (questions, study sessions, flashcards/spaced-repetition reviews, analytics, notifications, Stripe) already have mobile-usable endpoints, and which only exist as web/server-action logic with NO mobile endpoint yet.
4. Produce a single markdown file `MOBILE_API_CONTRACT.md` at the repo root with all of the above, plus a "Gaps" section listing endpoints we still need to add for: flashcard review submission, spaced-repetition queue, analytics summary, push-token registration, and AIIE explanation payloads.
Do not change any code yet — this is documentation only.
```

Read `MOBILE_API_CONTRACT.md`. This becomes the source of truth you (and Cursor) reference while building.

### Step 2.2 — Prompt: add the missing mobile endpoints (still in backend window)

> **Paste into Cursor chat (ARKAEDAPP window), once per gap, or all together if small:**
```
Using MOBILE_API_CONTRACT.md as the spec, implement the missing mobile endpoints under app/api/mobile/v1/. Follow the existing mobile auth pattern and existing code style exactly. Each endpoint must:
- Validate the JWT/access token the same way existing mobile routes do.
- Validate input with Zod.
- Return JSON that exactly matches a TypeScript type you also export.
- Be paginated where lists can grow large.
Implement: 
(a) GET /flashcards/queue (spaced-repetition due cards for the user),
(b) POST /flashcards/review (submit a card review: cardId, rating, store next-due via the existing SR algorithm),
(c) GET /analytics/summary (accuracy by category, streak, mastery, XP),
(d) POST /notifications/push-token (register an Expo push token to the user),
(e) GET /questions/session-feed (a set of imaging-appropriateness questions with AIIE score, options, SHAP-style factor attributions, references, and teaching points).
Write a short test or a sample curl command for each so I can confirm it works. Do not break any existing web functionality.
```

Deploy the backend (push to GitHub; Vercel auto‑deploys, or run `npm run dev` locally and note the URL). Note your backend base URL, e.g. `https://arka-ed.vercel.app` or `http://YOUR-LOCAL-IP:3000`.

### Step 2.3 — Prompt: build the typed API client (back in the MOBILE window)

> **Paste into Cursor chat (arka-ed-mobile window):**
```
Build a typed API client in lib/api/ for the ARKA-ED mobile app that targets our backend described in (paste the relevant parts of MOBILE_API_CONTRACT.md here, or attach the file).
Requirements:
- A single axios instance reading the base URL from an environment config (app.config.ts using expo-constants / EXPO_PUBLIC_API_URL). Document how I set EXPO_PUBLIC_API_URL.
- Store access + refresh tokens securely with expo-secure-store (never AsyncStorage for tokens).
- An interceptor that attaches the access token, and on a 401 automatically calls /auth/refresh once, retries the request, and if refresh fails, logs the user out.
- Typed functions: login, refresh, getStudyHome, getQuestionFeed, startSession, submitAnswer, getFlashcardQueue, submitFlashcardReview, getAnalyticsSummary, registerPushToken. Each returns a typed response matching the contract.
- Set up TanStack Query: a QueryClientProvider in the root layout, sensible retry/staleTime defaults, and one example useQuery hook (useStudyHome) plus one example useMutation (useSubmitAnswer) in lib/hooks/.
- Add clear error handling that surfaces a friendly message.
Then show me exactly how to test the login function against the real backend with a test account.
```

**How to verify:** Cursor will give you a way to test login. Create a test user in your backend first (sign up on the website), then test logging in from the app. A successful response with tokens = your two halves are now talking. **This is the milestone that de‑risks the whole project.**

Commit.

> ✅ **Checkpoint:** phone app ↔ backend connection proven. From here, building screens is mostly "fetch with a hook, render it pretty."
---

## Section 3 — The design system & UI kit (what makes it look professional)

**Goal:** build a small library of beautiful, consistent building blocks *first*, so every screen you build afterward inherits the polish automatically. This is the single biggest lever for "looks professionally made."

### Step 3.1 — Prompt: brand foundations

> **Paste into Cursor chat:**
```
Create the ARKA-ED visual foundation:
- A typography scale (display, h1, h2, body, caption) using a clean system font stack now, with a TODO to swap in a licensed font (e.g. Inter) later. Define them as reusable <Text> components (Display, Heading, Body, Caption) that already handle dark mode color.
- A spacing + radius token file in constants/theme.ts.
- A full color system in NativeWind for light AND dark mode using the ARKA palette (navy, teal, slate + semantic). Ensure WCAG AA contrast.
- A useColorScheme-aware ThemeProvider so the whole app supports system dark mode and a manual toggle stored in Zustand + secure-store.
Show me a single demo screen that renders the type scale and color swatches so I can eyeball it.
```

### Step 3.2 — Prompt: the core component kit

> **Paste into Cursor chat:**
```
Build a production-grade UI kit in components/ui/, each in its own file, fully typed, accessible, dark-mode aware, with subtle reanimated press states and expo-haptics on press:
- Button (variants: primary teal-gradient, secondary outline, ghost, danger; sizes sm/md/lg; loading spinner; left/right icon; disabled).
- Card (Card, CardHeader, CardTitle, CardContent, CardFooter; variants default/elevated/outlined).
- Badge (success/warning/danger/info/outline; optional pulsing dot).
- Input (label, helper, error, icon adornments; integrates with react-hook-form).
- Chip / SegmentedControl (for filters and tutor/timed mode).
- ProgressBar and ProgressRing (for mastery + session progress).
- Skeleton loader, EmptyState, and ErrorState components (these enforce the "always handle 4 states" rule).
- Sheet/Modal built on a gesture-friendly bottom sheet.
- Toast system (success/error/info).
- An AIIEScoreBadge component: given a 1–9 score, renders the color band (red/amber/green), the label, and a tap target to reveal the SHAP-style factor breakdown.
Create a hidden /dev/ui-kit route that displays every component in every state so I can visually QA them.
```

**How to verify:** open the hidden `/dev/ui-kit` route in Expo Go and look at every component in light and dark mode. If a color or spacing feels off, tell Cursor specifically (*"the primary button text is hard to read in dark mode — fix contrast"*). Polishing here = polish everywhere.

Commit.

---

## Section 4 — Authentication & onboarding (the first thing a reviewer and a resident sees)

**Goal:** a smooth, trustworthy sign‑in and a short onboarding that personalizes the experience (specialty, training year). First impressions drive both App Store approval and resident retention.

### Step 4.1 — Prompt: auth screens & session

> **Paste into Cursor chat:**
```
Build the auth flow using our API client and Expo Router:
- A Zustand auth store (user, tokens, isAuthenticated, isLoading) hydrated from secure-store on launch.
- Route guards: unauthenticated users land on /(auth)/welcome; authenticated users land on /(tabs)/home. Show a branded splash while hydrating.
- Screens: Welcome (logo, one-line value prop, "Get started" + "I have an account"), Login (email/password, show/hide, forgot-password link, friendly errors), Register (email, password with strength meter, name, accept Terms + Privacy with links), Forgot Password.
- Support biometric unlock (expo-local-authentication / Face ID / fingerprint) as an optional faster re-login after first sign-in.
- All forms use react-hook-form + zod, with inline validation and the Input component.
- Smooth keyboard handling (KeyboardAvoidingView), and accessibility labels throughout.
Wire login/register to the real backend endpoints. Handle the "email already exists" and "wrong password" cases gracefully.
```

### Step 4.2 — Prompt: onboarding that personalizes

> **Paste into Cursor chat:**
```
Build a 3–4 step onboarding shown once after first registration (persist completion in the backend onboarding endpoints and locally):
- Step 1: Role (Medical student / Intern / Resident / Attending) and specialty (EM, IM, FM, Surgery, Radiology, Peds, OB).
- Step 2: Training year + a quick "what do you want to get better at" multi-select (e.g. chest pain, abdominal pain, head injury, low back pain).
- Step 3: Daily goal (cards/questions per day) used to drive notifications and streaks.
- Step 4: Enable notifications (ask permission) and optionally Face ID.
Use a progress indicator, swipeable steps, big tap targets, and a celebratory finish (subtle confetti via react-native-reanimated). Save answers to the user profile via the API so content can be personalized by role/specialty.
```

**How to verify:** delete and reinstall the app in Expo Go (or use a fresh test account). You should be able to register → onboard → land on a home screen, fully logged in. Close and reopen the app — you should stay logged in (and be offered Face ID).

Commit.

---

## Section 5 — The core learning engine (this is the product)

This is the heart of ARKA‑ED: residents practice **imaging‑ordering decisions** and learn the *why* through AIIE. Build it in three layers: the question runner, the case‑based mode, and the spaced‑repetition flashcards.

### Step 5.1 — Prompt: the question/quiz runner

> **Paste into Cursor chat:**
```
Build the question-runner experience powered by GET /questions/session-feed and POST submitAnswer.
Flow:
- A "Start studying" screen to choose mode (Tutor = feedback after each question; Timed = feedback at the end; Review = previously missed) and filters (category, difficulty, # of questions). Use SegmentedControl + Chips.
- The question screen shows: clinical vignette (patient age/sex, history, presentation), the question stem ("What is the most appropriate initial imaging?"), and imaging-modality options (X-ray, CT, CT-Angio, MRI, Ultrasound, No-Imaging, etc.) as large tappable cards.
- On submit: haptic feedback; correct option highlights green, chosen-wrong highlights red. Reveal the AIIEScoreBadge for the chosen and the best option, the SHAP-style factor breakdown (e.g. "Cancer history +3.0", "Age <50 −1.5"), the evidence-based explanation, references, and a teaching pearl.
- A confidence tap ("guessed / unsure / confident") recorded with the answer.
- Progress bar across the set; a results summary screen at the end (score, time, accuracy by category, "add missed to review", "make flashcards from these").
- Bookmark/flag a question. Report-an-error affordance.
- Everything must handle loading/error/empty states and be fully accessible.
Persist each answer to the backend so analytics and spaced repetition update.
```

> **Why this matters for adoption (keep it in mind while building):** the SHAP‑style "why" is your pedagogical moat. Research shows learners retain far more when they understand *why* an option is preferred rather than memorizing an answer key (see Section 11). Make the explanation the star of the screen, not an afterthought.

### Step 5.2 — Prompt: case‑based learning mode

> **Paste into Cursor chat:**
```
Build the case-based learning mode using the clinical cases + case steps from the backend.
- A Cases library screen (filter by category/difficulty; show completion + best score).
- A multi-step case player: each step presents new clinical info, asks a decision (often an imaging choice), and branches/gives feedback. Track the path the learner took.
- Show cumulative reasoning at the end: what they ordered, the AIIE-appropriate path, radiation/cost considerations where relevant, and the teaching summary.
- Save a CaseAttempt with mode and score to the backend.
Polished transitions between steps; a persistent "case progress" header.
```

### Step 5.3 — Prompt: spaced‑repetition flashcards (your "Anki" core)

> **Paste into Cursor chat:**
```
Build the flashcard / spaced-repetition experience using GET /flashcards/queue and POST /flashcards/review (the backend already stores scheduling).
- A "Due today" home widget and a dedicated Flashcards tab showing due/new/learning counts.
- A review screen: show front (a clinical prompt or imaging-appropriateness fact), tap to flip to back (answer + AIIE rationale + reference). Rating buttons: Again / Hard / Good / Easy (map to the backend SR algorithm). Haptics + smooth flip animation (reanimated).
- Let users build decks: from missed questions, by category, or custom. Show deck mastery with a ProgressRing.
- Support studying a full due queue with a satisfying end-of-session summary and streak update.
- CRITICAL: make this work OFFLINE (see Section 7). Reviews done offline queue locally and sync when back online.
Keep the loop fast and frictionless — speed is why people stick with Anki.
```

**How to verify each:** run a real session end‑to‑end on your phone. Answer a question wrong on purpose — confirm the red/green, the AIIE breakdown, and that it later appears in "Review." Flip a flashcard, rate it "Good," and confirm the count decreases and it reschedules.

Commit after each step (5.1, 5.2, 5.3 separately).

---

## Section 6 — Progress, analytics & motivation

**Goal:** show residents their growth, and give the *program director* a reason to care (this section quietly powers your curriculum pitch in Part B).

### Step 6.1 — Prompt: the analytics dashboard

> **Paste into Cursor chat:**
```
Build an Analytics/Progress tab from GET /analytics/summary:
- Headline cards: overall accuracy, current streak, questions/cards done, XP/level.
- Accuracy-by-category bar chart and a mastery heatmap (use react-native-svg / a lightweight chart lib; keep it smooth).
- A trend line of accuracy over time and a calendar-style activity grid (like a contribution graph) for daily streaks.
- "Strengths & focus areas": auto-surface the 3 weakest categories with a one-tap "Drill this" button that starts a targeted session.
- Empty state for brand-new users that nudges them to do their first session.
Make it feel rewarding and glanceable, not like a spreadsheet.
```

### Step 6.2 — Prompt: gamification (use carefully)

> **Paste into Cursor chat:**
```
Add motivation features backed by the existing achievements/XP/leaderboard models:
- Streaks with gentle, non-shaming reminders (a missed day shouldn't feel punishing).
- Achievements/badges with a celebratory unlock animation.
- An optional leaderboard (opt-in; allow anonymous handle) scoped to "my program" or "global".
- Daily goal ring on the home screen tied to the onboarding goal.
Keep gamification supportive of learning, never at the expense of accuracy or honesty. Make leaderboards opt-in to avoid anxiety.
```

Commit.

---

## Section 7 — Offline‑first & sync (what separates a toy from a tool)

**Goal:** residents study in basements, call rooms, and subway commutes. Offline study is not optional for a serious med‑ed app.

> **Paste into Cursor chat:**
```
Make ARKA-ED offline-capable:
- Use TanStack Query's persistence (with an AsyncStorage/MMKV persister) to cache the question feed, due flashcards, and analytics so they're readable offline.
- Implement an offline mutation queue: answers submitted and flashcard reviews done offline are stored locally and flushed to the backend in order when connectivity returns (use @react-native-community/netinfo to detect status).
- Show a subtle "offline — your progress is saved and will sync" banner.
- Handle conflicts gracefully (server is source of truth for scheduling; replay local reviews).
- Pre-download a configurable number of upcoming flashcards/questions when on Wi-Fi.
Write a short test plan I can follow in airplane mode to confirm offline study + sync works.
```

**How to verify:** put your phone in airplane mode, do 5 flashcards and a few questions, turn Wi‑Fi back on, and confirm everything syncs (check the web app or backend that the reviews landed). This test is also great evidence for your "it's a real tool" pitch.

Commit.

---

## Section 8 — Push notifications, AI features & billing

### Step 8.1 — Prompt: push notifications

> **Paste into Cursor chat:**
```
Implement push notifications with expo-notifications:
- On permission grant, register the Expo push token via POST /notifications/push-token.
- Handle foreground + background notifications and deep-link a tapped notification to the right screen (e.g. open the flashcard review).
- Add a Notification Settings screen (daily reminder time, "cards due" nudges, streak reminders, achievement alerts) saved to the backend notification-preferences endpoint.
- Make reminders evidence-based and kind: a single well-timed "X cards due — 4 min to keep your streak" beats spammy pings.
Document what I must configure in EAS for iOS (APNs key) and Android (FCM) and walk me through it as a beginner.
```

### Step 8.2 — Prompt: AI study features (optional but differentiating)

> **Paste into Cursor chat:**
```
Surface the backend's AI features in the app (these call existing /api/ai/* routes — the app never talks to AI providers directly):
- "Explain like I'm a PGY-1": a button on any answer that asks the backend to re-explain the AIIE rationale more simply.
- An AI Study Coach card on home that suggests today's focus based on weak areas.
- "Generate practice from my misses": create a quick custom set from recent wrong answers.
Stream responses where possible, show typing/loading states, and keep a visible non-diagnostic disclaimer. Respect any usage limits the backend returns.
```

### Step 8.3 — Prompt: subscriptions (the App Store has strict rules here)

> **Paste into Cursor chat:**
```
Add subscriptions. IMPORTANT: Apple requires digital subscriptions to use Apple In-App Purchase (StoreKit), NOT Stripe, for the iOS app. Implement with expo-in-app-purchases or RevenueCat (recommend RevenueCat for a beginner — explain why).
- Tiers mirroring the backend: Free (limited daily questions), Student, Resident, Professional.
- A clean paywall screen showing what's unlocked, with restore-purchases and manage-subscription links.
- On successful purchase, tell the backend so entitlements sync across web + mobile (explain how to reconcile RevenueCat/StoreKit with the existing Stripe records — likely store the platform + entitlement on the user).
- Gate premium content with a friendly upsell, never a dead end.
Walk me through configuring products in App Store Connect and Google Play, step by step, as a beginner. Note Apple's rule against linking out to external web payment from inside the app.
```

> ⚠️ **Beginner trap:** Using Stripe for in‑app digital subscriptions on iOS gets apps **rejected**. Use Apple IAP (RevenueCat wraps both Apple + Google so you write it once). Keep Stripe only for the website.

Commit after each step.

---

## Section 9 — Polish, accessibility, testing & performance

**Goal:** turn "works" into "feels premium and passes review." Do not skip this — it's the difference between a 2‑star and a 5‑star app.

### Step 9.1 — Prompt: polish pass

> **Paste into Cursor chat:**
```
Do a polish pass across the whole app:
- Consistent screen transitions and shared-element-style animations where tasteful (reanimated).
- Pull-to-refresh on all data screens; optimistic UI on answer/flashcard submit.
- Empty/loading/error states everywhere use our Skeleton/EmptyState/ErrorState components.
- Haptics on key moments; sound off by default.
- A polished tab bar and headers; safe-area handling on notched devices; landscape-safe layouts.
- App icon and splash screen using the ARKA brand (give me the exact asset sizes I need to provide and where to put them).
- Dark mode verified on every screen.
Then list any screens that still look unfinished and propose specific fixes.
```

### Step 9.2 — Prompt: accessibility + testing

> **Paste into Cursor chat:**
```
1. Run an accessibility pass: VoiceOver/TalkBack labels on all interactive elements, focus order, dynamic font scaling support, sufficient contrast, and reduced-motion handling. Fix what's missing.
2. Set up testing: Jest + React Native Testing Library for the API client, auth store, and the SR/answer logic; and a couple of Maestro (or Detox) end-to-end flows: register→onboard→do a session, and review flashcards offline→sync.
3. Add error monitoring with Sentry (expo) so I see crashes from real users, and basic analytics (PostHog, matching the web app) for funnel + retention.
Give me the commands to run the tests and confirm they pass.
```

### Step 9.3 — Prompt: performance

> **Paste into Cursor chat:**
```
Profile and optimize: lazy-load heavy screens, memoize expensive lists with FlashList, ensure images are sized and cached, remove unnecessary re-renders, and keep the JS bundle lean. Verify smooth 60fps scrolling on the question feed and flashcard review. Report before/after.
```

**How to verify:** turn on VoiceOver (iOS) or TalkBack (Android) and try to do a full study session using only the screen reader. If you can, residents with accessibility needs can too — and Apple reviewers check this.

Commit. Tag this commit `v1.0.0-rc1` (Cursor can do this: *"create a git tag v1.0.0-rc1 and push it"*).

> ✅ **Checkpoint:** You now have a complete, polished, tested app. Time to ship it.
---

## Section 10 — Shipping to the App Store & Google Play

**Goal:** get the app live. This is paperwork + waiting, not coding. Go slowly; mistakes here cost days, not minutes.

### Step 10.1 — Prompt: configure EAS Build & Submit

> **Paste into Cursor chat:**
```
Set up Expo Application Services (EAS) for ARKA-ED:
- Install eas-cli and run eas login (walk me through it).
- Create eas.json with development, preview, and production build profiles.
- Configure app.json/app.config.ts for production: final app name "ARKA-ED", version 1.0.0, build numbers, iOS bundle id com.arkahealth.ed, Android package com.arkahealth.ed, required permissions with human-readable purpose strings (notifications, Face ID, etc.), and the EXPO_PUBLIC_API_URL pointing at production.
- Explain, as a beginner, how to create a development build and a production build for both platforms, and how to test the production build on my own device with TestFlight (iOS) and internal testing (Android).
Give me the exact commands in order.
```

### Step 10.2 — Pre‑submission checklist (do every item)

Apple and Google reject for predictable reasons. Walk this list:

- **Apple "minimum functionality" (4.2):** the app must feel native and do real things offline/locally — your Expo build + offline study covers this. ✅
- **Medical app scrutiny (Guideline 1.4.1 / 5.1.x):** Apple reviews health/medical apps harder. Include a clear, visible **non‑diagnostic disclaimer** ("ARKA‑ED is an educational tool, not a diagnostic device; always follow local guidelines and your supervising attending") and a reminder to consult clinicians for real decisions. Disclose your data/methodology for any accuracy claims (your AIIE methodology page).
- **No ACR content:** confirm nothing in the build reproduces ACR Appropriateness Criteria — only AIIE. (IP + rejection risk.)
- **Account deletion (5.1.1(v)):** because you have accounts, you **must** offer in‑app account deletion. Add it in Settings.
- **Sign in with Apple:** if you offer Google or other third‑party login, you must also offer Sign in with Apple.
- **Privacy:** complete the **App Privacy "nutrition label"** in App Store Connect and the **Google Play Data Safety** form. Have a public Privacy Policy + Terms URL (you already host these on the website).
- **In‑app purchases:** digital subscriptions use Apple IAP / Google Billing (not Stripe) — verify.
- **Demo account:** provide reviewers a working test login (and any steps) in the review notes, or they can't test gated content → rejection.
- **Assets:** app icon (no transparency for iOS), screenshots for required device sizes, a 30‑sec preview video (optional), description, keywords, support URL, age rating.

> **Paste into Cursor chat:**
```
Implement the App Store compliance must-haves I don't have yet:
1. An in-app "Delete my account" flow in Settings that calls a backend endpoint to permanently delete the user's data (create the endpoint in the backend too), with a confirmation step.
2. Sign in with Apple (expo-apple-authentication) wired to the backend, shown alongside any other social logins.
3. A visible non-diagnostic medical disclaimer on first launch and on every screen that shows clinical recommendations.
4. A Settings "Legal" section linking to Privacy Policy and Terms.
Then generate a checklist of every screenshot size and asset I must upload for iOS and Android, and draft an App Store description, subtitle, keywords, and "What's New" text aimed at residents.
```

### Step 10.3 — Prompt: submit

> **Paste into Cursor chat:**
```
Walk me through, as a complete beginner, clicking through:
1. App Store Connect: creating the app record, uploading the production build via eas submit, filling metadata, App Privacy, attaching the demo account in review notes, and submitting for review.
2. Google Play Console: creating the app, uploading the .aab, completing Data Safety + content rating, setting up internal testing first, then production.
Tell me realistic review timelines and the most common rejection reasons for a medical-education app, and how to respond to a rejection professionally.
```

**How to verify:** your build appears in **TestFlight** (iOS) / **Internal testing** (Android). Install it on your own phone from there and run the full flow once more before pushing the "Submit for review" button. Recruit 5–10 resident friends as TestFlight testers for a week first — real bugs surface fast.

> ✅ **Part A complete.** When review passes, ARKA‑ED is live. Now make sure people *use* it and instructors *want* it.

---
# PART B — MAKE IT STICK: MARKETABILITY & CURRICULUM INTEGRATION

> This half answers your second question directly: *How do I make ARKA‑ED actually marketable and get it built into the curriculum like Anki — and what do I say when an instructor claims it isn't useful?* The short version: **anchor the product to a problem instructors already lose sleep over, prove the teaching method is evidence‑based, and make adoption effortless from both the bottom (residents) and the top (program directors).** Everything below is researched and cited so you can defend it in a room full of skeptical attendings.

---

## Section 11 — The problem is real, expensive, and unsolved (your wedge)

Instructors adopt tools that solve a problem they're *accountable* for. ARKA‑ED's wedge is **imaging‑ordering appropriateness**, and the case is strong:

- **Scale of waste.** Low‑value imaging is estimated at **20–50% of all imaging** internationally, and unnecessary medical imaging costs the U.S. roughly **$12 billion per year.** CT use reached **~93 million scans in 2023**, up 35% since 2007, much of it low‑value. ([Radiology – Hendee et al.](https://pubs.rsna.org/doi/10.1148/radiol.10100063), [Radiology Business](https://radiologybusiness.com/topics/healthcare-management/medical-practice-management/unnecessary-imaging-wastes-12b-year-and-uses-enough-electricity-power-small-town))
- **Patient harm, not just cost.** Recent UCSF work (Smith‑Bindman et al., 2025) estimates CT radiation could account for a meaningful share of future cancers — "on par with alcohol consumption and excess body weight" as a risk factor — making *appropriate* ordering a patient‑safety issue, not only a budget one. ([KFF Health News](https://kffhealthnews.org/news/article/ct-scans-cancer-risk-radiation-rules-research/), [ACR statement](https://www.acr.org/News-and-Publications/Media-Center/2025/jama-ct-scan-radiation-study))
- **Trainees are undertrained for it.** Formal training in appropriate imaging ordering is **lacking in both medical school and residency**; in one study **35% of residents were unaware of the ACR Appropriateness Criteria** and only **26%** ranked it among their top‑3 ordering resources. ([Awareness, Utilization, and Education of the ACR AC – JACR](https://www.sciencedirect.com/science/article/abs/pii/S1546144015008686))
- **The decision‑support mandate evaporated, leaving a gap.** The PAMA Appropriate Use Criteria program — which would have *forced* clinicians to consult decision support when ordering advanced imaging — was **paused/rescinded by CMS in the CY2024 rule** (42 CFR 414.94 rescinded). The regulatory stick is gone, so the burden shifts back to **education and culture**. That's exactly the space ARKA‑ED fills. ([CMS AUC Program](https://www.cms.gov/medicare/quality/appropriate-use-criteria-program), [Reed Smith analysis](https://www.reedsmith.com/our-insights/blogs/viewpoints/102j0h8/cms-puts-final-nail-in-the-coffin-of-medicare-advanced-diagnostic-imaging-auc-pro/))

**Your one‑sentence pitch to a program director:** *"Your residents order imaging every day, most never got formal training in appropriateness, the federal program that would've taught them at the point of order just died, and inappropriate imaging is both a $12B waste and a cancer‑risk problem — ARKA‑ED teaches the skill, on their phones, with evidence they can see."*

---

## Section 12 — The teaching method is evidence‑based (so it can't be waved away)

An instructor's strongest objection is *"another app won't actually make them learn."* The defense is that ARKA‑ED isn't a random app — it's built on the **two most replicated findings in the science of learning**, plus direct evidence that *appropriateness education specifically* changes ordering behavior.

### 12.1 Spaced repetition works — including in residents

- Spaced repetition has been shown in **randomized controlled trials** to improve knowledge acquisition and retention. A **large RCT of 26,000+ practicing physicians** found spaced education significantly improved both knowledge **retention and clinical transfer.** ([Kerfoot et al. – spaced education RCTs, PMID 22664558 / 21671276](https://pubmed.ncbi.nlm.nih.gov/22664558/))
- Anki specifically is **independently associated with higher USMLE Step 1 scores** and, in residents (e.g., otolaryngology), with **higher in‑service exam scores** even after adjusting for prior performance. Students using spaced‑repetition software scored **~6–11% higher** on standardized exams than peers using traditional methods. ([Anki systematic review – Med Sci Educ](https://link.springer.com/article/10.1007/s40670-026-02643-5), [Academic & wellness outcomes – PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10176558/))

### 12.2 Test‑enhanced learning (retrieval practice) beats re‑reading

- The **testing effect** is one of the best‑established results in cognitive science: actively retrieving information strengthens memory more than restudying. In residents, **repeated testing over a month produced greater retention than spaced studying**, measured 6+ months later. Optimal learning = **recall‑based testing, spaced over time, with feedback** — which is precisely ARKA‑ED's question + AIIE‑explanation + flashcard loop. ([Test‑enhanced learning in medical education – Larsen et al., PMID 18823514](https://pubmed.ncbi.nlm.nih.gov/18823514/), [Beyond what we expect – PMC9005759](https://pmc.ncbi.nlm.nih.gov/articles/PMC9005759/))

### 12.3 Appropriateness education specifically changes behavior

This is the clincher — it's not just "learning," it's *the exact skill changing*:

- **Knowledge:** an internal‑medicine residency intervention raised correct appropriate‑ordering answers from **59% → 89%.** ([Imaging Wisely – HVPAA](https://hvpaa.org/imaging-wisely-an-introduction-to-the-acr-appropriateness-criteria-and-analysis-of-its-impact-on-internal-medicine-residents/))
- **Behavior + cost (R‑SCAN):** the ACR's Radiology Support, Communication and Alignment Network — education built on appropriateness criteria — was associated with **reduced inappropriate imaging across 27 practices.** In a low‑back‑pain project, monthly inappropriate lumbar MRIs fell from **10.0 → 6.3** and the average appropriateness rating rose **4.7 → 5.8.** Scaled to Medicare, similar approaches model **~$433M** in potential savings. ([R‑SCAN multipractice cohort – PMID 32371000](https://pubmed.ncbi.nlm.nih.gov/32371000/), [Low back pain R‑SCAN – PMID 28969974](https://pubmed.ncbi.nlm.nih.gov/28969974/), [Predicted cost savings – PMID 33444562](https://pubmed.ncbi.nlm.nih.gov/33444562/))
- **In trainees with decision support:** clinical decision support improved appropriateness of advanced imaging **among physicians‑in‑training** specifically. ([Effect of CDS on appropriateness among trainees – AJR](https://ajronline.org/doi/10.2214/AJR.18.19931))

**The takeaway you put on a slide:** *Spaced retrieval practice (proven) × imaging‑appropriateness content (proven to change ordering) = a tool whose mechanism is already validated. ARKA‑ED's only job is to make that loop frictionless and engaging.*

> **Product implication:** lean into the *why*. Learners retain more when they understand the rationale, not the answer key — so the **AIIE SHAP‑style factor breakdown is your pedagogical core**, not decoration. Build content as recall questions with spaced review and transparent, evidence‑linked explanations.

---

## Section 13 — How ARKA‑ED becomes "the Anki of imaging" (the dual adoption playbook)

Anki/AnKing didn't win through a sales team. It won **bottom‑up**: a few students made high‑quality, comprehensive decks, shared them free, and the community refined them until they were the *de facto* standard, which then pulled institutions along. ([How Anki spread – AnKing / systematic review](https://link.springer.com/article/10.1007/s40670-026-02643-5)) You need **both** that grassroots motion **and** a top‑down curriculum motion. They reinforce each other.

### 13.1 Bottom‑up (residents adopt it because it's genuinely better)

The lessons from Anki's rise, applied to ARKA‑ED:

1. **Be radically useful on day one, free.** A generous free tier (enough daily questions/cards to feel the value) is the on‑ramp. Anki itself is free; the *content and community* were the moat. Your moat is **AIIE explanations + curated, board‑relevant imaging content** that's better than anything a resident could assemble themselves.
2. **Make sharing the growth engine.** Let residents create and **share decks/cases** (your backend already models study groups, sharing tokens, and discussions). A senior resident sharing "the EM imaging deck" with their interns is your most powerful acquisition channel — exactly the AnKing pattern. Add a frictionless "share to my program" and referral flow (your backend has referral invites).
3. **Win the credibility signals trainees trust:** "improves in‑service / board performance." Position content around **in‑training exams and boards**, because that's what residents optimize for — and the evidence says spaced repetition delivers there.
4. **Speed and habit.** The reason Anki sticks is a fast daily loop and streaks. Your offline‑first, push‑reminded, sub‑5‑minute daily session is the habit product.
5. **Seed champions.** Recruit a handful of chief residents / med‑ed‑interested residents at 3–5 programs as **ARKA‑ED Campus Ambassadors**: free Pro, early features, co‑authorship on a poster (Section 15). Grassroots needs igniters.

### 13.2 Top‑down (instructors build it into the curriculum)

Instructors adopt what reduces *their* workload and satisfies *their* accreditors. Make ARKA‑ED the path of least resistance:

1. **Map content to requirements they're already measured on** (Section 14). When ARKA‑ED visibly checks an accreditation box, "should we use this?" becomes "this helps us pass review."
2. **Give faculty a dashboard, not homework.** The #1 barrier to faculty tech adoption is **time** (and lack of awareness/support). Faculty will not build content or grade. So: an **instructor cohort dashboard** (assign a module, see completion + weak areas across the class, export for the CCC) and **pre‑built, faculty‑reviewed content** so they add zero work. ([Barriers to faculty tech adoption – BMC Med Educ](https://bmcmededuc.biomedcentral.com/articles/10.1186/s12909-018-1240-0))
3. **Integrate into the LMS they already use (LTI 1.3).** Medical schools and programs run Canvas/Blackboard. **LTI 1.3 / LTI Advantage** lets ARKA‑ED launch from inside the LMS with single sign‑on and **automatic grade pass‑back** — assignments and scores flow back to the gradebook with no manual work. Your backend already has LTI registration models; finishing LTI is your single highest‑leverage institutional feature. ([Canvas LTI 1.3 support](https://ed.link/community/does-canvas-support-lti-1-3-lti-advantage/), [LTI 1.3 spec – 1EdTech](https://www.imsglobal.org/spec/lti/v1p3))
4. **Offer CME/MOC credit.** Your backend already issues **CME certificates**. CME/MOC is a powerful adoption lever because residents/attendings *need* credits and programs value activities that grant them. Pursue accreditation (via an ACCME‑accredited provider partnership) so completed modules grant credit — this turns a "nice app" into a budget line.
5. **Institutional licensing = your revenue and your stickiness.** Once a program assigns it, it's embedded. Price a per‑program/per‑seat institutional tier (your backend supports institutional plans) on top of individual subscriptions.

### 13.3 The flywheel

Free residents → share decks → faculty notice high engagement → you show them the LMS/CME/dashboard story mapped to accreditation → program licenses it → every new intern is onboarded into it → those residents become attendings who expect it. That's the Anki‑to‑institution arc, compressed intentionally.

---

## Section 14 — "This isn't useful" — disarming the instructor objection

When a clinical educator says it isn't useful, they usually mean one of five specific things. Here's the precise rebuttal and the product feature that backs it.

| What the instructor really means | Evidence‑based response | The feature that proves it |
|---|---|---|
| *"Apps don't actually improve learning."* | Spaced retrieval practice is among the most validated methods in education; spaced education improved retention/transfer in a 26,000‑physician RCT, and appropriateness education raised correct‑ordering knowledge 59%→89%. | The question + AIIE explanation + spaced flashcard loop; per‑topic mastery analytics. |
| *"It won't change how they actually order."* | R‑SCAN appropriateness education **reduced inappropriate imaging** across 27 practices (e.g., lumbar MRI 10.0→6.3/month) and CDS improved appropriateness *among trainees specifically.* | Case‑based ordering decisions with AIIE feedback that mirror real point‑of‑order choices. |
| *"I don't have time to build or grade content."* | Faculty time is the #1 adoption barrier; ARKA‑ED requires zero content creation and auto‑grades via LMS pass‑back. | Pre‑built faculty‑reviewed content, instructor dashboard, LTI 1.3 grade pass‑back. |
| *"It doesn't fit our accreditation/curriculum."* | It maps directly to **ACGME Milestones**, **AAMC Core EPA 3** (recommend/interpret diagnostic tests), and **Choosing Wisely / imaging stewardship**, and can grant **CME**. | Requirement‑mapped modules + milestone/EPA tagging + CME certificates. |
| *"There's no proof it works *here*."* | Run a 6–8 week pilot with a pre/post knowledge test and an in‑training‑exam comparison — a publishable QI/med‑ed project (Section 15). | Cohort analytics + exportable pre/post data. |

### 14.1 The accreditation hooks, concretely

- **AAMC Core EPAs (medical students):** **EPA 3 — "Recommend and interpret common diagnostic and screening tests" using evidence‑based, cost‑effective principles** — is *exactly* ARKA‑ED's domain. Tag content to EPA 3 so clerkship directors can use it as EPA evidence. ([AAMC Core EPAs](https://www.aamc.org/about-us/mission-areas/medical-education/cbme/core-epas))
- **ACGME Milestones (residents):** appropriateness/stewardship maps to **Systems‑Based Practice** (resource stewardship/cost‑conscious care), **Patient Care** (diagnostic test selection), and **Medical Knowledge**. Diagnostic Radiology Milestones 2.0 and the broader competency framework give Clinical Competency Committees concrete things to document — ARKA‑ED analytics can feed that. ([ACGME Diagnostic Radiology Milestones 2.0](https://pubmed.ncbi.nlm.nih.gov/33293257/), [ACGME Milestones PDFs](https://www.acgme.org/globalassets/pdfs/milestones/diagnosticradiologymilestones.pdf))
- **Choosing Wisely / imaging stewardship:** ARKA‑ED is, in effect, a Choosing Wisely training engine — many recommendations are about *not* ordering low‑value imaging. Position it as the teaching arm of your institution's high‑value‑care goals. ([R‑SCAN / Choosing Wisely – ACR](https://www.acr.org/Practice-Management-Quality-Informatics/Imaging-3/Case-Studies/Quality-and-Safety/In-Sync))

### 14.2 The mindset

Don't argue that ARKA‑ED is "good." Argue that **the method is proven, the problem is theirs, the work is zero, and it satisfies their accreditors** — then offer to prove it with a small pilot. That reframes you from "vendor with an app" to "partner solving their accreditation + stewardship problem."

---

## Section 15 — Go‑to‑market: a concrete 90‑day plan (and how to generate your own proof)

You don't need a big launch; you need **one program that loves it** and **one piece of evidence**. Here's the sequence.

**Days 0–30 — Ship + seed.**
- Finish Part A; get the app live (even a tight v1: questions + AIIE + flashcards + analytics + offline).
- Recruit **3–5 resident champions** across 2–3 programs (start with your own network). Give them free Pro.
- Stand up a simple landing page + App Store/Play links; collect emails. (Your `arkahealth` marketing site already has an ARKA‑ED page and blog — reuse it.)

**Days 30–60 — Pilot for evidence.**
- Partner with **one** program director or clerkship director. Pitch the Section 14 framing.
- Run a **structured pilot**: a defined cohort uses ARKA‑ED 4–6 weeks; administer a **pre‑ and post‑knowledge test** on imaging appropriateness; track engagement; if possible compare in‑training‑exam items or order‑appropriateness before/after. This mirrors the R‑SCAN baseline→education→post design and is **publishable** as a med‑ed/QI abstract.
- Build the **instructor dashboard** and finish **LTI 1.3** so the pilot is zero‑effort for faculty.

**Days 60–90 — Convert + scale the proof.**
- Turn the pilot data into a **poster/abstract** (champions as co‑authors — this is how you earn academic credibility and free word‑of‑mouth). Target a med‑ed or radiology education meeting.
- Convert the pilot program to a **paid institutional license**; use the abstract + champion testimonials to approach 3–5 more programs.
- Pursue **CME accreditation** via an accredited provider partner to unlock the credit lever.
- Keep the **bottom‑up engine** running: deck sharing, referrals, ambassadors.

**The metrics that matter (and that sell):** weekly active users / streak retention (habit), pre→post knowledge gain (learning), accuracy improvement by topic (mastery), and — the holy grail — any signal of **changed ordering behavior or in‑training‑exam improvement.** Those four numbers are your whole sales deck.

---
# APPENDICES

## Appendix A — The build at a glance (your checklist)

- [ ] **0** Accounts created (GitHub, Expo, Apple $99, Google $25); tools installed; Expo Go on phone.
- [ ] **1** Expo app scaffolded, on GitHub, `.cursorrules` written, runs in Expo Go.
- [ ] **2** Backend mobile API audited + gaps filled; typed API client; **login works against real backend**.
- [ ] **3** Design system + UI kit built; QA'd on `/dev/ui-kit` in light + dark.
- [ ] **4** Auth + onboarding; stays logged in; Face ID optional.
- [ ] **5** Question runner + case mode + spaced‑repetition flashcards (the product).
- [ ] **6** Analytics dashboard + (opt‑in) gamification.
- [ ] **7** Offline study + sync (tested in airplane mode).
- [ ] **8** Push notifications + AI features + Apple/Google IAP subscriptions.
- [ ] **9** Polish + accessibility + tests + performance; tag `v1.0.0-rc1`.
- [ ] **10** EAS build, compliance checklist, TestFlight/internal test, submit to stores.

## Appendix B — Glossary for total beginners

- **Backend / API:** the server + database that stores data and does logic. ARKA‑ED's already exists.
- **Endpoint:** one specific URL the app calls to get/send data (e.g. `/api/mobile/auth/login`).
- **Token (access/refresh):** a digital wristband proving you're logged in; refresh tokens get you a new one when it expires.
- **Component:** a reusable piece of UI (a button, a card).
- **State:** data the app remembers while running (who's logged in, current question).
- **Build:** turning your code into the installable file stores accept (`.ipa` iOS, `.aab` Android).
- **EAS:** Expo's cloud that makes those builds and submits them.
- **TestFlight / Internal testing:** Apple's / Google's way to try your app before public release.
- **LTI:** the standard that lets your app live inside a school's LMS (Canvas) with single sign‑on and grade pass‑back.
- **CME/MOC:** continuing‑education credits clinicians need; granting them makes your app something programs will pay for.

## Appendix C — When you get stuck (copy‑paste rescue prompts)

- Generic error: `I ran [what you did] and got this error: [paste full error]. Explain it in plain English and fix it without changing unrelated code.`
- App won't start: `npx expo start fails / the app shows a red screen. Here's the full output: [paste]. Diagnose and fix step by step.`
- Looks wrong: `On the [screen name] screen, [describe what's wrong] in [light/dark] mode. Here's a screenshot. Fix the styling to match our design system.`
- Lost the thread: `Summarize the current state of this project, what's done, and what the next logical step is based on the ARKA-ED playbook.`
- Backend confusion: `Open MOBILE_API_CONTRACT.md and tell me whether an endpoint exists for [feature]. If not, implement it following existing patterns.`

## Appendix D — Sources & further reading

**Problem size & patient safety**
- Hendee et al., *Addressing Overutilization in Medical Imaging*, Radiology — https://pubs.rsna.org/doi/10.1148/radiol.10100063
- *Unnecessary imaging wastes $12B a year*, Radiology Business — https://radiologybusiness.com/topics/healthcare-management/medical-practice-management/unnecessary-imaging-wastes-12b-year-and-uses-enough-electricity-power-small-town
- Smith‑Bindman CT radiation coverage, KFF Health News — https://kffhealthnews.org/news/article/ct-scans-cancer-risk-radiation-rules-research/
- ACR statement on the JAMA CT radiation study — https://www.acr.org/News-and-Publications/Media-Center/2025/jama-ct-scan-radiation-study

**Training gap & decision support**
- *Awareness, Utilization, and Education of the ACR Appropriateness Criteria*, JACR — https://www.sciencedirect.com/science/article/abs/pii/S1546144015008686
- *Effect of Clinical Decision Support on Appropriateness… Among Physicians‑in‑Training*, AJR — https://ajronline.org/doi/10.2214/AJR.18.19931
- CMS Appropriate Use Criteria Program (paused) — https://www.cms.gov/medicare/quality/appropriate-use-criteria-program
- Reed Smith, *CMS puts final nail in the coffin of the AUC program* — https://www.reedsmith.com/our-insights/blogs/viewpoints/102j0h8/cms-puts-final-nail-in-the-coffin-of-medicare-advanced-diagnostic-imaging-auc-pro/

**Learning science (spaced repetition & retrieval practice)**
- Kerfoot et al., spaced education RCTs — PMID 22664558, 21671276 — https://pubmed.ncbi.nlm.nih.gov/22664558/
- Larsen et al., *Test‑enhanced learning in medical education* — PMID 18823514 — https://pubmed.ncbi.nlm.nih.gov/18823514/
- *Beyond what we expect: test‑enhanced learning…* PMC9005759 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9005759/
- *Anki Use and Academic Performance in Medical Education: A Systematic Review*, Med Sci Educ — https://link.springer.com/article/10.1007/s40670-026-02643-5
- *Academic and Wellness Outcomes… Anki in Medical School*, PMC10176558 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10176558/

**Appropriateness education changes behavior**
- *Imaging Wisely* (IM residents, 59%→89%), HVPAA — https://hvpaa.org/imaging-wisely-an-introduction-to-the-acr-appropriateness-criteria-and-analysis-of-its-impact-on-internal-medicine-residents/
- R‑SCAN multipractice cohort — PMID 32371000 — https://pubmed.ncbi.nlm.nih.gov/32371000/
- R‑SCAN reducing inappropriate lumbar MRI — PMID 28969974 — https://pubmed.ncbi.nlm.nih.gov/28969974/
- R‑SCAN predicted Medicare cost savings (~$433M) — PMID 33444562 — https://pubmed.ncbi.nlm.nih.gov/33444562/
- ACR R‑SCAN / Choosing Wisely "In Sync" — https://www.acr.org/Practice-Management-Quality-Informatics/Imaging-3/Case-Studies/Quality-and-Safety/In-Sync

**Curriculum & accreditation hooks**
- AAMC Core EPAs (EPA 3) — https://www.aamc.org/about-us/mission-areas/medical-education/cbme/core-epas
- ACGME Diagnostic Radiology Milestones 2.0 — https://pubmed.ncbi.nlm.nih.gov/33293257/ ; PDF — https://www.acgme.org/globalassets/pdfs/milestones/diagnosticradiologymilestones.pdf
- Barriers to faculty tech adoption, BMC Medical Education — https://bmcmededuc.biomedcentral.com/articles/10.1186/s12909-018-1240-0
- Supporting faculty adoption of technology, EDUCAUSE — https://er.educause.edu/articles/2017/2/supporting-faculty-adoption-of-technology-what-can-we-do

**Standards & store rules**
- LTI 1.3 / LTI Advantage spec — https://www.imsglobal.org/spec/lti/v1p3 ; Canvas support — https://ed.link/community/does-canvas-support-lti-1-3-lti-advantage/
- Apple App Review Guidelines — https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy details — https://developer.apple.com/app-store/app-privacy-details/

---

### A note on scope and honesty

This playbook assumes your existing `arka-ed` backend is sound; the mobile app reuses it rather than rebuilding it. Two things to be candid about: (1) **CME accreditation and LTI certification take real time and sometimes partner organizations** — start them early, in parallel with the build; and (2) the strongest adoption argument is **your own pilot data**, so treat Section 15's pilot as a first‑class deliverable, not an afterthought. The literature proves the *method*; your pilot proves *your product*. Build the loop, prove it once, and let the Anki‑style flywheel and the accreditation hooks do the rest.

