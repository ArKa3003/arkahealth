# ARKA — Unified Demo Video Script (v3 — Revenue-First)

**Target length:** 2:55 main cut (hard cap 3:05). 1:20 teaser cut at the bottom.
**Audience priority:** Profit-focused first — hospital CFOs, rev-cycle directors, and the seed/Series-A investors who underwrite them. Clinicians and regulatory reviewers second (the demo earns their trust; the numbers earn the signature).
**Format:** Single-screen recording with founder voiceover. 1920×1080 at 60 fps. Chrome at 1440 wide, clean profile, no extensions, no bookmark bar.
**Tone:** Confident. Calm. Fast. Money-first. No corporate narrator. No music under the voice — music only in the cold open (first 10 seconds) and the close (last 10 seconds).

**The spine of v3 (say it in one breath):** *ARKA recovers revenue you're already losing to denials, passes every regulation by design, and never touches the doctor's workflow.* Every beat below serves one of those three claims, in that order of emphasis.

---

## 🔴 READ THIS BEFORE YOU EDIT OR RECORD

**Two kinds of numbers appear in this script. Keep them in their lanes — investors and CFOs both check.**

1. **Measured product metrics** (your validation dashboard). These must match what's actually rendered. As of this version, that is: **three-class accuracy 74% on the synthetic ACR-aligned validation cohort; real-world AUC pending pilot data.** Do **not** inflate these. The honesty *is* the credibility moat — see Beat 7.

2. **Modeled revenue figures** (the ROI model in `ARKA_REVENUE_FIRST_UNICORN.md`, Appendix A/B). These are *sourced, conservative ranges* — CAQH, KFF, MGMA, AMA, ACR — not measured outcomes. Every time one appears on screen, it carries a small **"Modeled estimate"** footnote, and the voiceover says **"modeled"** or **"conservative."** This keeps the dollar claims legally clean for a Non-Device CDS product. Never present a modeled figure as a measured result, and never invent a number that isn't in Appendix A.

| Claim on screen | What it is | Required treatment |
|---|---|---|
| "~$3.5M recovered/yr" | Modeled (120k-study mid-sized system) | Footnote "Modeled estimate"; say "modeled, conservative" |
| "20–40% denied · ~86% avoidable" | Sourced ranges (AHA/Premier; Change Healthcare) | Fine to state plainly; they're cited industry figures |
| "74% three-class accuracy" | Measured (synthetic cohort) | Must match dashboard; pair with "real-world AUC pending" |
| "<800ms," "35–40% auto-clear" | Product/modeled | Plain is fine; these trace to the engine + UHC program data |

Pick the long game. A manufactured AUC ends the meeting; a modeled ROI with an honest footnote *wins* it.

---

## How to read this script

Every beat has three blocks. Read them in this order while recording:

🎬 **DO** — What happens on screen. **The product-interaction DO steps (Beats 4 and 6) are unchanged from v2 — record them exactly as you already planned.** Only title/text cards carry new copy.
🎤 **SAY** — Your exact voiceover lines. Block-quoted; record audio separately or live with the screen.
🎯 **MOMENT** — The single editing cue or visual beat that has to land. Nail this one thing and the beat works.

---

## ⏱ Pre-recording checklist (10 min before take 1)

Do all of these in order. Skipping #1 gives you a dead cold-start in the first card and ruins take 1.

- [ ] **Warm the ML service.** From any terminal: `curl -s https://arka-ml-service.onrender.com/health > /dev/null`. Wait 30 seconds. Repeat once.
- [ ] **Warm the CDS Hooks endpoint.** Fire one POST against `/api/cds-services/arka-clin-appropriateness` (any fixture payload). Caches the cold serverless function on Vercel.
- [ ] **Open all browser tabs in advance, in this exact order:**
  1. `https://www.getarka.health/` (cold open lands here)
  2. `https://www.getarka.health/clin` (Demo Part 1)
  3. `https://www.getarka.health/cds-hooks-demo` (Demo Part 2 — preloaded to LBP-1 scenario)
  4. `https://www.getarka.health/cds-hooks-demo/validation` (Receipts beat)
- [ ] **Set Do Not Disturb.** System sound OFF. Slack quit. All notifications silenced. No unread badges in the tab bar.
- [ ] **Enable cursor highlight.** Mouseposé, Cursor Highlighter, or Loom's cursor focus. Investors' eyes follow your clicks.
- [ ] **Mic check.** Wired earbuds with mic. Record 10 seconds, listen back. No hiss, no fan, no echo. Record in a closet with clothes if your room rings.
- [ ] **Test the loud beats.** Practice "**You did the scan. You didn't get paid for it.**", "**One click.**", and "**three and a half million dollars**" once each. These are your three voice-impact moments. Land them.

---

# THE 2:55 SCRIPT

---

## ▸ Beat 1 — Cold open: the money hook (0:00 – 0:10)

🎬 **DO**
- Open on full-black frame for 1 second.
- White serif text fades in, dead-center. Two lines, 60pt, then a smaller third line:
  > **`You did the scan.`**
  > **`You didn't get paid for it.`**
  >
  > `20–40% of imaging orders get denied. ~86% of those denials were avoidable.`
- Sustain ~7 seconds.
- Subtle low cinematic synth pad under the text (royalty-free; cap at −18 LUFS so VO sits on top).

🎤 **SAY**
> "You did the scan. The patient needed it. And you're not getting paid for it — because one in four imaging orders gets its authorization denied, and around eighty-six percent of those denials were avoidable. The work was right. The paperwork wasn't. That's millions in earned revenue your hospital writes off every single year."

🎯 **MOMENT** — Pattern interrupt in the first three seconds. The cadence on "You did the scan. / You didn't get paid for it." — full stop between the two lines. That stop is the hook. Everything else rides on it.

---

## ▸ Beat 2 — Why the money leaks (0:10 – 0:24)

🎬 **DO**
- Three quick cuts, ~4 seconds each. Lightly desaturated:
  1. A denial letter / EOB with a generic "Prior authorization not on file" line (your own UI mock — NOT a real payer document).
  2. A prior-auth nurse on hold (royalty-free stock — Unsplash or Pexels).
  3. A static appropriateness-criteria PDF, faded slightly.
- Music holds, no swell.

🎤 **SAY**
> "Here's the loop every imaging team knows. The scan gets done. Six weeks later the denial shows up over one line of documentation nobody asked for. And roughly half of denied claims are never even reworked — the appeal costs more staff time than the claim is worth. So the hospital eats the revenue, and a nurse who should be with patients is stuck on a payer hold line. The fix has to happen where the order is placed — not in the billing office six weeks later."

🎯 **MOMENT** — The list rhythm: scan done · denial lands · never reworked. Three beats, even tempo, then the "fix has to happen at the order" line pulls down half a tone. That sentence is the thesis.

---

## ▸ Beat 3 — Introduce ARKA (0:24 – 0:34)

🎬 **DO**
- Music drops to a single sustained note.
- ARKA wordmark fades in, dead-center on black, holds 1 beat.
- Wordmark dissolves into a live load of `https://www.getarka.health/` — your real production site. Cursor already in motion toward the **ARKA-CLIN** nav link.
- Cursor lands on the link mid-VO.

🎤 **SAY**
> "ARKA fixes it at the source. One decision engine that runs on both sides of the prior-auth wall — the doctor's and the payer's — documents the medical necessity the instant the order is placed, and does it without a single extra click. No FDA device clearance. No workflow change. Both surfaces live and shipping today. Watch."

🎯 **MOMENT** — "Watch." is your transition word. It's the contract with the viewer: I'm about to show you. Land it with conviction, then click immediately.

---

## ▸ Beat 4 — Demo Part 1: ARKA-CLIN standalone (0:34 – 1:14)

🎬 **DO** *(unchanged from v2 — record exactly as planned)*
- `/clin` loads. Skip the scenario picker; fly directly into the form.
- Form fill, top-to-bottom, fast (target: 18 seconds total typing):
  - Age: `52`
  - Sex: `Male`
  - Chief complaint: `Headache`
  - Duration: `3 days`
  - Clinical history: `Sudden onset, worst headache of life`
  - Red flags: ✅ `Neurological deficit` · ✅ `Age > 50 with new symptoms`
  - Modality: `CT` → Body part: `Head` → Urgency: `STAT`
- Hover the **Evaluate** button for one full beat.
- Click.

🎤 **SAY** (over the form fill)
> "A 52-year-old man. New-onset headache. Worst of his life. Focal neurological deficits."

🎤 **SAY** (the instant the click lands)
> "One click."

🎬 **DO** *(unchanged)*
- Pause two full seconds on the results panel. Do not move the cursor. Let the appropriateness score, the SHAP factor breakdown, and the citation links land visually.

🎤 **SAY**
> "An appropriateness score in under eight hundred milliseconds — anchored in ACR Appropriateness Criteria, every factor shown with its clinical rationale and a link to the published evidence. But here's the part the CFO cares about: ARKA inverts that score into denial risk and writes the medical-necessity documentation the payer will demand — before the order is even signed. The claim goes out clean the first time. The clinician can override anything — ARKA never blocks. Total time added to the order: under ten seconds."

🎯 **MOMENT** — "One click." is the punctuation of this beat. Two-second silent hold on the rendered card afterward. Resist the urge to talk over the reveal.

---

## ▸ Beat 5 — The pivot: where the revenue actually lives (1:14 – 1:24)

🎬 **DO** *(structure unchanged from v2)*
- ARKA results panel briefly washes to white.
- Cut to a clean transition card on black:
  > *A web app is nice.*
  > *But the money is recovered inside Epic.*
- Hold for 4 seconds.

🎤 **SAY**
> "A web app is nice. But clinicians won't open another tab, and denials don't get prevented on our website. So ARKA lives where they already work — inside the EHR — using the open standard Epic, Cerner, and Athena already speak: CDS Hooks. Watch the same engine fire inside a simulated Epic chart, and watch the dollars show up."

🎯 **MOMENT** — This is the "wait, there's more" beat that turns a product demo into a venture-scale pitch. The transition card is non-negotiable; do not skip it.

---

## ▸ Beat 6 — Demo Part 2: CDS Hooks live, with the ROI (1:24 – 2:12)

🎬 **DO** *(unchanged from v2 — record exactly as planned)*
- `/cds-hooks-demo` loads. EpicSim chart panel left (60%), ARKA sidebar right (40%), live JSON details collapsed under the demo. Already on the **LBP-1** scenario (do NOT show the scenario picker — pre-position).
- Cursor moves to the draft order field in the EpicSim chart. The MRI Lumbar Spine order is already populated.
- ARKA's card appears in the sidebar within one beat of the cursor entering the chart.

🎤 **SAY** (over the load)
> "Daniel Adams, 49, chronic low back pain, no red flags, three weeks of symptoms. His doctor is about to order an MRI of the lumbar spine — exactly the order a payer denies."

🎬 **DO** *(unchanged)*
- Pause one full second on the rendered card. Let the viewer see: source label `ARKA-CLIN (Guideline-anchored CDS)`, the ACR citation block above the ARKA risk score, the SHAP rows with rationale text and citation links.

🎤 **SAY**
> "ARKA fires the moment the order is selected. No pop-up. No interruption. The primary basis comes first — the ACR guideline against MRI for non-radicular low back pain under six weeks — with a link to the source. Below it, ARKA's patient-specific refinement, every factor with its own rationale and citation. This is what stops a denial before it's ever issued."

🎬 **DO** *(unchanged)*
- Cursor expands the collapsible "View raw CDS Hooks JSON" panel below the demo for 2 seconds. Show the live `POST /api/cds-services/arka-clin-appropriateness` request and the JSON response with `medicalBasis` highlighted.
- Collapse the panel.

🎤 **SAY**
> "And this isn't a mock. Every card is a real HTTP call to a real production API, using the exact CDS Hooks and Da Vinci protocols Epic, Cerner, and Athena already ship — the same FHIR prior-auth rail CMS mandates by January 2027. ARKA ships it today. From the EHR's perspective, ARKA is indistinguishable from a vendor that's been doing this for ten years."

🎬 **DO** *(unchanged)*
- Cursor clicks **"Review alternative imaging consistent with ACR §5"**. The ReviewAlternativePanel slides open with plain lumbar X-ray + 4-week conservative therapy pre-filled.
- Cursor clicks **"Open in chart to substitute"**. The ROI counter animates from `$0` to `$1,180 potentially avoided`.

🎤 **SAY**
> "When the clinician chooses the guideline-consistent alternative — eleven hundred and eighty dollars avoided on one order. Now scale it. Thirty-five to forty percent of orders auto-clear and never hit a queue. Across one mid-sized system running a hundred and twenty thousand advanced studies a year, the modeled, conservative recovery is about three and a half million dollars — revenue you already earned — plus roughly another half a million in faster throughput on your highest-margin line. That's recovered revenue with a software invoice attached."

🎯 **MOMENT** — The card-appearance beat (right after "his doctor is about to order an MRI…") is the pitch's payoff frame — the screenshot every investor remembers. Hold it. Then "three and a half million dollars" is your second voice-impact moment: slow down, let the ROI counter and the number land together. On-screen, drop a small **"Modeled estimate"** footnote under the dollar figures.

---

## ▸ Beat 7 — The receipts: regulation is the moat (2:12 – 2:36)

🎬 **DO** *(unchanged from v2)*
- Quick cut to `/cds-hooks-demo/validation`. Hold 2 seconds on the rendered metrics.
- Cut to a clean text card on black with four checkmarks:
  > ✅ **Criterion 1 — Data Input:** Structured FHIR only. No image pixels.
  > ✅ **Criterion 2 — Medical Information:** Every card cites a published guideline.
  > ✅ **Criterion 3 — HCP Recommendations:** Non-blocking, supportive language.
  > ✅ **Criterion 4 — Independent Review:** Every ML feature paired with rationale + citation.
  >
  > **FDA Non-Device CDS · §520(o)(1)(E) · no 510(k)**
- Music swells gently under this card.

🎤 **SAY**
> "Now the part that makes this fundable. Competitors that analyze the image are Class II medical devices — a twelve-to-twenty-four-month, quarter-million-to-two-million-dollar 510(k) per indication. ARKA never takes that path. We don't read pixels; we evaluate whether to order the study. By design, ARKA meets all four criteria for Non-Device Clinical Decision Support under section 520(o)(1)(E) — no 510(k), ever. HIPAA stays clean because no raw patient record ever moves — only encrypted model updates. And CMS-0057-F isn't a burden for us; it's the tailwind closing the deal. On the measured side, we're honest: three-class accuracy is seventy-four percent on our synthetic ACR-aligned cohort, and real-world AUC is pending pilot data — we'll have it before we sign a paid contract."

🎯 **MOMENT** — Two punches land here: "no 510(k), ever" (the cost competitors eat and you don't) and the honesty about pending AUC. Most digital-health pitches manufacture that number. You don't. The discipline of staying Non-Device *is* the moat — say it like you mean it.

---

## ▸ Beat 8 — The platform: imaging is just the wedge (2:36 – 2:50)

🎬 **DO**
- Clean text card on black (or a single static product-family graphic — no live navigation needed). Four rows fade in on the beat:
  > **ARKA-CLIN** — provider-side appropriateness + denial-risk engine *(what you just saw)*
  > **ARKA-INS** — the same engine on the payer's side: CMS-0057-F Da Vinci PAS, shipping today
  > **ARKA-ED** — trains residents to order appropriately, filling the gap left by the repealed PAMA AUC mandate
  > **ARKA RURAL** — resource-aware decision support for low-capacity and rural sites
- Hold ~5 seconds.

🎤 **SAY**
> "And imaging is only the wedge. ARKA-CLIN is one of four surfaces on the same engine — ARKA-INS runs it on the payer's side, ARKA-ED trains the next generation of ordering physicians, and ARKA RURAL extends it to low-resource sites. At thirty to fifty cents per member per month, that's a modeled two-point-three-times first-year return — and the same engine reaches into the ten-billion-dollar appropriateness layer of American medicine."

🎯 **MOMENT** — Keep this fast and flat — it's the "this is a platform, not a feature" beat. Don't oversell; the four-row card does the work. The phrase "ten-billion-dollar appropriateness layer" is the investor's takeaway line.

---

## ▸ Beat 9 — Close (2:50 – 3:00)

🎬 **DO**
- Cut to a black frame.
- White text appears, top-to-bottom, line by line on the beat:
  > *You did the scan.*
  > *Now get paid for it.*
  > *Every recommendation receipted. No 510(k). No new screen.*
- Below the lines, the ARKA wordmark fades in.
- Under the wordmark, the tagline: ***remARKAbly precise.***
- Music holds the sustained note, then fades.

🎤 **SAY**
> "ARKA recovers the revenue you're already losing to denials, passes every regulation by design, and never touches the doctor's workflow. That's ARKA. Let's make imaging remarkably precise — and remarkably profitable."

🎯 **MOMENT** — Last two words are "remarkably profitable." Land them. Hold the frame for 1.5 seconds of silence before the cut to black.

---

## ▸ Beat 10 — End card with CTA (3:00 – 3:10)

🎬 **DO**
- Final black frame with three lines, centered:
  > **arrikanna2447@gmail.com**
  > **getarka.health/cds-hooks-demo**
  > **github.com/ArKa3003/arkahealth/releases/tag/v1.0.0-cds-hooks**
- Hold 8 seconds. No voiceover — let viewers screenshot.

🎯 **MOMENT** — Three lines, no more. Resist adding LinkedIn, Twitter, Calendly. One CTA (the demo URL) is the only thing they need.

---

# 🎬 Cheat sheet — just the spoken lines (memorize these)

Read top to bottom; the rhythm tells you where the cuts go.

> "You did the scan. The patient needed it. And you're not getting paid for it — because one in four imaging orders gets its authorization denied, and around eighty-six percent of those denials were avoidable. The work was right. The paperwork wasn't. That's millions in earned revenue your hospital writes off every single year."

> "Here's the loop every imaging team knows. The scan gets done. Six weeks later the denial shows up over one line of documentation nobody asked for. And roughly half of denied claims are never even reworked — the appeal costs more staff time than the claim is worth. So the hospital eats the revenue, and a nurse who should be with patients is stuck on a payer hold line. The fix has to happen where the order is placed — not in the billing office six weeks later."

> "ARKA fixes it at the source. One decision engine that runs on both sides of the prior-auth wall — the doctor's and the payer's — documents the medical necessity the instant the order is placed, and does it without a single extra click. No FDA device clearance. No workflow change. Both surfaces live and shipping today. Watch."

> "A 52-year-old man. New-onset headache. Worst of his life. Focal neurological deficits."

> "One click."

> "An appropriateness score in under eight hundred milliseconds — anchored in ACR Appropriateness Criteria, every factor shown with its clinical rationale and a link to the published evidence. But here's the part the CFO cares about: ARKA inverts that score into denial risk and writes the medical-necessity documentation the payer will demand — before the order is even signed. The claim goes out clean the first time. The clinician can override anything — ARKA never blocks. Total time added to the order: under ten seconds."

> "A web app is nice. But clinicians won't open another tab, and denials don't get prevented on our website. So ARKA lives where they already work — inside the EHR — using the open standard Epic, Cerner, and Athena already speak: CDS Hooks. Watch the same engine fire inside a simulated Epic chart, and watch the dollars show up."

> "Daniel Adams, 49, chronic low back pain, no red flags, three weeks of symptoms. His doctor is about to order an MRI of the lumbar spine — exactly the order a payer denies."

> "ARKA fires the moment the order is selected. No pop-up. No interruption. The primary basis comes first — the ACR guideline against MRI for non-radicular low back pain under six weeks — with a link to the source. Below it, ARKA's patient-specific refinement, every factor with its own rationale and citation. This is what stops a denial before it's ever issued."

> "And this isn't a mock. Every card is a real HTTP call to a real production API, using the exact CDS Hooks and Da Vinci protocols Epic, Cerner, and Athena already ship — the same FHIR prior-auth rail CMS mandates by January 2027. ARKA ships it today. From the EHR's perspective, ARKA is indistinguishable from a vendor that's been doing this for ten years."

> "When the clinician chooses the guideline-consistent alternative — eleven hundred and eighty dollars avoided on one order. Now scale it. Thirty-five to forty percent of orders auto-clear and never hit a queue. Across one mid-sized system running a hundred and twenty thousand advanced studies a year, the modeled, conservative recovery is about three and a half million dollars — revenue you already earned — plus roughly another half a million in faster throughput on your highest-margin line. That's recovered revenue with a software invoice attached."

> "Now the part that makes this fundable. Competitors that analyze the image are Class II medical devices — a twelve-to-twenty-four-month, quarter-million-to-two-million-dollar 510(k) per indication. ARKA never takes that path. We don't read pixels; we evaluate whether to order the study. By design, ARKA meets all four criteria for Non-Device Clinical Decision Support under section 520(o)(1)(E) — no 510(k), ever. HIPAA stays clean because no raw patient record ever moves — only encrypted model updates. And CMS-0057-F isn't a burden for us; it's the tailwind closing the deal. On the measured side, we're honest: three-class accuracy is seventy-four percent on our synthetic ACR-aligned cohort, and real-world AUC is pending pilot data — we'll have it before we sign a paid contract."

> "And imaging is only the wedge. ARKA-CLIN is one of four surfaces on the same engine — ARKA-INS runs it on the payer's side, ARKA-ED trains the next generation of ordering physicians, and ARKA RURAL extends it to low-resource sites. At thirty to fifty cents per member per month, that's a modeled two-point-three-times first-year return — and the same engine reaches into the ten-billion-dollar appropriateness layer of American medicine."

> "ARKA recovers the revenue you're already losing to denials, passes every regulation by design, and never touches the doctor's workflow. That's ARKA. Let's make imaging remarkably precise — and remarkably profitable."

**Total VO word count:** ~595 words. At ~165 words/minute conversational pace, that's ~3:36 of raw speech — but ~40 seconds of that overlaps silent product holds and card reveals, landing the cut at ~2:55 of screen time. If you run long, the first trims are the second halves of Beats 2 and 7 (see teaser table).

---

# 📱 90-second teaser cut (for LinkedIn, cold email, Twitter)

Use when you don't have permission to ask for three minutes. Same script, surgically trimmed. Identical sound design and pacing.

| Source beat | Treatment in teaser cut |
|---|---|
| Beat 1 — Cold open (0:00–0:10) | **Keep verbatim.** 10 seconds. The money hook is the whole reason to watch. |
| Beat 2 — Why money leaks (0:10–0:24) | Cut to 5 seconds — one sentence: *"Roughly half of denied imaging claims are never reworked — that's earned revenue your hospital writes off."* Single text card, no montage. |
| Beat 3 — ARKA intro (0:24–0:34) | Compress to 8 seconds: keep "runs on both sides of the prior-auth wall… no workflow change… watch." |
| Beat 4 — ARKA-CLIN demo (0:34–1:14) | Compress to 18 seconds: speed-ramp the form fill 2x, full speed on the click and reveal. Cut the "Total time added" line. |
| Beat 5 — Pivot (1:14–1:24) | **Keep verbatim.** 8 seconds. |
| Beat 6 — CDS Hooks demo (1:24–2:12) | Compress to 22 seconds. Cut the JSON panel callout. Keep the sidebar reveal, the ROI counter, "$1,180 avoided," and the "three and a half million dollars" scale line. |
| Beat 7 — Receipts (2:12–2:36) | Compress to one text card, 4 seconds: **`Non-Device CDS · No 510(k) · §520(o)(1)(E) · 74% three-class accuracy`** |
| Beat 8 — Platform (2:36–2:50) | Compress to one 3-second card: the four phase names only. No VO. |
| Beat 9 — Close (2:50–3:00) | **Keep verbatim.** 8 seconds. |
| Beat 10 — End card (3:00–3:10) | Compress to 3 seconds. Only the URL: **`getarka.health/cds-hooks-demo`** |

**Total: ~1:20.** Add a "Watch the full 2:55 demo →" lower-third in the final two seconds linking to the long cut.

---

# 📐 Production specs

1. **Record each beat as a separate clip, not the whole thing in one take.** Cold open, each demo segment, pivot, receipts, platform card, close — separate clips, separate audio takes. This is how Dropbox, Stripe, and Linear did it. It removes performance pressure and lets pacing be exact.
2. **Cursor highlight is mandatory.** Mouseposé ($15) or Loom's cursor focus. Without it, eyes drift; with it, every click lands.
3. **Two-second silent holds after card reveals are non-negotiable.** Beat 4 after "One click." Beat 6 after the card appears and again on the ROI counter. These "let it breathe" frames are the difference between "demo" and "premium product."
4. **The number lands on screen and in voice at the same instant.** When you say "three and a half million dollars," the modeled-recovery figure must be on screen, with its "Modeled estimate" footnote. Hard ROI shown *and* spoken is what converts a profit-focused viewer (research: CFOs now want quantified return inside ~18 months — give them the number, not the adjective).
5. **Audio.** Wired earbuds with mic in a closet with clothes. Single-band compressor, gentle EQ roll-off below 100 Hz. Loudness −18 LUFS on voice, −24 LUFS on music bed.
6. **Captions are mandatory.** 80%+ of LinkedIn/Twitter views are muted. Burn-in white captions, sans-serif, bottom third, 60% black shadow box. Every word — especially the dollar figures.
7. **Thumbnail.** One frame: the ARKA sidebar card overlaid with **`$3.5M recovered. Zero new clicks.`** Plain black background. **You don't appear in the thumbnail — the product and the number do.**
8. **Three exports:**
   - `arka-pitch-3min.mp4` (1080p, H.264, 10 Mbps) — long cut.
   - `arka-pitch-90s.mp4` (1080p) — teaser.
   - `arka-pitch-15s-square.mp4` (1080×1080) — cold-open money card + the CDS Hooks sidebar reveal + the close card. For Instagram, TikTok, "what is this?" cold replies.

---

# 🔥 What changed from v2 (and why)

| Change | Reason |
|---|---|
| **Reframed the entire spine to revenue-first:** denial recovery → regulatory pass-through → zero workflow change | The audience priority flipped to profit-focused CFOs/investors. Research is blunt: CFOs lead with hard ROI and are most motivated by denial recovery. Lead with their money, prove it with the demo. |
| Cold open: "$12B / 1 in 6 unnecessary" → **"You did the scan. You didn't get paid for it."** + denial stats | A money-first, pattern-interrupt hook that names the buyer's pain in the first 3 seconds (the window where 63% of high-CTR videos hook). The waste framing was abstract; unpaid revenue is visceral. |
| Beat 2 retargeted from "CDS is a pop-up" → **"where the money leaks"** (denials, never-reworked claims, nurse hold time) | Keeps the alert-fatigue point but anchors it to dollars and staff hours a CFO already tracks. |
| Beat 3 now leads with **"both sides of the prior-auth wall," "no FDA device clearance," "no workflow change"** | Front-loads the three pillars before the demo so every click is read through the revenue/regulatory lens. |
| Beat 4 VO adds **score → denial-risk inversion, clean-claim documentation, <800ms** | Same on-screen action; the voiceover now explains *why the click makes money*. |
| Beat 6 adds the **scale math: $1,180 → ~$3.5M/yr modeled + ~$0.5M throughput + 35–40% auto-clear + CMS-0057-F Jan 2027** | The single ROI moment. One avoided order is a feature; $3.5M recovered is a business. Carries the "Modeled estimate" footnote. |
| Beat 7 reframed receipts as **"regulation is the moat"** — no 510(k) ($250K–$2M, 12–24 mo competitors eat), HIPAA-safe federated, CMS tailwind | Directly answers "is it resistant to regulatory burden?" — yes, by design. The honesty about 74% / pending AUC stays exactly as in v2. |
| **New Beat 8 — the four phases** (ARKA-CLIN / INS / ED / RURAL) + 2.3× ROI + $10B appropriateness layer | Fulfills the brief to briefly mention the other phases and reframes ARKA as a platform, not a feature. Kept to ~14s so the cut stays compact. |
| Close: "remarkably precise" → **"remarkably precise — and remarkably profitable"** | Ends on the profit note the audience came for, without abandoning the brand line. |
| **Every product-interaction DO step (Beats 4 & 6) is byte-for-byte unchanged from v2** | You still have to show how the tool works. Only title/text cards and voiceover changed. |
| Numbers-honesty banner kept, expanded to a **two-lane rule** (measured vs. modeled) | Lets the script carry aggressive revenue numbers *and* stay legally clean for Non-Device CDS — every dollar figure is a sourced, footnoted, modeled estimate. |

---

# 🎯 The one thing this script can't substitute for

This video buys you the meeting. What converts it is the receipts: the validation dashboard at the numbers you're claiming, a real CDS Hooks discovery endpoint at `getarka.health/.well-known/cds-services` an Epic integration engineer can hit, the written regulatory rationale memo, the line-by-line ROI model in `ARKA_REVENUE_FIRST_UNICORN.md` (Appendix B), and ideally one named pilot site or LOI. You have the first four. Get the fifth — and the modeled $3.5M becomes a *measured* number you can put on screen in v4.

**Optional appendix: a personal 45-second founder cut.** Record separately as an optional follow-up link: you, on camera, in plain language, on why you started ARKA. YC's data shows this is the single most predictive element of seed-stage conversion, and a slick product video can never substitute for it. Don't put it in the main video; send it as a "PS — here's why I'm building this" link only to investors who reply.

---

*All dollar and percentage figures are modeled, sourced ranges drawn from `ARKA_REVENUE_FIRST_UNICORN.md` Appendix A (CAQH, KFF, MGMA, AMA, ACR, CMS) — decision-support economics, not a guarantee of outcomes. ARKA is an FDA Non-Device Clinical Decision Support tool under §520(o)(1)(E) of the FD&C Act; it reasons over structured clinical data and published evidence, does not analyze medical images, and the ordering clinician retains the final decision. End of script — total length: ~2:55 of recorded content + 10-second end card, under the 3:05 hard cap.*
