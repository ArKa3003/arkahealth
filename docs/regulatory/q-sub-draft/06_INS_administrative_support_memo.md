# ARKA-INS — Administrative-Support Memo (§520(o)(1)(A))

**ARKA Health, Inc. — Pre-Submission · Document 06 · Version 1.0 · June 9, 2026**

## 1. Position

ARKA-INS performs administrative-support functions of a health care facility and is presented for FDA's concurrence as software excluded from the device definition under **FD&C Act §520(o)(1)(A)**. Paragraph (A) covers software intended for the administrative support of a health care facility — including the processing and maintenance of financial records and claims or billing information, appointment schedules, business analytics, **determination of health-benefit eligibility**, and **analysis of historical claims data to predict future utilization or cost-effectiveness**. Each ARKA-INS function maps directly onto this statutory language.

## 2. Feature-by-feature mapping

| ARKA-INS function | Statutory (A) language engaged |
|---|---|
| Coverage / benefit-eligibility cards | "determination of health benefits eligibility" |
| Gold-card auto-approval scoring (based on historical claims) | "analysis of historical claims data to predict future utilization or cost-effectiveness" |
| Out-of-pocket estimates, Good Faith Estimates, shoppable-site comparison | "processing and maintenance of financial records"; price-transparency support |
| Prior-authorization documentation (HL7 Da Vinci CRD/DTR/PAS) | Claims and administrative workflow; documentation support for payer adjudication |
| Appointment-booking and site-of-service checks | "appointment schedules"; practice and business management |

## 3. On the "denial-risk" and "override required" card language

Certain ARKA-INS order-sign cards use urgent framing — for example, a denial-risk card stating that DTR completion or a documented override is needed for adjudication. This language implements **HL7 Da Vinci CRD payer-adjudication semantics**: it communicates the administrative status of a claim under the patient's benefit plan, not a clinical judgment about diagnosis or treatment. The gating is of the claim's documentation path, never of the clinical order itself, and it originates from payer coverage requirements rather than from ARKA's clinical logic. Because these are administrative-support functions under paragraph (A), they are presented under that exclusion rather than under the CDS criteria; ARKA-CLIN — the clinical decision support function — is separately non-blocking, as described in Documents 02 and 04.

## 4. Boundary discipline

ARKA maintains ARKA-INS as strictly administrative and financial. INS outputs do not modify, re-rank, or suppress ARKA-CLIN's guideline-anchored clinical recommendations, and the two card families are visually and semantically distinct. Should any future feature blend clinical recommendation with administrative output, ARKA's change-control procedure routes it through the clinical sign-off and regulatory review gates before release.

## 5. Requested concurrence

ARKA requests FDA's concurrence that the ARKA-INS benefit-eligibility and claims-based functions described above are administrative-support functions under §520(o)(1)(A), outside FDA device authority.
