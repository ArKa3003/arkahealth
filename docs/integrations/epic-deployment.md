# ARKA — Epic-Class EHR Deployment Guide

ARKA delivers imaging intelligence inside the EHR through two pillars that share the same AIIE engine:

1. **CDS Hooks services** — automated, zero-click cards at order entry (`order-select`, `order-sign`, `appointment-book`).
2. **SMART on FHIR embedded app** — an unobtrusive icon/rail at `/ehr/app` launched in the EHR sidebar via the EHR-launch flow.

Neither pillar persists PHI server-side. Tokens live only in encrypted httpOnly cookies; patient data is fetched client-side from the EHR's FHIR server and rendered in the browser.

---

## 1. CDS Hooks service registration

### Discovery endpoint

| Item | Value |
| --- | --- |
| Discovery URL | `GET https://{arka-host}/api/cds-services` |
| Well-known alias | `GET https://{arka-host}/.well-known/cds-services` (Vercel rewrite) |
| Spec version | CDS Hooks 2.0 |

### Services and hooks consumed

| Service id | Hook | Purpose |
| --- | --- | --- |
| `arka-clin-appropriateness` | `order-select` | AIIE appropriateness scoring on draft imaging orders |
| `arka-clin-appropriateness-sign` | `order-sign` | Final appropriateness check before signature |
| `arka-ins-coverage` | `order-select` | Coverage, prior-auth, and denial-risk signals |
| `arka-ins-final-check` | `order-sign` | Final payer check at signature |
| `arka-ins-appointment` | `appointment-book` | Scheduling-time coverage validation |

Each service advertises its `prefetch` templates in the discovery response. Configure the EHR's CDS client to satisfy prefetch where possible; ARKA degrades gracefully when prefetch is absent.

### Behavior contract

- Services **never return 5xx** into an ordering workflow. Invalid requests get HTTP 200 with empty `cards` and an OperationOutcome-style extension (route level), or 400 at the middleware edge for malformed JSON.
- Every card `detail` ends with the FDA Non-Device CDS disclosure required by ARKA compliance policy.
- p95 response time target: 800 ms.

### Request authentication (CDS Hooks security model)

The EHR signs every service call with a JWT in the `Authorization: Bearer` header. ARKA validates it at the middleware edge when enforcement is enabled:

| Env var | Meaning |
| --- | --- |
| `CDS_JWT_REQUIRED=1` | Enforce JWT validation on all CDS service POSTs. Unset for local demos/sandbox. |
| `CDS_JWT_ALLOWED_ISSUERS` | Comma-separated `iss` allowlist (the EHR's CDS client identity). |
| `CDS_JWT_ALLOWED_AUDIENCES` | Comma-separated `aud` allowlist. Defaults to `NEXT_PUBLIC_SITE_URL`; service-URL prefixes match. |
| `CDS_JWT_ALLOWED_JWKS` | Optional explicit `jku` allowlist. When unset, the `jku` must share the issuer's origin. |

Validation order: supported `alg` (ES384/RS384 preferred, ES256/RS256 accepted) → issuer allowlist → https `jku` allowlist → signature against the remote JWKS (fetched via `jku`, cached ~10 min in-process) → audience check. Failures return `401` with a FHIR OperationOutcome (`code: security`).

---

## 2. SMART on FHIR app registration

Register ARKA in the EHR's app management console (e.g. Epic App Orchard / Connection Hub) as a **public client** using **Authorization Code + PKCE (S256)**. No client secret is issued or stored.

| Registration field | Value |
| --- | --- |
| Launch type | EHR launch (embedded) |
| Launch URL | `https://{arka-host}/ehr/launch` |
| Redirect URI | `https://{arka-host}/ehr/callback` |
| Client type | Public (PKCE S256 required) |
| Scopes | `launch openid fhirUser patient/Patient.read patient/ServiceRequest.read patient/Condition.read patient/Observation.read patient/DiagnosticReport.read` |
| FHIR version | R4 |

### Launch sequence

1. EHR opens `GET /ehr/launch?iss={fhir-base}&launch={token}` in the sidebar frame.
2. ARKA fetches `{iss}/.well-known/smart-configuration`, generates PKCE (S256) + anti-CSRF state, seals them into a 5-minute encrypted cookie, and redirects to the EHR's authorize endpoint with `aud={iss}`.
3. The EHR redirects back to `/ehr/callback?code=...&state=...`; ARKA verifies state, exchanges the code (with `code_verifier`), and seals the token response into an encrypted httpOnly session cookie (JWE, A256GCM via `jose`). Refresh tokens are used transparently when granted.
4. `/ehr/app` renders the icon/rail. The browser fetches `Patient` and `ServiceRequest?status=draft,active` directly from `{iss}` with the access token obtained from the same-origin session endpoint.

### Required FHIR resources

| Resource | Use |
| --- | --- |
| `Patient` | Banner context (name, age, masked MRN) |
| `ServiceRequest` | Active/draft imaging orders — the rail's core list |
| `Condition` | Indication enrichment (optional) |
| `Observation` | Risk modifiers, e.g. eGFR (optional) |
| `DiagnosticReport` | Prior-imaging redundancy signals (optional) |

### Server environment

| Env var | Meaning |
| --- | --- |
| `EHR_SESSION_SECRET` | ≥32-char secret; SHA-256-derived AES key encrypts session cookies. Required in production. |
| `EHR_CLIENT_ID` | Client id issued at registration (default `arka-ehr-embedded`). |
| `NEXT_PUBLIC_EHR_DEMO=1` | Runs `/ehr/app` against `sandbox-fixtures/ehr/` — demoable without a live EHR. |

### Framing

`vercel.json` overrides the Content-Security-Policy for `/ehr/*` with `frame-ancestors` that includes EHR origins. Modern browsers honor `frame-ancestors` over the global `X-Frame-Options: SAMEORIGIN`. Add your EHR's web origin to the allowlist before go-live.

---

## 3. Icon-mode UX contract

ARKA never interrupts; it signals.

- Default state is a single **48px floating button** rendering the standard ARKA animated logo — same component, same animation timing as the rest of the platform.
- The rail expands **only** when:
  - (a) the clinician clicks (or keyboard-activates) the badge, or
  - (b) a draft order scores **≤3** on AIIE or carries an **EXPEDITE** signal (stat/asap/urgent priority).
- On (b), the container — never the logo — shows a **one-time pulse ring** and a count badge. No sound. No modal. Focus is never stolen; focus moves only on clinician-initiated expansion (and Escape returns it to the icon).
- The rail is sized for Epic sidebar dimensions (~340–420px wide), white background, no marketing chrome.
- Evidence links always open in a new tab; the rail never navigates the EHR frame.
- The footer always shows the quiet status row (`AIIE active · monitoring orders · v{MATRIX_VERSION}`) and the FDA Non-Device CDS disclaimer at 11px.

### No-PHI posture

- No patient data is written to ARKA servers or databases by the embedded app.
- OAuth tokens exist only inside AES-256-GCM-encrypted httpOnly cookies scoped to the ARKA origin.
- MRN is masked to its last 4 digits in the banner.
- FHIR responses are fetched and rendered entirely client-side.

---

## 4. Demo / sandbox

- Set `NEXT_PUBLIC_EHR_DEMO=1` and open `/ehr/app` — the rail runs against `sandbox-fixtures/ehr/` (one patient, three draft imaging orders including a low-score and a STAT order, so the signal path is demoable).
- `/ehr/sandbox` wraps the same rail in a simulated EHR chrome frame; the **Launch simulated EHR** button on `/docs/integrations` points there.
