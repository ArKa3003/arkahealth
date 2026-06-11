import { DocsPageLayout } from "@/components/docs/DocsPageLayout";

const LAST_UPDATED = "May 26, 2026";

const PRIVACY_TOC = [
  { id: "introduction", label: "1. Introduction", level: 2 },
  { id: "scope", label: "2. Scope and applicability", level: 2 },
  { id: "no-phi", label: "3. No PHI in the public Site or demos", level: 2 },
  { id: "information-collected", label: "4. Information we collect", level: 2 },
  { id: "how-we-use", label: "5. How we use information", level: 2 },
  { id: "legal-bases", label: "6. Legal bases (EEA / UK)", level: 2 },
  { id: "sharing", label: "7. Sharing and disclosure", level: 2 },
  { id: "cookies", label: "8. Cookies and analytics", level: 2 },
  { id: "retention", label: "9. Data retention", level: 2 },
  { id: "security", label: "10. Security", level: 2 },
  { id: "international", label: "11. International transfers", level: 2 },
  { id: "your-rights", label: "12. Your rights", level: 2 },
  { id: "children", label: "13. Children's privacy", level: 2 },
  { id: "third-party", label: "14. Third-party links", level: 2 },
  { id: "no-medical-advice", label: "15. No medical advice", level: 2 },
  { id: "changes", label: "16. Changes to this policy", level: 2 },
  { id: "contact", label: "17. Contact", level: 2 },
] as const;

/** Privacy Policy for ARKA Health, Inc. */
export default function PrivacyPage() {
  return (
    <DocsPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED} toc={[...PRIVACY_TOC]}>
      <h2 id="introduction" className="scroll-mt-24">1. Introduction.</h2>
      <p>
        ARKA Health, Inc. (&quot;ARKA,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website
        located at arkahealth.com and related subdomains (the &quot;Site&quot;) and provides clinical decision support
        software, demonstrations, and related materials (collectively, the &quot;Services&quot;). This Privacy Policy
        explains how we collect, use, disclose, and safeguard information when you visit the Site or interact with the
        Services. By accessing the Site or the Services, you acknowledge that you have read and understood this Privacy
        Policy. If you do not agree, you must not use the Site or the Services.
      </p>

      <h2 id="scope" className="scroll-mt-24">2. Scope and applicability.</h2>
      <p>
        This Privacy Policy applies to information collected through the Site and through any interactive
        demonstrations, including but not limited to ARKA-CLIN, ARKA-ED, ARKA-INS, the Rural Platform, and the CDS
        Hooks Live Demo. It does not apply to information processed on behalf of a healthcare provider, payer, or other
        covered entity under a separate Business Associate Agreement (&quot;BAA&quot;), Data Processing Agreement, or
        Master Services Agreement. Where ARKA acts as a Business Associate under the Health Insurance Portability and
        Accountability Act of 1996, as amended (&quot;HIPAA&quot;), the terms of the applicable BAA control over this
        Privacy Policy with respect to Protected Health Information (&quot;PHI&quot;).
      </p>

      <h2 id="no-phi" className="scroll-mt-24">3. No PHI in the public Site or demos.</h2>
      <p>
        The public Site and all publicly accessible demonstrations are intended for informational and illustrative
        purposes only. You must not submit, upload, paste, or otherwise transmit any Protected Health Information,
        personally identifiable patient information, payer-confidential information, or any other regulated or sensitive
        third-party data into any input field, form, or demo on the Site. Any clinical scenarios, patient names, medical
        record numbers, or identifiers shown in demonstrations are synthetic, fictional, and constructed solely for
        illustration. ARKA disclaims any and all liability arising from a user&apos;s submission of PHI or other
        regulated information in violation of this Section 3.
      </p>

      <h2 id="information-collected" className="scroll-mt-24">4. Information we collect.</h2>
      <p>
        We may collect: (a) information you voluntarily provide, including your name, email address, employer, role, and
        the content of any message you submit through a contact form or email link; (b) technical information
        automatically collected when you visit the Site, including IP address, browser type, operating system, device
        identifiers, referring URL, pages viewed, time spent, and similar telemetry; (c) cookies, web beacons, local
        storage, and similar technologies as described in Section 8; and (d) information you choose to share when
        interacting with a demonstration, including any clinical scenario text you enter, which is processed
        transiently to render an evaluation and is not stored against your identity for downstream marketing purposes.
      </p>

      <h2 id="how-we-use" className="scroll-mt-24">5. How we use information.</h2>
      <p>
        We use information to: (a) operate, maintain, secure, and improve the Site and the Services; (b) respond to
        inquiries and provide requested information; (c) generate aggregated, de-identified analytics about usage
        patterns; (d) detect, prevent, and respond to fraud, abuse, security incidents, or violations of our Terms of
        Service; (e) comply with applicable law, legal process, regulatory request, or court order; and (f) evaluate,
        develop, and improve ARKA&apos;s clinical decision support models, including the ARKA Imaging Intelligence
        Engine (&quot;AIIE&quot;), provided that any data used for model improvement is first de-identified in
        accordance with the HIPAA Safe Harbor method (45 C.F.R. § 164.514(b)(2)) or Expert Determination (45 C.F.R. §
        164.514(b)(1)) where applicable.
      </p>

      <h2 id="legal-bases" className="scroll-mt-24">6. Legal bases for processing (EEA / UK users).</h2>
      <p>
        Where the General Data Protection Regulation or the UK General Data Protection Regulation applies, we rely on
        the following legal bases: (a) your consent, which you may withdraw at any time; (b) the performance of a
        contract to which you are a party; (c) compliance with a legal obligation; and (d) our legitimate interests in
        operating, securing, and improving the Services, where those interests are not overridden by your rights and
        freedoms.
      </p>

      <h2 id="sharing" className="scroll-mt-24">7. Sharing and disclosure.</h2>
      <p>
        We do not sell personal information. We may share information with: (a) service providers and subprocessors who
        perform functions on our behalf under written confidentiality and data protection obligations (e.g., cloud
        hosting, analytics, email delivery, error monitoring); (b) professional advisors, including legal counsel,
        auditors, and accountants; (c) acquirers or successors in connection with a merger, acquisition, financing,
        reorganization, sale of assets, or similar corporate transaction; (d) regulators, law enforcement, or other
        parties where required by applicable law or to protect the rights, property, or safety of ARKA, our users, or
        the public; and (e) any other party with your direction or consent.
      </p>

      <h2 id="cookies" className="scroll-mt-24">8. Cookies and analytics.</h2>
      <p>
        We use cookies and similar technologies to operate the Site, remember preferences, measure usage, and support
        security. You can configure your browser to refuse cookies or alert you when cookies are being sent. Disabling
        cookies may degrade certain features. We may use first-party and third-party analytics services that themselves
        act as independent data controllers; their practices are governed by their own privacy policies.
      </p>

      <h2 id="retention" className="scroll-mt-24">9. Data retention.</h2>
      <p>
        We retain information for as long as reasonably necessary to fulfill the purposes described in this Privacy
        Policy, unless a longer retention period is required or permitted by law (including for tax, accounting,
        regulatory, dispute resolution, or contractual purposes). De-identified and aggregated information may be
        retained indefinitely.
      </p>

      <h2 id="security" className="scroll-mt-24">10. Security.</h2>
      <p>
        We implement administrative, physical, and technical safeguards designed to protect information against
        accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or unauthorized access. No
        method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot
        guarantee absolute security. You acknowledge that you provide information at your own risk.
      </p>

      <h2 id="international" className="scroll-mt-24">11. International transfers.</h2>
      <p>
        Information collected through the Site may be processed in the United States and other jurisdictions whose data
        protection laws may differ from those of your country. By using the Site, you consent to such transfers. Where
        required by applicable law, we implement appropriate safeguards (e.g., Standard Contractual Clauses) for
        cross-border transfers.
      </p>

      <h2 id="your-rights" className="scroll-mt-24">12. Your rights.</h2>
      <p>
        Depending on your jurisdiction, you may have rights to access, correct, delete, port, restrict, or object to the
        processing of your personal information, and to lodge a complaint with a supervisory authority. To exercise any
        such right, contact us at privacy@getarka.health. We will respond within the timeframe required by applicable
        law. We may need to verify your identity before fulfilling a request.
      </p>

      <h2 id="children" className="scroll-mt-24">13. Children&apos;s privacy.</h2>
      <p>
        The Site and the Services are not directed to children under the age of 13 (or under the age of 16 in
        jurisdictions where that higher threshold applies), and we do not knowingly collect personal information from
        children. If you believe a child has provided personal information to us, please contact us and we will take
        appropriate steps to delete it.
      </p>

      <h2 id="third-party" className="scroll-mt-24">14. Third-party links and content.</h2>
      <p>
        The Site may contain links to third-party websites, services, or resources that are not operated by ARKA. ARKA
        is not responsible for the privacy practices or content of such third parties, and your interactions with them
        are governed by their own policies.
      </p>

      <h2 id="no-medical-advice" className="scroll-mt-24">
        15. No medical advice; not a substitute for clinical judgment.
      </h2>
      <p>
        ARKA&apos;s demonstrations and content are provided for informational and evaluative purposes only and do not
        constitute medical advice, diagnosis, treatment, or a recommendation to use, refrain from using, or alter the
        use of any imaging study, medication, device, or treatment. ARKA is a Non-Device Clinical Decision Support tool
        under §520(o)(1)(E) of the Federal Food, Drug, and Cosmetic Act. A licensed healthcare professional remains
        solely responsible for any clinical decision, and any clinical decision should be made in the exercise of
        independent professional judgment, taking into account the individual patient&apos;s clinical context.
      </p>

      <h2 id="changes" className="scroll-mt-24">16. Changes to this Privacy Policy.</h2>
      <p>
        We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top reflects the
        most recent revision. Material changes will be communicated by posting the revised Privacy Policy on the Site
        and, where appropriate, by additional notice. Your continued use of the Site or the Services after the revised
        Privacy Policy becomes effective constitutes your acceptance of the revised terms.
      </p>

      <h2 id="contact" className="scroll-mt-24">17. Contact.</h2>
      <p>ARKA Health, Inc. | Attn: Privacy | privacy@getarka.health.</p>
    </DocsPageLayout>
  );
}
