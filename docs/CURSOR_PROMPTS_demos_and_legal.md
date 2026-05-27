# Cursor Prompts — ARKA Demo Clarity, CDS Hooks Discoverability, Privacy & Terms

This document contains **four copy-paste-ready prompts for Cursor**. Run them in order. Each prompt is self-contained, references real files in the repo, and ends with an acceptance checklist Cursor should verify before finishing.

---

## Background you should give Cursor first (optional system context)

> You are working in the `arkahealth` Next.js 15 (App Router) repo. The site uses Tailwind, Framer Motion, and shadcn-style UI. The current navigation lives in `components/navigation/Navbar.tsx`, the footer in `components/navigation/Footer.tsx`, and shared route constants in `lib/constants.ts`. Two demos already exist and are confusing to first-time viewers:
>
> 1. **`/clin`** — `app/clin/page.tsx` mounting `components/demos/clin/ClinDemoContent.tsx`. This is the **ARKA standalone web app** view of clinical decision support. A user picks (or types) a scenario, hits Evaluate, and sees ARKA's own results UI (appropriateness score, SHAP factors, alternatives, citations) via `lib/demos/clin/evaluate-imaging`.
> 2. **`/cds-hooks-demo`** — `app/cds-hooks-demo/page.tsx` mounting `components/cds-platform/demo/CdsDemoClient.tsx`. This is **ARKA running inside a simulated EHR (Epic/Cerner) via the HL7 CDS Hooks standard**. It shows a mock Epic chart on the left and ARKA's recommendation card on the right, makes real `POST` calls to `/api/cds-services/arka-clin-appropriateness`, and renders the raw JSON request/response.
>
> Both demos use the same underlying engine and overlapping scenarios (low back pain, headache, etc.), so beginners cannot tell them apart. The CDS Hooks demo is currently hidden as a small text link at the bottom of `components/navigation/Footer.tsx`. The site is being shown to non-technical shareholders.
>
> Do not delete either demo. Do not rename existing route paths. Preserve all existing FDA / CMS-0057-F compliance banners and existing tests. After each change, run `pnpm lint` and `pnpm test` if those scripts exist in `package.json`.

---

## Prompt 1 — Differentiate and cross-link the two demos

Paste this into Cursor:

> **Task: Make it visually and verbally obvious that `/clin` and `/cds-hooks-demo` are two different views of the same engine, and link them to each other.**
>
> Do all of the following:
>
> **A. Rename the user-facing labels (not the routes).**
> In `app/clin/page.tsx`:
> - Change the H1 from `"ARKA-CLIN: Clinical Decision Support"` to `"ARKA-CLIN — Standalone Clinical Decision Support (Web App View)"`.
> - Change the subtitle paragraph to: `"The ARKA web application. An ordering clinician opens ARKA directly, enters or selects a clinical scenario, and receives an evidence-based appropriateness score, SHAP-style factor breakdown, alternatives, and peer-reviewed citations from the ARKA Imaging Intelligence Engine (AIIE). This is what ARKA looks like when used as a standalone product."`
> - Inside the existing collapsible "About ARKA-CLIN" section in `app/clin/page.tsx`, add a fourth block (after "How it fits in the ecosystem") titled `"Standalone vs. EHR-embedded"` with body text: `"ARKA-CLIN can be used two ways. (1) As the standalone web app you are using right now. (2) Embedded directly inside an EHR (Epic, Cerner, Athena) via the HL7 CDS Hooks open standard, with no workflow change for the clinician. To see ARKA running inside a simulated Epic chart, open the CDS Hooks Live Demo."`. End the block with a Next.js `<Link>` to `routes.cdsHooksDemo` styled as a primary CTA button using the same Tailwind classes already used for the existing "Also explore" CTAs.
>
> In `app/cds-hooks-demo/page.tsx`:
> - Change the H1 from `"Live CDS Hooks Integration"` to `"CDS Hooks Live Demo — ARKA Inside an EHR (Epic / Cerner Simulation)"`.
> - Change the descriptive paragraph to: `"This is the same ARKA engine you saw in ARKA-CLIN, but rendered the way a clinician would actually see it: as a sidebar card inside their EHR while they draft an imaging order. The left panel is a mock Epic chart (EpicSim™). The right sidebar is ARKA's CDS Hooks card. The JSON panel below shows the live FHIR / CDS Hooks v1.0 traffic between the EHR and ARKA's service endpoint, demonstrating real interoperability under the HL7 CDS Hooks standard. Every recommendation card is anchored in a published guideline. Patient-specific ML refinement (XGBoost + SHAP) is shown as a transparent ancillary layer. Designed to meet the four criteria for Non-Device CDS under FD&C Act §520(o)(1)(E)."`.
> - Above the `<CdsDemoClient />` component, add a small inline callout box (use existing `arka-card` class and `border-arka-cyan/30`) that contains: `"Looking for the ARKA standalone web app view instead?"` followed by a `<Link href={routes.clin}>` reading `"Open ARKA-CLIN →"`.
>
> **B. Add a "Two views, one engine" comparison strip.**
> Create a new file `components/shared/demos/DemoViewSwitcher.tsx` that exports a server-component-friendly React component named `DemoViewSwitcher` taking a prop `current: 'standalone' | 'embedded'`. Render two side-by-side cards (stack on mobile) using existing Tailwind tokens:
> - Left card: title `"Standalone Web App"`, subtitle `"ARKA-CLIN"`, one-line description `"The ARKA product, used directly by a clinician in a browser."`, and a Link to `/clin`.
> - Right card: title `"Embedded in EHR via CDS Hooks"`, subtitle `"CDS Hooks Live Demo"`, one-line description `"The same engine, surfaced inside a simulated Epic chart via the HL7 CDS Hooks open standard."`, and a Link to `/cds-hooks-demo`.
> - Highlight whichever card matches the `current` prop with `ring-2 ring-arka-cyan` and an `aria-current="page"` attribute.
>
> Mount `<DemoViewSwitcher current="standalone" />` near the top of `app/clin/page.tsx` (immediately under the breadcrumb, above the H1) and `<DemoViewSwitcher current="embedded" />` near the top of `app/cds-hooks-demo/page.tsx` (above the H1).
>
> **C. Acceptance checklist Cursor must verify before declaring done:**
> 1. `pnpm lint` passes.
> 2. Both pages render without hydration errors (`pnpm dev` and visit `/clin` and `/cds-hooks-demo`).
> 3. From `/clin`, a user can reach `/cds-hooks-demo` in one click via the new switcher AND via the new CTA inside the "About ARKA-CLIN" expandable section.
> 4. From `/cds-hooks-demo`, a user can reach `/clin` in one click via the new switcher AND via the callout above the demo client.
> 5. No existing tests in `__tests__/` are broken. No existing route paths changed.
> 6. The two existing FDA / CMS-0057-F compliance banners on both pages are preserved exactly.

---

## Prompt 2 — Make the CDS Hooks demo a first-class, beginner-friendly entry point

Paste this into Cursor:

> **Task: The CDS Hooks Live Demo is currently only reachable via a small text link at the bottom of `components/navigation/Footer.tsx`. Promote it to a top-level surface so a non-technical shareholder lands on it in one click from anywhere on the site.**
>
> Do all of the following:
>
> **A. Add it to the primary site nav.**
> In `lib/constants.ts`:
> - Add a new entry to the `demoNavLinks` array (after `Rural Platform`):
>   ```ts
>   { href: routes.cdsHooksDemo, label: "CDS Hooks Demo", icon: "Network" },
>   ```
> - Add a matching entry to the `navLinks` array used by the footer.
>
> In `components/navigation/Navbar.tsx`:
> - Add `Network` (already imported from `lucide-react` at the top — confirm it is included) to the `iconMap` so the new nav entry renders the right icon.
> - Add `routes.cdsHooksDemo` to the `DEMO_PATHS` tuple and add `[routes.cdsHooksDemo]: "CDS Hooks Demo"` to the `pathToLabel` record so the in-demo breadcrumb header behaves correctly when a user is on the CDS Hooks demo page.
>
> **B. Add a high-visibility hero CTA on the landing page.**
> In `components/landing/Hero.tsx` (read the file first to match its existing button styling), add a secondary CTA button positioned next to (or directly under) the existing primary CTA. Label it `"See ARKA Live Inside an EHR (CDS Hooks Demo)"`. It should link to `/cds-hooks-demo`. Use the same Tailwind utility classes as the existing primary CTA but with a `variant`/color swap (e.g. `border-arka-cyan bg-transparent text-arka-cyan hover:bg-arka-cyan/10`) so it reads as a complementary action, not a duplicate.
>
> **C. Add a dedicated phase-style card.**
> In `lib/constants.ts`, add a fifth entry to the `phaseCards` array:
> ```ts
> {
>   id: "cds-hooks",
>   title: "CDS Hooks Live Demo",
>   description: "Watch ARKA run inside a simulated Epic chart via the HL7 CDS Hooks open standard — the same way it integrates into a real hospital EHR.",
>   href: routes.cdsHooksDemo,
>   icon: "Network",
> },
> ```
> Then in `components/landing/PhaseCards.tsx` (read first to match its icon mapping pattern), wire the `Network` lucide icon into its `iconMap`. Make this card visually distinct — e.g. add a small `"LIVE DEMO"` pill badge in the top-right corner of just this card so it stands out from the four product cards.
>
> **D. Keep the footer link but rename it for clarity.**
> In `components/navigation/Footer.tsx`, find the existing `<Link href="/cds-hooks-demo">` whose label is `"CDS Hooks Live Demo — Guideline-anchored"`. Rename the visible label to `"CDS Hooks Live Demo (EHR-embedded view)"` so it matches the new top-nav entry. Leave the `/cds-hooks-discovery` link alone (that is the discovery endpoint, a separate page).
>
> **E. Acceptance checklist Cursor must verify before declaring done:**
> 1. From the landing page, the CDS Hooks Live Demo is reachable in one click from: (a) the top navbar, (b) the hero CTA, (c) the phase cards section. On mobile, it must also appear in the mobile menu overlay rendered by `Navbar.tsx`.
> 2. The icon imports in `Navbar.tsx` and `PhaseCards.tsx` are not duplicated and TypeScript compiles cleanly.
> 3. The active-state underline on the navbar correctly highlights "CDS Hooks Demo" when the URL is `/cds-hooks-demo`.
> 4. `pnpm lint` and `pnpm typecheck` (or `tsc --noEmit`) pass.
> 5. Existing routes, copy, and FDA banners are unchanged.
> 6. No console hydration warnings.

---

## Prompt 3 — Write a real Privacy Policy (replace the placeholder)

Paste this into Cursor:

> **Task: Replace the placeholder content of `app/privacy/page.tsx` with a full, defensible Privacy Policy written in standard US legal style suitable for a digital health / clinical decision support startup. The policy must protect ARKA Health, Inc. while remaining honest about the demo / pre-clinical nature of the current website.**
>
> Requirements:
> - Use the same Next.js App Router structure already in `app/privacy/page.tsx`. Keep the `export default function PrivacyPage()` signature.
> - Wrap the content in a `<main>` element using the existing Tailwind tokens (`max-w-3xl mx-auto px-4 py-16`, `text-arka-text`, `text-arka-text-soft`).
> - Render headings (`h2`, `h3`) and body paragraphs with proper semantic HTML and Tailwind classes (`text-xl font-semibold mt-8 mb-3`, `text-base leading-relaxed mb-4`).
> - At the top, include a "Last updated" line populated from a `const LAST_UPDATED = "May 26, 2026"` constant.
> - The body must contain the following sections in this order, with the exact section headings shown, and the body text shown below verbatim (do not paraphrase — copy it as-is into the JSX):
>
> ---
>
> **1. Introduction.** ARKA Health, Inc. ("ARKA," "we," "us," or "our") operates the website located at arkahealth.com and related subdomains (the "Site") and provides clinical decision support software, demonstrations, and related materials (collectively, the "Services"). This Privacy Policy explains how we collect, use, disclose, and safeguard information when you visit the Site or interact with the Services. By accessing the Site or the Services, you acknowledge that you have read and understood this Privacy Policy. If you do not agree, you must not use the Site or the Services.
>
> **2. Scope and applicability.** This Privacy Policy applies to information collected through the Site and through any interactive demonstrations, including but not limited to ARKA-CLIN, ARKA-ED, ARKA-INS, the Rural Platform, and the CDS Hooks Live Demo. It does not apply to information processed on behalf of a healthcare provider, payer, or other covered entity under a separate Business Associate Agreement ("BAA"), Data Processing Agreement, or Master Services Agreement. Where ARKA acts as a Business Associate under the Health Insurance Portability and Accountability Act of 1996, as amended ("HIPAA"), the terms of the applicable BAA control over this Privacy Policy with respect to Protected Health Information ("PHI").
>
> **3. No PHI in the public Site or demos.** The public Site and all publicly accessible demonstrations are intended for informational and illustrative purposes only. You must not submit, upload, paste, or otherwise transmit any Protected Health Information, personally identifiable patient information, payer-confidential information, or any other regulated or sensitive third-party data into any input field, form, or demo on the Site. Any clinical scenarios, patient names, medical record numbers, or identifiers shown in demonstrations are synthetic, fictional, and constructed solely for illustration. ARKA disclaims any and all liability arising from a user's submission of PHI or other regulated information in violation of this Section 3.
>
> **4. Information we collect.** We may collect: (a) information you voluntarily provide, including your name, email address, employer, role, and the content of any message you submit through a contact form or email link; (b) technical information automatically collected when you visit the Site, including IP address, browser type, operating system, device identifiers, referring URL, pages viewed, time spent, and similar telemetry; (c) cookies, web beacons, local storage, and similar technologies as described in Section 8; and (d) information you choose to share when interacting with a demonstration, including any clinical scenario text you enter, which is processed transiently to render an evaluation and is not stored against your identity for downstream marketing purposes.
>
> **5. How we use information.** We use information to: (a) operate, maintain, secure, and improve the Site and the Services; (b) respond to inquiries and provide requested information; (c) generate aggregated, de-identified analytics about usage patterns; (d) detect, prevent, and respond to fraud, abuse, security incidents, or violations of our Terms of Service; (e) comply with applicable law, legal process, regulatory request, or court order; and (f) evaluate, develop, and improve ARKA's clinical decision support models, including the ARKA Imaging Intelligence Engine ("AIIE"), provided that any data used for model improvement is first de-identified in accordance with the HIPAA Safe Harbor method (45 C.F.R. § 164.514(b)(2)) or Expert Determination (45 C.F.R. § 164.514(b)(1)) where applicable.
>
> **6. Legal bases for processing (EEA / UK users).** Where the General Data Protection Regulation or the UK General Data Protection Regulation applies, we rely on the following legal bases: (a) your consent, which you may withdraw at any time; (b) the performance of a contract to which you are a party; (c) compliance with a legal obligation; and (d) our legitimate interests in operating, securing, and improving the Services, where those interests are not overridden by your rights and freedoms.
>
> **7. Sharing and disclosure.** We do not sell personal information. We may share information with: (a) service providers and subprocessors who perform functions on our behalf under written confidentiality and data protection obligations (e.g., cloud hosting, analytics, email delivery, error monitoring); (b) professional advisors, including legal counsel, auditors, and accountants; (c) acquirers or successors in connection with a merger, acquisition, financing, reorganization, sale of assets, or similar corporate transaction; (d) regulators, law enforcement, or other parties where required by applicable law or to protect the rights, property, or safety of ARKA, our users, or the public; and (e) any other party with your direction or consent.
>
> **8. Cookies and analytics.** We use cookies and similar technologies to operate the Site, remember preferences, measure usage, and support security. You can configure your browser to refuse cookies or alert you when cookies are being sent. Disabling cookies may degrade certain features. We may use first-party and third-party analytics services that themselves act as independent data controllers; their practices are governed by their own privacy policies.
>
> **9. Data retention.** We retain information for as long as reasonably necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law (including for tax, accounting, regulatory, dispute resolution, or contractual purposes). De-identified and aggregated information may be retained indefinitely.
>
> **10. Security.** We implement administrative, physical, and technical safeguards designed to protect information against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or unauthorized access. No method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee absolute security. You acknowledge that you provide information at your own risk.
>
> **11. International transfers.** Information collected through the Site may be processed in the United States and other jurisdictions whose data protection laws may differ from those of your country. By using the Site, you consent to such transfers. Where required by applicable law, we implement appropriate safeguards (e.g., Standard Contractual Clauses) for cross-border transfers.
>
> **12. Your rights.** Depending on your jurisdiction, you may have rights to access, correct, delete, port, restrict, or object to the processing of your personal information, and to lodge a complaint with a supervisory authority. To exercise any such right, contact us at privacy@getarka.health. We will respond within the timeframe required by applicable law. We may need to verify your identity before fulfilling a request.
>
> **13. Children's privacy.** The Site and the Services are not directed to children under the age of 13 (or under the age of 16 in jurisdictions where that higher threshold applies), and we do not knowingly collect personal information from children. If you believe a child has provided personal information to us, please contact us and we will take appropriate steps to delete it.
>
> **14. Third-party links and content.** The Site may contain links to third-party websites, services, or resources that are not operated by ARKA. ARKA is not responsible for the privacy practices or content of such third parties, and your interactions with them are governed by their own policies.
>
> **15. No medical advice; not a substitute for clinical judgment.** ARKA's demonstrations and content are provided for informational and evaluative purposes only and do not constitute medical advice, diagnosis, treatment, or a recommendation to use, refrain from using, or alter the use of any imaging study, medication, device, or treatment. ARKA is a Non-Device Clinical Decision Support tool under §520(o)(1)(E) of the Federal Food, Drug, and Cosmetic Act. A licensed healthcare professional remains solely responsible for any clinical decision, and any clinical decision should be made in the exercise of independent professional judgment, taking into account the individual patient's clinical context.
>
> **16. Changes to this Privacy Policy.** We may update this Privacy Policy from time to time. The "Last updated" date at the top reflects the most recent revision. Material changes will be communicated by posting the revised Privacy Policy on the Site and, where appropriate, by additional notice. Your continued use of the Site or the Services after the revised Privacy Policy becomes effective constitutes your acceptance of the revised terms.
>
> **17. Contact.** ARKA Health, Inc. | Attn: Privacy | privacy@getarka.health.
>
> ---
>
> **Acceptance checklist Cursor must verify before declaring done:**
> 1. `app/privacy/page.tsx` is a valid TSX file, default-exports `PrivacyPage`, and the file's previous placeholder copy is fully removed.
> 2. The `LAST_UPDATED` constant is defined and rendered.
> 3. All 17 sections are present in the order shown above, with the headings shown in **bold** as `<h2>` and the body text verbatim. Do not paraphrase, summarize, or "improve" the legal copy.
> 4. The page is responsive: looks correct at 375px, 768px, and 1280px widths.
> 5. `pnpm lint` and `pnpm typecheck` pass. No ESLint react/no-unescaped-entities errors (escape apostrophes with `&apos;` or use curly braces).
> 6. The footer link `/privacy` still resolves to this page.

---

## Prompt 4 — Write a real Terms of Service (replace the placeholder)

Paste this into Cursor:

> **Task: Replace the placeholder content of `app/terms/page.tsx` with a full, defensible Terms of Service / Terms of Use written in standard US legal style suitable for a digital health / clinical decision support startup. The terms must protect ARKA Health, Inc. with strong but reasonable liability limitations, an arbitration clause, and clinical-use disclaimers appropriate for FDA Non-Device CDS.**
>
> Requirements:
> - Use the same Next.js App Router structure already in `app/terms/page.tsx`. Keep the `export default function TermsPage()` signature.
> - Wrap the content in a `<main>` element using the existing Tailwind tokens (`max-w-3xl mx-auto px-4 py-16`, `text-arka-text`, `text-arka-text-soft`).
> - Render headings (`h2`, `h3`) and body paragraphs with proper semantic HTML and Tailwind classes.
> - At the top, include a "Last updated" line populated from a `const LAST_UPDATED = "May 26, 2026"` constant.
> - The body must contain the following sections in this order, with the exact section headings shown, and the body text shown below verbatim (do not paraphrase — copy it as-is into the JSX, escaping apostrophes as needed for JSX):
>
> ---
>
> **1. Acceptance of these Terms.** These Terms of Service (the "Terms") form a binding legal agreement between you ("you" or "User") and ARKA Health, Inc., a Delaware corporation ("ARKA," "we," "us," or "our"), governing your access to and use of the website located at arkahealth.com and any related subdomains, applications, application programming interfaces, demonstrations, content, and services made available by ARKA (collectively, the "Services"). By accessing or using the Services, you represent that you have read, understood, and agreed to be bound by these Terms and by ARKA's Privacy Policy, which is incorporated by reference. If you do not agree, you must not access or use the Services. If you access the Services on behalf of an organization, you represent and warrant that you have the authority to bind that organization, and "you" refers to both you and that organization.
>
> **2. Eligibility.** You must be at least eighteen (18) years of age and capable of forming a legally binding contract to use the Services. If you use the Services in a professional clinical context, you represent that you are a duly licensed healthcare professional or are acting under the supervision of one, and that your use of the Services complies with all professional, regulatory, and institutional obligations to which you are subject.
>
> **3. The Services are decision support, not medical advice.** ARKA provides Non-Device Clinical Decision Support software within the meaning of §520(o)(1)(E) of the Federal Food, Drug, and Cosmetic Act, 21 U.S.C. § 360j(o)(1)(E). The Services display recommendations, appropriateness scores, citations, and ancillary analytics that a licensed healthcare professional may independently review. The Services do not diagnose, treat, cure, mitigate, or prevent any disease or condition; do not replace the independent professional judgment of a licensed healthcare professional; and are not intended to direct clinical management. The clinician retains sole responsibility for every clinical decision, including the decision to order, modify, or forgo any imaging study, medication, device, or treatment. You agree not to rely on the Services as a substitute for professional medical advice, diagnosis, or treatment.
>
> **4. Demonstrations are illustrative only.** Any interactive demonstration available through the Services — including, without limitation, ARKA-CLIN, ARKA-ED, ARKA-INS, the Rural Platform, and the CDS Hooks Live Demo — uses synthetic or fictional clinical scenarios for illustration. Outputs from such demonstrations are not clinical recommendations for any real patient. You must not submit Protected Health Information, payer-confidential information, or other regulated data through any public demonstration.
>
> **5. License grant.** Subject to your continuing compliance with these Terms, ARKA grants you a limited, revocable, non-exclusive, non-transferable, non-sublicensable license to access and use the Services solely for your internal evaluation or, where you and ARKA have executed a separate written agreement, for the purposes set forth in that agreement. No other rights are granted by implication, estoppel, or otherwise.
>
> **6. Restrictions.** You shall not, and shall not permit any third party to: (a) copy, modify, translate, adapt, or create derivative works of the Services or any part thereof; (b) reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, models, weights, architecture, or training data of the Services, except to the extent such restriction is prohibited by applicable law; (c) sell, resell, lease, sublicense, distribute, time-share, or use the Services for the benefit of any third party except as expressly permitted herein; (d) circumvent, disable, or interfere with any security, rate-limiting, or access-control feature of the Services; (e) use the Services to develop, train, fine-tune, or improve any competing product, model, or service; (f) scrape, crawl, harvest, or otherwise extract data from the Services in bulk or by automated means; (g) submit any content that is unlawful, infringing, defamatory, harassing, harmful, deceptive, or that violates the rights of any third party; (h) submit any Protected Health Information through public-facing demonstrations; or (i) use the Services in violation of any applicable law, regulation, or third-party right.
>
> **7. Your content.** "Your Content" means any text, scenario, file, or other material you submit to the Services. As between you and ARKA, you retain all rights in Your Content. You grant ARKA a worldwide, royalty-free, sublicensable license to host, store, transmit, display, and process Your Content solely to provide and improve the Services, to comply with law, and to enforce these Terms. You represent and warrant that you have all rights necessary to grant that license and that Your Content does not include PHI submitted in violation of Section 6.
>
> **8. Intellectual property.** The Services, including all software, models, algorithms, content, designs, trademarks, service marks, logos, and the look-and-feel of the Site, are owned by ARKA or its licensors and are protected by United States and international intellectual property laws. "ARKA," "ARKA-CLIN," "ARKA-ED," "ARKA-INS," "AIIE," "EpicSim," and the ARKA logo are trademarks of ARKA Health, Inc. All rights not expressly granted to you in these Terms are reserved by ARKA.
>
> **9. Feedback.** If you submit suggestions, ideas, enhancement requests, or other feedback regarding the Services ("Feedback"), you grant ARKA a perpetual, irrevocable, worldwide, royalty-free, fully sublicensable license to use, exploit, and incorporate the Feedback into the Services and any other ARKA product or service, without any obligation or compensation to you.
>
> **10. Third-party services and content.** The Services may interoperate with or display content from third-party services (including, without limitation, electronic health record systems, FHIR-conformant data sources, citation databases, and analytics providers). ARKA does not endorse and is not responsible for any third-party service or content. Your use of any third-party service is governed by that third party's terms and policies.
>
> **11. Disclaimer of warranties.** EXCEPT AS EXPRESSLY STATED IN A SEPARATE WRITTEN AGREEMENT SIGNED BY AN AUTHORIZED OFFICER OF ARKA, THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITH ALL FAULTS, AND ARKA AND ITS LICENSORS DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, COMPLETENESS, QUIET ENJOYMENT, AND ANY WARRANTY ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. ARKA DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, FREE OF HARMFUL COMPONENTS, OR THAT ANY DEFECT WILL BE CORRECTED. ARKA DOES NOT WARRANT THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY RECOMMENDATION, SCORE, ALTERNATIVE, OR CITATION DISPLAYED BY THE SERVICES, AND YOU ASSUME ALL RISK ARISING FROM ANY CLINICAL OR BUSINESS DECISION MADE IN CONNECTION WITH THE SERVICES.
>
> **12. Limitation of liability.** TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ARKA, ITS AFFILIATES, OR ITS OR THEIR OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY (A) INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES; (B) DAMAGES FOR LOST PROFITS, LOST REVENUE, LOST DATA, BUSINESS INTERRUPTION, LOSS OF GOODWILL, OR COST OF SUBSTITUTE GOODS OR SERVICES; OR (C) DAMAGES ARISING FROM A CLINICAL DECISION, DIAGNOSIS, TREATMENT, OR OUTCOME, IN EACH CASE WHETHER ARISING IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR OTHERWISE, AND WHETHER OR NOT ARKA HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN ANY EVENT, ARKA'S TOTAL CUMULATIVE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE GREATER OF (I) THE AMOUNTS PAID BY YOU TO ARKA UNDER A SEPARATE WRITTEN AGREEMENT IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (II) ONE HUNDRED U.S. DOLLARS (US$100). THE PARTIES ACKNOWLEDGE THAT THE LIMITATIONS IN THIS SECTION ARE AN ESSENTIAL BASIS OF THE BARGAIN. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES; IN SUCH JURISDICTIONS, ARKA'S LIABILITY SHALL BE LIMITED TO THE FULLEST EXTENT PERMITTED BY LAW.
>
> **13. Indemnification.** You shall defend, indemnify, and hold harmless ARKA and its affiliates, and its and their officers, directors, employees, agents, and licensors, from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) your access to or use of the Services; (b) your violation of these Terms; (c) Your Content, including any claim that Your Content infringes or misappropriates any third-party right or includes PHI submitted in violation of these Terms; (d) any clinical decision, diagnosis, or treatment in connection with the Services; or (e) your violation of any applicable law, regulation, or third-party right.
>
> **14. Suspension and termination.** ARKA may suspend or terminate your access to the Services at any time, with or without notice, for any reason, including suspected violation of these Terms. Upon termination, all licenses granted to you will immediately terminate, and you must cease all use of the Services. Sections 3, 4, 6, 7, 8, 9, 11, 12, 13, 15, 16, 17, 18, and 19 survive termination.
>
> **15. Changes to the Services and to these Terms.** ARKA may modify, suspend, or discontinue the Services, in whole or in part, at any time. ARKA may revise these Terms from time to time by posting an updated version on the Site. Material changes will be indicated by the "Last updated" date at the top. Your continued use of the Services after the revised Terms become effective constitutes your acceptance of the revised Terms. If you do not agree to a revision, your sole remedy is to cease using the Services.
>
> **16. Governing law and venue.** These Terms and any dispute, claim, or controversy arising out of or relating to these Terms or the Services shall be governed by the laws of the State of Delaware, without regard to its conflict-of-laws principles. Subject to Section 17, the state and federal courts located in Delaware shall have exclusive jurisdiction over any action not subject to arbitration, and each party irrevocably consents to such jurisdiction and venue and waives any objection based on forum non conveniens.
>
> **17. Binding arbitration; class-action waiver.** Except for (a) claims for injunctive or other equitable relief to protect intellectual property or confidential information, and (b) small-claims actions filed in a court of competent jurisdiction, any dispute, claim, or controversy arising out of or relating to these Terms or the Services shall be resolved exclusively by final and binding arbitration administered by JAMS pursuant to its Comprehensive Arbitration Rules and Procedures then in effect. The arbitration shall take place in Wilmington, Delaware, before a single arbitrator, and judgment on the award may be entered in any court of competent jurisdiction. YOU AND ARKA EACH WAIVE ANY RIGHT TO A TRIAL BY JURY AND THE RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE PROCEEDING. The arbitrator shall not have authority to consolidate the claims of more than one person or to preside over any form of class proceeding. If this Section is held unenforceable as to any claim, that claim shall be severed and litigated in the courts identified in Section 16, while the remainder of this Section continues to apply.
>
> **18. Export and sanctions compliance.** You shall comply with all applicable export-control and sanctions laws of the United States and other applicable jurisdictions. You represent that you are not located in, organized under the laws of, or ordinarily resident in any country or region subject to comprehensive U.S. sanctions, and that you are not listed on any U.S. government list of prohibited or restricted parties.
>
> **19. Miscellaneous.** These Terms, together with the Privacy Policy and any separate written agreement signed by an authorized officer of ARKA, constitute the entire agreement between you and ARKA regarding the Services and supersede all prior or contemporaneous agreements, communications, and proposals on the subject. If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall remain in full force and effect. ARKA's failure to enforce any right or provision shall not constitute a waiver. You shall not assign these Terms without ARKA's prior written consent; any purported assignment in violation of this Section is void. ARKA may assign these Terms in its sole discretion, including in connection with a merger, acquisition, financing, or sale of assets. Notices to ARKA shall be sent to legal@getarka.health.
>
> **20. Contact.** ARKA Health, Inc. | Attn: Legal | legal@getarka.health.
>
> ---
>
> **Acceptance checklist Cursor must verify before declaring done:**
> 1. `app/terms/page.tsx` is a valid TSX file, default-exports `TermsPage`, and the previous placeholder copy is fully removed.
> 2. The `LAST_UPDATED` constant is defined and rendered.
> 3. All 20 sections are present in the order shown above, with the headings shown in **bold** as `<h2>` and the body text verbatim. Do not paraphrase, summarize, or "improve" the legal copy.
> 4. All apostrophes inside JSX text are properly escaped (`&apos;` or curly-braced strings) so ESLint passes.
> 5. The page is responsive at 375px, 768px, and 1280px widths.
> 6. `pnpm lint` and `pnpm typecheck` pass.
> 7. The footer link `/terms` still resolves to this page.

---

## After all four prompts run

Manually click through:
1. Landing page → click the new hero "See ARKA Live Inside an EHR" CTA → confirm `/cds-hooks-demo` loads with the new switcher and the new heading.
2. Landing page → top navbar → "CDS Hooks Demo" entry → confirm it loads.
3. `/clin` → "Standalone vs. EHR-embedded" CTA inside the About panel → confirm jump to `/cds-hooks-demo`.
4. Footer → "Privacy" → confirm the full 17-section policy renders.
5. Footer → "Terms" → confirm the full 20-section terms render.

---

## Important legal disclaimer for you (Arri), not for Cursor

The Privacy Policy and Terms above are drafted in standard US legal style and use protective language commonly found in SaaS and digital-health agreements. They are **not legal advice**, and they are intentionally generic enough to ship to shareholders without exposing you in obvious ways. Before public launch, before paid customers, or before any clinical pilot, have outside counsel familiar with HIPAA, FDA Non-Device CDS, and your state of incorporation **review and tailor** both documents — at minimum, the arbitration clause (Sec 17 of Terms), the liability cap (Sec 12 of Terms), the data-retention practices (Sec 9 of Privacy), and any BAA language need to be reconciled with your actual operational practices and any executed customer contracts.
