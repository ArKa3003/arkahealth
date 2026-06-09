# ARKA-INS — Administrative-Support Memo (§520(o)(1)(A))

> **DRAFT.** Supports Question 2. Keep to 1–2 pages.

---

## Position
ARKA-INS performs administrative-support functions of a health care facility and is excluded from the
definition of a device under **FD&C Act §520(o)(1)(A)**. Paragraph (A) covers software for the
administrative support of a health care facility — including processing/maintenance of financial
records and claims/billing information, appointment schedules, business analytics, **determination
of health-benefit eligibility**, and **analysis of historical claims data to predict future
utilization or cost-effectiveness**. ARKA-INS functions map directly onto this language.

## Feature-by-feature mapping

| ARKA-INS feature | Statutory (A) hook |
|---|---|
| Coverage / eligibility cards | "determination of health-benefit eligibility" |
| Gold-card auto-approval scoring (claims-history based) | "analysis of historical claims data to predict future utilization or cost-effectiveness" |
| Out-of-pocket estimate, Good Faith Estimate, shoppable-site comparison | "processing and maintenance of financial records"; price transparency |
| Prior-authorization documentation (Da Vinci CRD/DTR/PAS) | claims/administrative workflow; documentation support (FDA has signaled documentation tools are administrative, not CDS) |
| Appointment-booking / site optimization | "appointment schedules"; practice management |

## On the "critical" / "override required" card language
Where INS cards use payer-driven framing (e.g., "denial risk — signature requires override or DTR
completion"), this reflects **Da Vinci CRD payer-adjudication semantics** — i.e., administrative
gating of a claim — not clinical coercion of a diagnosis or treatment decision. Because these are
administrative-support functions under (A), they are not assessed against the CDS Criterion 3
non-directive test. (ARKA-CLIN, the CDS function, is separately non-blocking.)

## Requested concurrence
That FDA agrees ARKA-INS's benefit-eligibility and claims-based functions are administrative-support
functions under §520(o)(1)(A), outside FDA device authority.

---

### Reviewer notes
- If any feature blends clinical recommendation with administrative output, flag it — it may need to
  move under ARKA-CLIN's CDS analysis or be redesigned. Keep INS strictly administrative/financial.
