# ARKA — Live Demo Fix: Cursor Prompt Playbook

**Date:** June 8, 2026
**Scope:** Three production bugs in the public ARKA site / demos
1. Action Plan page — embedded PDF shows **"www.getarka.health refused to connect"**
2. CDS Hooks Live Demo — orders stick on **"Evaluating order…"**, JSON Response shows **`Unexpected token 'A', "An error o"... is not valid JSON`** and the sidebar reads **Offline** / blank
3. Demo-wide sweep — find and kill every other glitch of the same kind

**How to use this document**
Open the repo in Cursor. Work through the prompts **in order**. Each prompt is fully self-contained — paste the bolded prompt text into Cursor's chat (Cmd/Ctrl-L), let it apply, then run the verification command listed under it before moving on. Do **not** skip the verification steps; they are how you confirm each layer is actually fixed.

The prompts are written so Cursor edits the *real* files in this repo. File paths and current code are quoted so Cursor has exact anchor points. Everything has already been root-caused against the current source — you are not exploring, you are applying known fixes.

---

## Root-cause summary (read this first — 3 min)

### Bug 1 — PDF "refused to connect"

- `app/action-plan/page.tsx` renders `components/action-plan/ActionPlanViewer.tsx`, which embeds the PDF (`/docs/ARKA_Action_Plan_ver8.pdf`, present in `public/docs/`) inside an `<object>` with an `<iframe>` fallback.
- `vercel.json` sets these headers on **every** route (`source: "/(.*)"`):
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: … frame-ancestors 'none'; …` (and **no** `frame-src` / `object-src` directive, so they fall back to `default-src 'self'`).
- When the browser tries to render the PDF inside the `<object>`/`<iframe>`, the **PDF's own response** carries `X-Frame-Options: DENY` and `frame-ancestors 'none'`, which forbid it from being displayed in *any* frame — including a same-origin one. The browser refuses and shows **"refused to connect."** All the other buttons ("Open in new tab", "Download PDF") work because they are top-level navigations, not embeds.
- **Fix:** relax framing for same-origin so the site can embed its own assets, and add the missing `frame-src`/`object-src` CSP directives. This also fixes the map embeds in Bug 3.

### Bug 2 — CDS Hooks demo: "Offline" / non-JSON error / long buffering

Two layers are broken — **both** must be fixed.

**Server layer** (`app/api/cds-services/arka-clin-appropriateness/route.ts` and `…-sign/route.ts`):
- The route declares `export const maxDuration = 10` (Vercel kills the function at 10s).
- It calls `handleOrderSelect` → `createMlClient().predict()` (`lib/cds-platform/cds-hooks/order-select.ts`, `lib/cds-platform/ml/xgboost-client.ts`).
- The ML client defaults to `ML_SERVICE_URL=http://localhost:8000` (see `.env.local`), which **does not exist in production**. With `ML_SERVICE_TIMEOUT=5000` and the client's default `retryCount = 2`, a hung/unreachable host burns **up to 5s × 3 attempts = 15s** — *longer than the 10s function budget*.
- Result: Vercel terminates the function mid-flight and returns its **own plain-text/HTML error** ("An error occurred…"). That is the exact `Unexpected token 'A'` the JSON panel shows. This is also the "buffers for a long time."
- Secondary risk: `withInsApiLogging` (`lib/server/with-ins-api-logging.ts`) **re-throws** on error, and `writeDecisionLog` (Supabase) can throw/hang in prod — either path makes the route emit a non-JSON 500.

**Client layer** (`components/cds-platform/demo/CdsDemoClient.tsx`, `invokeHook`):
- `const response = (await res.json()) …` runs with **no `res.ok` check and no timeout**. A 504/HTML body throws on `.json()`, `response` becomes `null`, the sidebar falls back to "Offline," and the JSON panel prints the raw parser error.
- The good news: the sidebar's *display* already degrades gracefully from scenario data (`demo-response.ts` → `buildPredictionFromCard` / `resolveMedicalBasis` / `resolveShapRows` all accept an `undefined` card). What's missing is a **client-side synthetic CDS response** so the JSON panel and the Live badge stay correct when the network call fails.

**Fix strategy:** make the server *never* exceed its budget and *never* return non-JSON, and make the client *time out fast and fall back to a locally-built CDS response* so all four scenarios render flawlessly regardless of backend availability.

### Bug 3 — demo-wide

- The same CSP that blocks the PDF also has **no `frame-src`**, so the INS Patient Explainer map embeds (`components/ins/patient/PatientExplainerClient.tsx` — Google Maps + OpenStreetMap iframes) are blocked too. Fixed by the same CSP edit (Prompt 1) plus the explicit allow-list in Prompt 7.
- Several other client fetches parse JSON without `res.ok`/timeout guards. Prompt 8 hardens the shared pattern.

---

# PART 1 — Fix the Action Plan PDF (Bug 1)

## Prompt 1 — Relax framing headers in `vercel.json`

> **Cursor prompt:**
>
> In `vercel.json`, the global `headers` block (the entry with `"source": "/(.*)"`) currently breaks embedding our own PDF and map iframes. Make these exact changes to that headers array:
>
> 1. Change the `X-Frame-Options` header value from `"DENY"` to `"SAMEORIGIN"`.
> 2. In the `Content-Security-Policy` value, change `frame-ancestors 'none'` to `frame-ancestors 'self'`.
> 3. In the same `Content-Security-Policy` value, add two new directives so our own PDFs and trusted map embeds render: add `object-src 'self' blob:` and add `frame-src 'self' https://www.google.com https://maps.google.com https://www.openstreetmap.org`.
>
> Keep every other directive (`default-src`, `base-uri`, `form-action`, `img-src`, `font-src`, `connect-src`, `script-src`, `style-src`, `upgrade-insecure-requests`) exactly as it is. Keep `Strict-Transport-Security` and `Referrer-Policy` unchanged. Do not reorder the headers array. Output the full updated `vercel.json`.

For reference, the resulting CSP value should read (single line in the file):

```
default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; frame-src 'self' https://www.google.com https://maps.google.com https://www.openstreetmap.org; object-src 'self' blob:; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sandbox.cds-hooks.org; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests
```

**Why `SAMEORIGIN` is safe:** it still blocks *cross-origin* clickjacking (third-party sites can't frame ARKA), but allows ARKA to embed its own assets. This is the standard posture for sites that show their own PDFs/maps inline.

**Verify:**
```bash
# After deploy (or `vercel dev`), confirm the PDF response no longer forbids framing:
curl -sI https://www.getarka.health/docs/ARKA_Action_Plan_ver8.pdf | grep -i -E "x-frame-options|content-security-policy"
# Expect: x-frame-options: SAMEORIGIN  AND  frame-ancestors 'self' in the CSP
```

---

## Prompt 2 — Make the PDF viewer bullet-proof (defense in depth)

Even with the headers fixed, some Chromium builds and most iOS Safari versions won't paint a PDF inside an `<object>` reliably. Add a graceful in-page fallback so the page **always** shows something useful instead of a dead grey box.

> **Cursor prompt:**
>
> Open `components/action-plan/ActionPlanViewer.tsx`. Right now it renders a single `<object data={viewerSrc} type="application/pdf">` with an `<iframe>` and a text link as fallback. Improve robustness without changing the visual design:
>
> 1. Add `'use client'` is already present — keep it.
> 2. Add a `useState<'loading' | 'ok' | 'error'>('loading')` named `status` and a `useEffect` that does a lightweight `fetch(src, { method: 'HEAD' })`; if the response is not ok, set `status` to `'error'`, otherwise `'ok'`. Wrap in try/catch and set `'error'` on throw. Give the fetch a 6-second `AbortController` timeout.
> 3. Keep the existing `<object>` + `<iframe>` markup as the primary renderer when `status !== 'error'`.
> 4. When `status === 'error'`, render a clean fallback card (reusing the existing Tailwind classes / colors `text-arka-text-soft`, `text-arka-cyan`) that says the inline preview is unavailable and offers two buttons: "Open the Action Plan in a new tab" (`href={src}` target `_blank` rel `noopener noreferrer`) and "Download PDF" (`href={src}` `download`). Do not remove the existing inner text-link fallback inside the `<object>`.
> 5. Add `onError={() => setStatus('error')}` to the `<object>` element so a failed embed also trips the fallback.
>
> Keep the container `div` classes, the `max-w-6xl`, rounded border, and height classes exactly as they are. Output the full updated file.

**Verify:**
```bash
npm run build && npm run start
# Visit http://localhost:3000/action-plan
# Expect: PDF renders inline. Temporarily rename the PDF to simulate a 404 and confirm the fallback card (two working buttons) appears instead of a grey box.
```

---

# PART 2 — Fix the CDS Hooks Live Demo (Bug 2)

> The order of operations matters: fix the **ML client budget** (Prompt 3) → make the **routes never return non-JSON** (Prompt 4) → harden the **client fetch + add local fallback** (Prompt 5) → set **production env vars** (Prompt 6). After all four, every scenario works whether or not the Python ML service is up.

## Prompt 3 — Bound the ML client so it can never exceed the function budget

> **Cursor prompt:**
>
> The CDS routes set `export const maxDuration = 10` but the ML client can run for up to 15s (5s timeout × 3 attempts), so Vercel kills the function and returns a non-JSON error. Fix the time budget at the source.
>
> In `lib/cds-platform/ml/xgboost-client.ts`:
> - Change `const DEFAULT_TIMEOUT_MS = 15_000;` to `const DEFAULT_TIMEOUT_MS = 2_500;`
> - Change `const DEFAULT_RETRY_COUNT = 2;` to `const DEFAULT_RETRY_COUNT = 1;`
>
> In `lib/cds-platform/ml/ml-config.ts`:
> - Change `const DEFAULT_ML_TIMEOUT_MS = 5000;` to `const DEFAULT_ML_TIMEOUT_MS = 2500;`
> - In `createMlClient()`, pass an explicit `retryCount: 1` option alongside the existing `baseUrl` and `timeout` so the worst case is 2 attempts × 2.5s = 5s, comfortably inside the 10s function budget. Leave the `timeout` wired to `getMlServiceTimeoutMs()`.
>
> Do not change the fallback logic (`isMlFallbackEnabled` must keep defaulting to `true`). Output both full updated files.

**Why:** worst-case ML latency now ≈ 5s, leaving ≥5s of headroom under `maxDuration = 10`. The rule-based fallback (`scoreScenario`) still produces a real, guideline-anchored card when the ML service is down — so the demo is *correct*, not just fast.

**Verify:**
```bash
grep -n "DEFAULT_TIMEOUT_MS\|DEFAULT_RETRY_COUNT" lib/cds-platform/ml/xgboost-client.ts
grep -n "DEFAULT_ML_TIMEOUT_MS\|retryCount" lib/cds-platform/ml/ml-config.ts
```

---

## Prompt 4 — Guarantee the CDS routes ALWAYS return valid JSON within budget

> **Cursor prompt:**
>
> The CDS Hooks routes must never return a non-JSON body and must never exceed their time budget, even if the ML service, FHIR prefetch, or Supabase decision-log hangs. Apply a defensive wrapper to both order-select and order-sign routes.
>
> **File `app/api/cds-services/arka-clin-appropriateness/route.ts`:**
> 1. Wrap the entire body of `handleClinAppropriatenessPost` in a `try/catch`. In the `catch`, log the error with `console.error("[arka-clin-appropriateness] unhandled", err)` and `return jsonResponse({ cards: [] }, 200)` — a valid empty CDS Hooks response, never a 500 with an HTML body. (Status 200 keeps the client's `res.json()` happy; empty `cards` is a valid, spec-compliant CDS Hooks response.)
> 2. Add an overall deadline so the handler resolves even if something downstream hangs. Create a helper at top of file:
>    ```ts
>    function withDeadline<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
>      return new Promise<T>((resolve) => {
>        const t = setTimeout(() => resolve(fallback), ms);
>        p.then((v) => { clearTimeout(t); resolve(v); })
>         .catch(() => { clearTimeout(t); resolve(fallback); });
>      });
>    }
>    ```
>    Wrap the `handleOrderSelect(platformRequest)` call: `const raw = await withDeadline(handleOrderSelect(platformRequest), 8000, { cards: [] });` so the route can't blow past 8s regardless of ML/FHIR behaviour.
> 3. Make the decision-log writes non-fatal: wrap each `await writeDecisionLog(...)` in its own `try/catch` that swallows + `console.warn`s the error, OR change them to fire-and-forget (`void writeDecisionLog(...).catch(() => {})`). A logging failure must never break the clinical response.
>
> **File `app/api/cds-services/arka-clin-appropriateness-sign/route.ts`:** apply the identical three changes (top-level try/catch returning `jsonResponse({ cards: [] }, 200)`, the `withDeadline` helper around `handleOrderSign(platformRequest)` at 8000ms, and non-fatal decision-log writes).
>
> Keep `maxDuration = 10`, the `CDS_HEADERS`, CORS `OPTIONS` handler, and the FDA enrichment logic unchanged. Output both full updated files.

**Verify:**
```bash
npm run dev
# In another terminal, hit the endpoint directly with a demo payload:
curl -s -X POST http://localhost:3000/api/cds-services/arka-clin-appropriateness \
  -H "Content-Type: application/json" \
  -d '{"hook":"order-select","hookInstance":"test-1","context":{"patientId":"demo-patient-lbp-1","userId":"demo-practitioner-001","draftOrders":{"resourceType":"Bundle","type":"collection","entry":[]}}}' | head -c 300
# Expect: valid JSON starting with {"cards": ... — never HTML, never "An error occurred".
# Simulate ML outage: set ML_SERVICE_URL=http://10.255.255.1:9 (a black-hole IP) in .env.local, restart, repeat.
# Expect: still valid JSON within ~5-8s (rule-based fallback cards), never a hang to 10s.
```

---

## Prompt 5 — Harden the demo client: timeout, `res.ok`, safe parse, and local fallback

> **Cursor prompt:**
>
> In `components/cds-platform/demo/CdsDemoClient.tsx`, the `invokeHook` function does `const response = (await res.json()) as CDSHookResponse;` with no `res.ok` check, no timeout, and no fallback — so a slow or non-JSON server response makes the order stick on "Evaluating order…" and the sidebar show "Offline." Rewrite `invokeHook` to be resilient, and add a client-side synthetic response so all four scenarios always render.
>
> Requirements:
> 1. Add an `AbortController` with a **9-second** timeout to the `fetch` call (clear it in a `finally`).
> 2. After `fetch`, check `res.ok`. Read the body as text first (`const text = await res.text()`), then `JSON.parse` inside a `try/catch`. If `!res.ok`, JSON.parse throws, or the parsed body lacks a `cards` array, treat it as a failure.
> 3. On **any** failure (network error, timeout, non-JSON, bad shape), do NOT return `{ response: null }`. Instead build a **local fallback CDS response** from the active `scenario` and return it, with a flag so the UI can mark the exchange as offline-sourced. Add `offline?: boolean` to the `HookExchange` interface.
> 4. Add a new exported helper in `components/cds-platform/demo/demo-response.ts` named `buildLocalCdsResponse(scenario: DemoScenario, hook: 'order-select' | 'order-sign'): CDSHookResponse` that synthesizes a spec-valid response: one card whose `summary`/`detail` reflect `scenario.expectedTier` and `scenario.medicalBasis`, `indicator` mapped from the tier (`passive`→`info`, `warning`→`warning`, `interruptive`→`critical`), `source` `{ label: scenario.medicalBasis.label, url: scenario.medicalBasis.url ?? 'https://arkahealth.com/clin' }`, a `detail` that **includes `scenario.medicalBasis.label`** (so it matches the existing card-rendering expectations) and the FDA non-device disclosure string, and an `extension.shapWithRationales` built from the existing `resolveShapRows(undefined, scenario)`. Reuse existing imports/types where possible.
> 5. In `invokeHook`'s catch/fallback path, call `buildLocalCdsResponse(scenario, hook)` and return `{ hook, request, response: <local>, offline: true }`.
> 6. Update the `live` badge logic: set `setLive(true)` only when the most recent order-select exchange was **not** offline; when it was offline, set `setLive(false)` so the badge correctly reads "○ Idle"/offline rather than falsely claiming a live connection. (Optionally relabel the offline state in the badge to "● Cached" — your call, but it must not say "● Live" when the data came from the local fallback.)
> 7. In the JSON Response panel rendering (the `exchanges.map(...)` block), when `ex.offline` is true, prepend a small muted note above the JSON like `// Served from cached scenario response (CDS endpoint unreachable)` so the panel never shows a raw parser error again. Keep showing the real `ex.response` JSON underneath.
>
> Keep all existing state, effects, ROI logic, and layout intact. The four scenarios (`lbp-1`, `ha-1`, `belly`, `knee`) must each render a populated sidebar and a valid JSON exchange whether the API succeeds or fails. Output the full updated `CdsDemoClient.tsx` and the updated `demo-response.ts`.

**Verify:**
```bash
npm run dev
# Visit http://localhost:3000/cds-hooks-demo
# Click through ALL FOUR scenarios (LBP-1, HA-1, Belly, Knee). For each:
#   - "Evaluating order…" resolves in < 9s every time
#   - Sidebar shows a populated recommendation card (never blank/Offline)
#   - "Live CDS Hooks JSON" → Response shows valid JSON (never "Unexpected token 'A'")
# Then kill the ML service / point ML_SERVICE_URL at a black hole and repeat:
#   - All four still render via the cached fallback, JSON panel shows the cached note + valid JSON.
```

---

## Prompt 6 — Production environment configuration (Vercel)

The code fixes above make the demo correct even with no ML service. To get *real* ML scoring in production (and to stop pointing at `localhost`), set the deployment env vars. This is a configuration change, not a code change.

> **Cursor prompt (if you keep env defaults in code/docs):**
>
> Update `.env.example` to document the production-safe CDS/ML settings and add a short note. Ensure these keys are present with guidance comments:
> ```
> # ML scoring service. In production set to the deployed FastAPI URL, e.g. https://arka-ml.fly.dev
> # If unset/unreachable, the CDS routes fall back to rule-based AIIE scoring (still guideline-anchored).
> ML_SERVICE_URL=
> ML_SERVICE_TIMEOUT=2500
> ML_FALLBACK_ENABLED=true
> ```
> Do not commit real secrets. Output the updated `.env.example`.

**Manual step (do this in the Vercel dashboard, not in code):**
- Project → Settings → Environment Variables. Either:
  - **Option A (recommended for the demo):** leave `ML_SERVICE_URL` **unset** so every CDS call uses the fast rule-based fallback (deterministic, no external dependency, always works). Keep `ML_FALLBACK_ENABLED=true`.
  - **Option B (full ML):** set `ML_SERVICE_URL` to your deployed Python service URL (HTTPS, reachable from Vercel's `iad1` region) and `ML_SERVICE_TIMEOUT=2500`.
- Remove any `ML_SERVICE_URL=http://localhost:8000` value from the **Production** environment — `localhost` can never resolve on Vercel and is the original source of the hang.
- Redeploy.

---

 PART 3 — Demo-wide sweep & verification (Bug 3)

## Prompt 7 — Confirm map embeds (INS Patient Explainer) are unblocked

Prompt 1 already added `frame-src` for Google Maps + OpenStreetMap. Verify the Patient Explainer maps now load, since they were silently blocked by the old CSP (`frame-src` was falling back to `default-src 'self'`).

> **Cursor prompt:**
>
> In `components/ins/patient/PatientExplainerClient.tsx` there are two `<iframe>` map embeds: one to `https://www.google.com/maps?...&output=embed` and one to `https://www.openstreetmap.org/export/embed.html?...`. Confirm both iframe `src` origins are covered by the `frame-src` directive we set in `vercel.json` (`https://www.google.com` and `https://www.openstreetmap.org`). If the Google e#mbed uses `maps.google.com` anywhere, ensure that origin is also in `frame-src`. Add a `sandbox="allow-scripts allow-same-origin allow-popups"` attribute to both map iframes for tighter scoping without breaking the embed. Do not change the URLs or layout. Output the updated file.

**Verify:**
```bash
npm run dev
# Visit the INS patient explainer flow (app/ins/... patient route) and confirm both maps render (no blank box, no CSP error in console).
# In DevTools console, there should be NO "Refused to frame ... because it violates the following Content Security Policy directive" errors.
```

---

## Prompt 8 — Add a shared resilient-fetch helper and adopt it across demo clients

Several demo/data clients (`ValidationDashboard.tsx`, `ReferenceEvidenceDrawer.tsx`, `app/clin-suite/page.tsx`, `components/demos/clin/SwallowTriageCard.tsx`, the INS dashboards) call `await res.json()` with inconsistent or missing `res.ok`/timeout handling, which can produce the same "stuck spinner / raw parser error" class of bug under load or outage.

> **Cursor prompt:**
>
> Create a new file `lib/utils/safe-fetch-json.ts` exporting an async helper:
> ```ts
> export async function safeFetchJson<T>(
>   input: RequestInfo | URL,
>   init?: RequestInit & { timeoutMs?: number },
> ): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> { ... }
> ```
> Behaviour: apply an `AbortController` timeout (default 9000ms from `init.timeoutMs`), `await fetch`, check `res.ok`, read the body as text then `JSON.parse` inside try/catch, and return a discriminated union. Never throw — always resolve to the `{ ok }` shape. Clear the timeout in `finally`. Include JSDoc.
>
> Then refactor these call sites to use `safeFetchJson` and render a friendly inline error/empty state instead of letting `.json()` throw, **without changing their visual design or success behaviour**:
> - `components/cds-platform/validation/ValidationDashboard.tsx` (lines around the two `res.json()` calls)
> - `components/shared/ReferenceEvidenceDrawer.tsx`
> - `components/demos/clin/SwallowTriageCard.tsx`
> - `app/clin-suite/page.tsx`
>
> For each, on `{ ok: false }` show the component's existing error/empty UI (or a minimal "Temporarily unavailable — retry" message reusing existing classes) rather than a crash or infinite spinner. Do not touch the INS reviewer/provider dashboards in this prompt (they are gated behind DEMO_MODE and out of scope here). Output the new helper and each refactored file.

**Verify:**
```bash
npx tsc --noEmit
npm run dev
# Visit each touched view; confirm normal rendering. Then throttle/offline in DevTools and confirm each shows a graceful message, not a stuck spinner or red console crash.
```

---

## Prompt 9 — Full end-to-end verification pass

> **Cursor prompt:**
>
> Run a production build and the existing test suite, and report any failures with file + line. Commands:
> ```
> npm run build
> npx tsc --noEmit
> npm test
> ```
> If `npm run build` fails, fix only the errors introduced by the changes in this playbook (CSP/headers, xgboost-client, ml-config, the two CDS routes, CdsDemoClient, demo-response, ActionPlanViewer, safe-fetch-json and its adopters). Do not refactor unrelated code. Report the final pass/fail status of each command.

**Manual smoke test (do this against `npm run start` or a Vercel preview):**

| # | Page / action | Expected result |
|---|---|---|
| 1 | `/action-plan` | PDF renders inline; "Open in new tab" + "Download PDF" work |
| 2 | `/action-plan` with PDF temporarily 404'd | Fallback card with two working buttons (no grey box) |
| 3 | `/cds-hooks-demo` → **LBP-1** | Sidebar populated; JSON Response valid; spinner resolves <9s |
| 4 | `/cds-hooks-demo` → **HA-1** | Same — populated card, valid JSON |
| 5 | `/cds-hooks-demo` → **Belly** | Same |
| 6 | `/cds-hooks-demo` → **Knee** | Same |
| 7 | `/cds-hooks-demo` with ML black-holed | All four still render via cached fallback; JSON panel shows cached note + valid JSON; badge not falsely "Live" |
| 8 | INS Patient Explainer | Both map iframes render; no CSP errors in console |
| 9 | DevTools console, every page above | No "Refused to frame" / "Refused to connect" / "Unexpected token" errors |

---

## Quick reference — every file this playbook touches

| File | Change | Prompt |
|---|---|---|
| `vercel.json` | `X-Frame-Options: SAMEORIGIN`; CSP `frame-ancestors 'self'` + `frame-src` + `object-src` | 1 |
| `components/action-plan/ActionPlanViewer.tsx` | HEAD-check + error fallback card | 2 |
| `lib/cds-platform/ml/xgboost-client.ts` | `DEFAULT_TIMEOUT_MS=2500`, `DEFAULT_RETRY_COUNT=1` | 3 |
| `lib/cds-platform/ml/ml-config.ts` | `DEFAULT_ML_TIMEOUT_MS=2500`, explicit `retryCount:1` | 3 |
| `app/api/cds-services/arka-clin-appropriateness/route.ts` | top-level try/catch → JSON, `withDeadline`, non-fatal logs | 4 |
| `app/api/cds-services/arka-clin-appropriateness-sign/route.ts` | same as above | 4 |
| `components/cds-platform/demo/CdsDemoClient.tsx` | timeout + `res.ok` + safe parse + local fallback + badge | 5 |
| `components/cds-platform/demo/demo-response.ts` | new `buildLocalCdsResponse` | 5 |
| `.env.example` | document ML env vars | 6 |
| `components/ins/patient/PatientExplainerClient.tsx` | iframe `sandbox` attrs | 7 |
| `lib/utils/safe-fetch-json.ts` (new) | shared resilient fetch | 8 |
| `ValidationDashboard.tsx`, `ReferenceEvidenceDrawer.tsx`, `SwallowTriageCard.tsx`, `app/clin-suite/page.tsx` | adopt `safeFetchJson` | 8 |

---

### One-paragraph summary for the commit message

> Fix public demo reliability: (1) relax `vercel.json` framing headers (`X-Frame-Options: SAMEORIGIN`, CSP `frame-ancestors 'self'` + `frame-src`/`object-src`) so the Action Plan PDF and INS map embeds render inline instead of "refused to connect"; (2) bound the XGBoost client time budget (2.5s × 2 attempts) under the 10s Vercel function limit, wrap CDS routes so they always return spec-valid JSON within 8s and never a 504 HTML body, and make decision-log writes non-fatal; (3) harden the CDS demo client with fetch timeout + `res.ok` + safe JSON parse + a local synthetic CDS fallback so all four scenarios render flawlessly online or offline; (4) add a shared `safeFetchJson` helper and adopt it across demo clients. No behavioural change when services are healthy; graceful, correct degradation when they are not.
