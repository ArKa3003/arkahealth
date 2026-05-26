# ARKA Decision Log — PHI Redaction Contract
**Version:** 1.0
**Scope:** lib/cds-platform/audit/decision-log.ts and any downstream log consumer

## What the decision log CAPTURES
- hookInstance (UUID; not PHI)
- hook type (order-select / order-sign / appointment-book)
- ISO timestamp
- Redacted scenario fingerprint:
    - scenarioHash (SHA-256 of canonical JSON of non-PHI fields)
    - ageBucket (e.g., "40-64" — never exact age or birthDate)
    - sex (M/F/U)
    - indicationICD10 (e.g., "M54.5")
    - modalityCPT (e.g., "72148")
    - urgency (routine/urgent/emergent)
- Rule findings (ruleId, citation id, tier)
- ML invocation flag, score, top features
- Cards shipped (count + source labels)
- FDA disclosure version
- Latency (ms)

## What the decision log NEVER captures (PHI redaction enforced at write time)
- patient.name
- patient.identifier (MRN, SSN, etc.)
- patient.birthDate (only ageBucket survives)
- patient.address
- patient.telecom (phone, email)
- Practitioner.name or any identifying fields
- Free-text notes from ServiceRequest, Condition, Observation
- Any raw FHIR resource body

## Hashing approach
SHA-256 over canonical JSON of the non-PHI fields, sorted by key. Hash is stable across invocations of the same scenario (useful for analytics) and neutral on privacy (irreversible).

## Retention
- Daily-rotated JSONL files at logs/decisions-YYYY-MM-DD.jsonl
- Default retention: 18 months
- Archival policy: cold-store retention beyond 18 months requires regulatory review

## Enforcement
- The `redact()` helper in lib/cds-platform/audit/decision-log.ts strips all PHI fields before write.
- Unit test at __tests__/regulatory/phi-redaction.test.ts asserts no PHI key appears in the serialized output for a representative scenario.

## Operator responsibilities
- Do NOT bypass `redact()` for debugging convenience.
- Do NOT add new fields to DecisionLogEntry without confirming they pass PHI review.
- Any change to this contract bumps the version number above and triggers a Phase 11 re-review.
