# ARKA — Phase 10 Sandbox Evidence Video Script

**Target length: ~2:15** (sweet spot for an evidence/proof clip — long enough to prove it works, short enough that an investor or FDA reviewer watches the whole thing.)

**How to use:** Keep this open on a second screen. Read the **Say** lines as written. Do the **On screen** action first, then speak. Hold 2 seconds after each card appears. State metrics exactly as they render — never round up.

---

### 0:00 – 0:12 · Open in the sandbox
**On screen:** Sandbox open, CDS Services list showing all five ARKA services.
**Say:** "This is ARKA running live in the public CDS Hooks sandbox. These five services are registered straight from our discovery endpoint — arkahealth.vercel.app, slash well-known, slash cds-services."

### 0:12 – 0:35 · Fire the order
**On screen:** Select `arka-clin-appropriateness` → PAMA imaging tab → trigger order-select on the low-back-pain (LBP-1) scenario.
**Say:** "I'm placing a lumbar-spine MRI order for a low-back-pain patient. ARKA's order-select hook fires automatically — inside the existing workflow, with nothing extra for the clinician to click."

### 0:35 – 0:55 · The card *(hold 2 seconds before speaking)*
**On screen:** Let the card render. Don't move the mouse during the pause.
**Say:** "Here's the card. An appropriateness recommendation, with the clinical rationale and the citation links shown right inside it."

### 0:55 – 1:20 · Why it's not a black box
**On screen:** Slowly point at the factors / SHAP rows and a citation link.
**Say:** "Every factor behind that recommendation is listed, each with its own rationale and source. The clinician sees exactly why — and stays the decision-maker. That transparency is what keeps ARKA a Non-Device clinical decision support tool, not a regulated device."

### 1:20 – 1:40 · Order-sign evidence
**On screen:** Switch to the `/cds-hooks-demo` tab; show the order-sign card.
**Say:** "The sandbox doesn't expose an order-sign workflow for imaging, so here's the same engine firing on order-sign in our demo environment — the final check before the order is signed."

### 1:40 – 2:05 · The honest numbers
**On screen:** Switch to the `/cds-hooks-demo/validation` tab; show the dashboard.
**Say:** "And here are the receipts. Seventy-four percent three-class accuracy on our synthetic, ACR-aligned validation cohort. Real-world AUC is pending pilot data — we don't claim more than we've measured. The honesty is the point."

### 2:05 – 2:15 · Close
**On screen:** Rest on the validation dashboard or the card.
**Say:** "That's ARKA's CDS Hooks layer — live, transparent, with rationale and citations on every card."

---

### Need a 60-second cut?
Keep only: **0:00 open**, **0:12 fire the order**, **0:35 the card** (shortened to one line), and **1:40 the honest numbers**. Drop the why-it's-not-a-black-box and order-sign beats. That gives a tight ~60s proof clip for cold emails and LinkedIn.

**Reminders:** Do Not Disturb on · click-highlighting on · warm the servers first · 2 seconds of silence before your first word and after your last (clean trim points) · host the final video as **Unlisted**, not Private.
