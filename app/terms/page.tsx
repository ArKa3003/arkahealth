/**
 * Terms of Service for ARKA Health, Inc.
 */

const LAST_UPDATED = "May 26, 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-arka-text-dark">
      <h1 className="text-3xl font-semibold text-arka-text-dark">Terms of Service</h1>
      <p className="mt-2 text-sm text-arka-text-dark-muted">Last updated: {LAST_UPDATED}</p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">1. Acceptance of these Terms.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        These Terms of Service (the &quot;Terms&quot;) form a binding legal agreement between you (&quot;you&quot; or
        &quot;User&quot;) and ARKA Health, Inc., a Delaware corporation (&quot;ARKA,&quot; &quot;we,&quot; &quot;us,&quot;
        or &quot;our&quot;), governing your access to and use of the website located at arkahealth.com and any related
        subdomains, applications, application programming interfaces, demonstrations, content, and services made
        available by ARKA (collectively, the &quot;Services&quot;). By accessing or using the Services, you represent
        that you have read, understood, and agreed to be bound by these Terms and by ARKA&apos;s Privacy Policy, which is
        incorporated by reference. If you do not agree, you must not access or use the Services. If you access the
        Services on behalf of an organization, you represent and warrant that you have the authority to bind that
        organization, and &quot;you&quot; refers to both you and that organization.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">2. Eligibility.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        You must be at least eighteen (18) years of age and capable of forming a legally binding contract to use the
        Services. If you use the Services in a professional clinical context, you represent that you are a duly licensed
        healthcare professional or are acting under the supervision of one, and that your use of the Services complies
        with all professional, regulatory, and institutional obligations to which you are subject.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">
        3. The Services are decision support, not medical advice.
      </h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        ARKA provides Non-Device Clinical Decision Support software within the meaning of §520(o)(1)(E) of the Federal
        Food, Drug, and Cosmetic Act, 21 U.S.C. § 360j(o)(1)(E). The Services display recommendations, appropriateness
        scores, citations, and ancillary analytics that a licensed healthcare professional may independently review. The
        Services do not diagnose, treat, cure, mitigate, or prevent any disease or condition; do not replace the
        independent professional judgment of a licensed healthcare professional; and are not intended to direct clinical
        management. The clinician retains sole responsibility for every clinical decision, including the decision to
        order, modify, or forgo any imaging study, medication, device, or treatment. You agree not to rely on the
        Services as a substitute for professional medical advice, diagnosis, or treatment.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">4. Demonstrations are illustrative only.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        Any interactive demonstration available through the Services — including, without limitation, ARKA-CLIN,
        ARKA-ED, ARKA-INS, the Rural Platform, and the CDS Hooks Live Demo — uses synthetic or fictional clinical
        scenarios for illustration. Outputs from such demonstrations are not clinical recommendations for any real
        patient. You must not submit Protected Health Information, payer-confidential information, or other regulated data
        through any public demonstration.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">5. License grant.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        Subject to your continuing compliance with these Terms, ARKA grants you a limited, revocable, non-exclusive,
        non-transferable, non-sublicensable license to access and use the Services solely for your internal evaluation
        or, where you and ARKA have executed a separate written agreement, for the purposes set forth in that
        agreement. No other rights are granted by implication, estoppel, or otherwise.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">6. Restrictions.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        You shall not, and shall not permit any third party to: (a) copy, modify, translate, adapt, or create derivative
        works of the Services or any part thereof; (b) reverse engineer, decompile, disassemble, or otherwise attempt to
        derive the source code, models, weights, architecture, or training data of the Services, except to the extent
        such restriction is prohibited by applicable law; (c) sell, resell, lease, sublicense, distribute, time-share, or
        use the Services for the benefit of any third party except as expressly permitted herein; (d) circumvent, disable,
        or interfere with any security, rate-limiting, or access-control feature of the Services; (e) use the Services
        to develop, train, fine-tune, or improve any competing product, model, or service; (f) scrape, crawl, harvest,
        or otherwise extract data from the Services in bulk or by automated means; (g) submit any content that is
        unlawful, infringing, defamatory, harassing, harmful, deceptive, or that violates the rights of any third party;
        (h) submit any Protected Health Information through public-facing demonstrations; or (i) use the Services in
        violation of any applicable law, regulation, or third-party right.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">7. Your content.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        &quot;Your Content&quot; means any text, scenario, file, or other material you submit to the Services. As
        between you and ARKA, you retain all rights in Your Content. You grant ARKA a worldwide, royalty-free,
        sublicensable license to host, store, transmit, display, and process Your Content solely to provide and improve
        the Services, to comply with law, and to enforce these Terms. You represent and warrant that you have all rights
        necessary to grant that license and that Your Content does not include PHI submitted in violation of Section 6.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">8. Intellectual property.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        The Services, including all software, models, algorithms, content, designs, trademarks, service marks, logos,
        and the look-and-feel of the Site, are owned by ARKA or its licensors and are protected by United States and
        international intellectual property laws. &quot;ARKA,&quot; &quot;ARKA-CLIN,&quot; &quot;ARKA-ED,&quot;
        &quot;ARKA-INS,&quot; &quot;AIIE,&quot; &quot;EpicSim,&quot; and the ARKA logo are trademarks of ARKA Health,
        Inc. All rights not expressly granted to you in these Terms are reserved by ARKA.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">9. Feedback.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        If you submit suggestions, ideas, enhancement requests, or other feedback regarding the Services
        (&quot;Feedback&quot;), you grant ARKA a perpetual, irrevocable, worldwide, royalty-free, fully sublicensable
        license to use, exploit, and incorporate the Feedback into the Services and any other ARKA product or service,
        without any obligation or compensation to you.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">10. Third-party services and content.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        The Services may interoperate with or display content from third-party services (including, without limitation,
        electronic health record systems, FHIR-conformant data sources, citation databases, and analytics providers).
        ARKA does not endorse and is not responsible for any third-party service or content. Your use of any third-party
        service is governed by that third party&apos;s terms and policies.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">11. Disclaimer of warranties.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        EXCEPT AS EXPRESSLY STATED IN A SEPARATE WRITTEN AGREEMENT SIGNED BY AN AUTHORIZED OFFICER OF ARKA, THE SERVICES
        ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITH ALL FAULTS, AND ARKA AND ITS LICENSORS DISCLAIM
        ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING ALL IMPLIED WARRANTIES
        OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, COMPLETENESS, QUIET
        ENJOYMENT, AND ANY WARRANTY ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. ARKA DOES NOT WARRANT THAT THE
        SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, FREE OF HARMFUL COMPONENTS, OR THAT ANY DEFECT WILL BE
        CORRECTED. ARKA DOES NOT WARRANT THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY RECOMMENDATION, SCORE,
        ALTERNATIVE, OR CITATION DISPLAYED BY THE SERVICES, AND YOU ASSUME ALL RISK ARISING FROM ANY CLINICAL OR BUSINESS
        DECISION MADE IN CONNECTION WITH THE SERVICES.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">12. Limitation of liability.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ARKA, ITS AFFILIATES, OR ITS OR THEIR
        OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY (A) INDIRECT, INCIDENTAL, CONSEQUENTIAL,
        SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES; (B) DAMAGES FOR LOST PROFITS, LOST REVENUE, LOST DATA, BUSINESS
        INTERRUPTION, LOSS OF GOODWILL, OR COST OF SUBSTITUTE GOODS OR SERVICES; OR (C) DAMAGES ARISING FROM A CLINICAL
        DECISION, DIAGNOSIS, TREATMENT, OR OUTCOME, IN EACH CASE WHETHER ARISING IN CONTRACT, TORT (INCLUDING
        NEGLIGENCE), STRICT LIABILITY, OR OTHERWISE, AND WHETHER OR NOT ARKA HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH
        DAMAGES. IN ANY EVENT, ARKA&apos;S TOTAL CUMULATIVE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE
        SERVICES SHALL NOT EXCEED THE GREATER OF (I) THE AMOUNTS PAID BY YOU TO ARKA UNDER A SEPARATE WRITTEN AGREEMENT
        IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (II) ONE HUNDRED U.S. DOLLARS
        (US$100). THE PARTIES ACKNOWLEDGE THAT THE LIMITATIONS IN THIS SECTION ARE AN ESSENTIAL BASIS OF THE BARGAIN.
        SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES; IN SUCH JURISDICTIONS, ARKA&apos;S
        LIABILITY SHALL BE LIMITED TO THE FULLEST EXTENT PERMITTED BY LAW.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">13. Indemnification.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        You shall defend, indemnify, and hold harmless ARKA and its affiliates, and its and their officers, directors,
        employees, agents, and licensors, from and against any and all claims, damages, losses, liabilities, costs, and
        expenses (including reasonable attorneys&apos; fees) arising out of or relating to: (a) your access to or use of
        the Services; (b) your violation of these Terms; (c) Your Content, including any claim that Your Content
        infringes or misappropriates any third-party right or includes PHI submitted in violation of these Terms; (d) any
        clinical decision, diagnosis, or treatment in connection with the Services; or (e) your violation of any
        applicable law, regulation, or third-party right.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">14. Suspension and termination.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        ARKA may suspend or terminate your access to the Services at any time, with or without notice, for any reason,
        including suspected violation of these Terms. Upon termination, all licenses granted to you will immediately
        terminate, and you must cease all use of the Services. Sections 3, 4, 6, 7, 8, 9, 11, 12, 13, 15, 16, 17, 18,
        and 19 survive termination.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">
        15. Changes to the Services and to these Terms.
      </h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        ARKA may modify, suspend, or discontinue the Services, in whole or in part, at any time. ARKA may revise these
        Terms from time to time by posting an updated version on the Site. Material changes will be indicated by the
        &quot;Last updated&quot; date at the top. Your continued use of the Services after the revised Terms become
        effective constitutes your acceptance of the revised Terms. If you do not agree to a revision, your sole remedy
        is to cease using the Services.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">16. Governing law and venue.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        These Terms and any dispute, claim, or controversy arising out of or relating to these Terms or the Services
        shall be governed by the laws of the State of Delaware, without regard to its conflict-of-laws principles.
        Subject to Section 17, the state and federal courts located in Delaware shall have exclusive jurisdiction over any
        action not subject to arbitration, and each party irrevocably consents to such jurisdiction and venue and waives
        any objection based on forum non conveniens.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">
        17. Binding arbitration; class-action waiver.
      </h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        Except for (a) claims for injunctive or other equitable relief to protect intellectual property or confidential
        information, and (b) small-claims actions filed in a court of competent jurisdiction, any dispute, claim, or
        controversy arising out of or relating to these Terms or the Services shall be resolved exclusively by final and
        binding arbitration administered by JAMS pursuant to its Comprehensive Arbitration Rules and Procedures then in
        effect. The arbitration shall take place in Wilmington, Delaware, before a single arbitrator, and judgment on
        the award may be entered in any court of competent jurisdiction. YOU AND ARKA EACH WAIVE ANY RIGHT TO A TRIAL BY
        JURY AND THE RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE PROCEEDING. The
        arbitrator shall not have authority to consolidate the claims of more than one person or to preside over any form
        of class proceeding. If this Section is held unenforceable as to any claim, that claim shall be severed and
        litigated in the courts identified in Section 16, while the remainder of this Section continues to apply.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">18. Export and sanctions compliance.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        You shall comply with all applicable export-control and sanctions laws of the United States and other applicable
        jurisdictions. You represent that you are not located in, organized under the laws of, or ordinarily resident in
        any country or region subject to comprehensive U.S. sanctions, and that you are not listed on any U.S. government
        list of prohibited or restricted parties.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">19. Miscellaneous.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        These Terms, together with the Privacy Policy and any separate written agreement signed by an authorized officer
        of ARKA, constitute the entire agreement between you and ARKA regarding the Services and supersede all prior or
        contemporaneous agreements, communications, and proposals on the subject. If any provision of these Terms is held
        invalid or unenforceable, the remaining provisions shall remain in full force and effect. ARKA&apos;s failure to
        enforce any right or provision shall not constitute a waiver. You shall not assign these Terms without ARKA&apos;s
        prior written consent; any purported assignment in violation of this Section is void. ARKA may assign these Terms
        in its sole discretion, including in connection with a merger, acquisition, financing, or sale of assets. Notices
        to ARKA shall be sent to legal@getarka.health.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold text-arka-text-dark">20. Contact.</h2>
      <p className="mb-4 text-base leading-relaxed text-arka-text-dark">
        ARKA Health, Inc. | Attn: Legal | legal@getarka.health.
      </p>
    </main>
  );
}
