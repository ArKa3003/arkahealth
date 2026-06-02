/**
 * Builds a fully populated prior-authorization appeal letter for any demo order.
 */

import type { GeneratedAppeal, ImagingOrder, LiteratureCitation, Patient } from "@/lib/demos/ins/types";

/** Synthesizes a plausible prior-auth reference number from the order id. */
function synthesizeAuthNumber(orderId: string): string {
  const year = new Date().getFullYear();
  const suffix = orderId.replace(/\D/g, "").padStart(6, "0").slice(-6);
  return `PA-${year}-${suffix}`;
}

/** Returns patient age in full years from date of birth. */
function patientAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function formatLetterDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatServiceDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function primaryDiagnosis(order: ImagingOrder): { code: string; description: string } {
  const code = order.icdCodes[0] ?? "—";
  const description = order.icdDescriptions?.[0] ?? order.clinicalIndication;
  return { code, description };
}

function conservativeSummary(order: ImagingOrder): string {
  const treatments = order.conservativeTreatments ?? [];
  if (treatments.length === 0) {
    return "No formal conservative treatment trial has been documented in the prior authorization record.";
  }
  return treatments
    .map(
      (t) =>
        `${t.type} (${t.duration}, ${t.startDate}${t.endDate ? `–${t.endDate}` : ""}; outcome: ${t.outcome}${t.notes ? `; ${t.notes}` : ""})`
    )
    .join("; ");
}

interface ScenarioContent {
  denialReason: string;
  citedGuidelines: string[];
  supportingLiterature: LiteratureCitation[];
  bodyParagraphs: string[];
}

function scenarioContent(order: ImagingOrder, patient: Patient): ScenarioContent {
  const age = patientAge(patient.dateOfBirth);
  const sex = patient.gender === "male" ? "male" : patient.gender === "female" ? "female" : "patient";
  const dx = primaryDiagnosis(order);
  const payer = patient.insurancePlan.name;
  const rbm = patient.insurancePlan.rbmVendor;
  const conservative = conservativeSummary(order);
  const provider = order.orderingProvider;

  if (order.bodyPart.toLowerCase().includes("lumbar") || order.cptCode === "72148") {
    return {
      denialReason:
        "Prior authorization denied — requested lumbar MRI does not meet medical necessity criteria pending additional documentation of failed conservative management and correlation with objective neurologic findings.",
      citedGuidelines: [
        "ACR Appropriateness Criteria — Low Back Pain",
        `${payer} Advanced Imaging Policy`,
        `${rbm} Musculoskeletal (MSK) Clinical Guidelines`,
      ],
      supportingLiterature: [
        {
          title: "ACR Appropriateness Criteria: Low Back Pain",
          authors: "American College of Radiology",
          journal: "J Am Coll Radiol",
          year: 2021,
          doi: "10.1016/j.jacr.2021.01.001",
          relevance:
            "Supports advanced imaging when radiculopathy persists after appropriate conservative care with objective neurologic findings.",
        },
        {
          title: "Diagnostic Imaging for Low Back Pain: Advice for High-Value Health Care From the American College of Physicians",
          authors: "Chou R, et al.",
          journal: "Ann Intern Med",
          year: 2017,
          relevance:
            "Supports imaging when red flags or persistent radiculopathy with neurologic deficit are present after conservative therapy.",
        },
        {
          title: "Magnetic Resonance Imaging in Follow-up Assessment of Sciatica",
          authors: "El Barzouhi A, et al.",
          journal: "N Engl J Med",
          year: 2013,
          relevance:
            "Demonstrates clinical utility of lumbar MRI for surgical decision-making in persistent radiculopathy.",
        },
      ],
      bodyParagraphs: [
        `I am submitting this first-level appeal on behalf of ${patient.firstName} ${patient.lastName} (Member ID: ${patient.memberId}) regarding the denial of prior authorization for ${order.cptDescription ?? order.imagingType} (CPT ${order.cptCode}) ordered by ${provider.name} for ${formatServiceDate(order.createdAt)}. The denial cited insufficient medical necessity documentation. I respectfully request reconsideration and overturn of this denial.`,
        `Clinical summary: This ${age}-year-old ${sex} presents with ${dx.description} (ICD-10: ${dx.code}) and associated lumbar radiculopathy documented over 18 months. Objective examination demonstrates positive straight-leg raise, diminished sensation in the L5 distribution, decreased ankle reflex, and antalgic gait. Documented conservative management includes: ${conservative}. Symptoms remain severe (reported 7/10) with functional limitation despite these interventions.`,
        `Medical-necessity justification: Per ACR Appropriateness Criteria for low back pain, MRI of the lumbar spine is appropriate when persistent radiculopathy with neurologic findings continues after a trial of conservative therapy. The member meets ${rbm} MSK criteria for radiculopathy, failed conservative treatment exceeding six weeks, objective neurologic findings, and symptom duration well beyond four weeks. MRI is the appropriate next diagnostic step to correlate anatomic findings with the clinical syndrome, assess surgical candidacy, and guide further management—not for screening of uncomplicated acute low back pain.`,
        `The ordering clinician has attached updated clinical notes, conservative treatment records, and physical examination findings supporting medical necessity. I respectfully request that you overturn the denial and authorize CPT ${order.cptCode} without delay. ${provider.name} is available for peer-to-peer review at ${provider.phone ?? "the contact number on file"} upon 24 hours' notice.`,
      ],
    };
  }

  if (order.bodyPart.toLowerCase().includes("brain") || order.cptCode === "70553") {
    return {
      denialReason:
        "Insufficient conservative treatment trial — neuroimaging not approved until completion of 4–6 weeks of appropriate pharmacologic and non-pharmacologic management per AIM Neuroimaging guidelines.",
      citedGuidelines: [
        "ACR Appropriateness Criteria — Headache",
        `${payer} Neuroimaging Prior Authorization Policy`,
        "AIM Neuroimaging Clinical Guidelines — Headache",
      ],
      supportingLiterature: [
        {
          title: "The American Headache Society Position Statement On Integrating New Migraine Treatments Into Clinical Practice",
          authors: "AHS Guideline Committee",
          journal: "Headache",
          year: 2019,
          relevance:
            "Supports imaging when headache pattern changes, new neurologic symptoms develop, or conservative measures fail.",
        },
        {
          title: "Diagnostic Testing for Headaches",
          authors: "Evans RW, et al.",
          journal: "Neurol Clin",
          year: 2019,
          relevance:
            "Recommends neuroimaging when progressive headache pattern or new concerning features emerge despite initial conservative therapy.",
        },
        {
          title: "ACR Appropriateness Criteria: Headache",
          authors: "American College of Radiology",
          journal: "J Am Coll Radiol",
          year: 2020,
          relevance:
            "Rates MRI brain as appropriate for new headache with progression or new neurologic symptoms after failed conservative care.",
        },
      ],
      bodyParagraphs: [
        `I am submitting this formal first-level appeal for ${patient.firstName} ${patient.lastName} (Member ID: ${patient.memberId}) contesting the denial of ${order.cptDescription ?? "MRI Brain"} (CPT ${order.cptCode}) ordered on ${formatServiceDate(order.createdAt)}. The stated denial reason was an insufficient conservative treatment trial. Clinical circumstances have materially changed since the initial submission.`,
        `Clinical summary: This ${age}-year-old ${sex} was initially evaluated for ${dx.description} (ICD-10: ${dx.code}) of approximately three weeks' duration. Since the denial, the member reports daily headaches with progression in severity, new intermittent visual disturbances, and failure of acetaminophen (two weeks) and ibuprofen (two weeks) at appropriate doses. A structured headache diary documents worsening frequency and intensity. ${order.clinicalNotes}`,
        `Medical-necessity justification: While initial presentation did not meet criteria for early neuroimaging, ACR Appropriateness Criteria and American Headache Society guidance support MRI when headache pattern progresses, new symptoms develop, or conservative therapy fails. AIM guidelines permit exceptions when documented progression occurs despite pharmacologic trial. The requested MRI with and without contrast is medically necessary to exclude secondary causes, assess for intracranial pathology given new visual symptoms, and guide safe management.`,
        `I request immediate reconsideration and approval of CPT ${order.cptCode}. Should additional review be required, ${provider.name} requests peer-to-peer discussion within one business day at ${provider.phone ?? "the number on file"}.`,
      ],
    };
  }

  // Lung / PET-CT / whole body staging
  return {
    denialReason:
      "PET-CT not approved — advanced imaging requires tissue diagnosis prior to PET-CT per oncology imaging policy; pre-biopsy staging not supported without pathology confirmation.",
    citedGuidelines: [
      "ACR Appropriateness Criteria — Lung Cancer Screening and Staging",
      `${payer} Oncology Imaging Policy`,
      "Medicare LCD L35013 — FDG PET for Oncologic Conditions",
    ],
    supportingLiterature: [
      {
        title: "ACR Appropriateness Criteria: Noninvasive Clinical Staging of Primary Lung Cancer",
        authors: "American College of Radiology",
        journal: "J Am Coll Radiol",
        year: 2022,
        relevance:
          "Supports PET-CT for staging of biopsy-proven or highly suspicious lung malignancy when curative treatment is planned.",
        },
      {
        title: "Diagnosis and Management of Lung Cancer: American College of Chest Physicians Evidence-Based Clinical Practice Guidelines",
        authors: "Detterbeck FC, et al.",
        journal: "Chest",
        year: 2013,
        relevance:
          "Recommends PET-CT for staging of known or suspected lung cancer prior to curative-intent therapy when tissue diagnosis is established or imminent.",
      },
      {
        title: "The 2021 WHO Classification of Lung Tumors: Impact of Advances Since 2015",
        authors: "Nicholson AG, et al.",
        journal: "J Thorac Oncol",
        year: 2022,
        relevance:
          "Supports accurate anatomic and metabolic staging to guide multidisciplinary treatment planning in suspected lung malignancy.",
      },
    ],
    bodyParagraphs: [
      `I am appealing the denial of prior authorization for ${order.cptDescription ?? "PET-CT"} (CPT ${order.cptCode}) for ${patient.firstName} ${patient.lastName} (Member ID: ${patient.memberId}), date of service ${formatServiceDate(order.createdAt)}. The denial stated that tissue diagnosis is required before PET-CT. This appeal addresses why pre-biopsy staging PET-CT is medically necessary for this member.`,
      `Clinical summary: This ${age}-year-old ${sex} with a ${patient.medicalHistory.find((m) => m.icdCode.startsWith("J44")) ? "40 pack-year smoking history and " : ""}COPD presents with a 2.3 cm spiculated right upper lobe pulmonary nodule (ICD-10: ${dx.code} — ${dx.description}; additional coding ${order.icdCodes.slice(1).join(", ")}). High clinical suspicion for primary lung malignancy. Prior chest CT (${order.priorImagingDates?.join(", ") ?? "on file"}) demonstrates malignant-appearing morphology. Transbronchial biopsy is scheduled; multidisciplinary tumor board requires metabolic staging to determine surgical versus systemic therapy candidacy. Performance status ECOG 1.`,
      `Medical-necessity justification: Per ACR Appropriateness Criteria and Medicare LCD L35013, FDG PET-CT is indicated for staging of known or suspected lung cancer when the member is a candidate for curative-intent treatment. A Lung-RADS 4B equivalent lesion with spiculation, growth, and high malignancy risk satisfies diagnostic intent for staging—not screening. Pre-biopsy PET-CT is standard of care at NCCN-member centers when biopsy and staging must occur in parallel to avoid treatment delay. Delaying PET-CT until pathology returns would postpone surgical planning by 2–3 weeks with no clinical benefit.`,
      `The ordering oncologist has documented staging intent, prior chest CT, biopsy schedule, and treatment candidacy. I request overturn of the denial and authorization of CPT ${order.cptCode} on an urgent basis. ${provider.name} is available for peer-to-peer review at ${provider.phone ?? "the contact number on file"}.`,
    ],
  };
}

/**
 * Composes a complete {@link GeneratedAppeal} for any demo imaging order and patient.
 */
export function buildGeneratedAppeal(order: ImagingOrder, patient: Patient): GeneratedAppeal {
  const scenario = scenarioContent(order, patient);
  const payer = patient.insurancePlan.name;
  const rbm = patient.insurancePlan.rbmVendor;
  const dx = primaryDiagnosis(order);
  const authNumber = synthesizeAuthNumber(order.id);
  const letterDate = formatLetterDate();
  const serviceDate = formatServiceDate(order.createdAt);
  const memberName = `${patient.firstName} ${patient.lastName}`;
  const provider = order.orderingProvider;

  const payerBlock = rbm && rbm !== "Internal"
    ? `To: ${payer} — Medical Director, Prior Authorization Appeals\nVia: ${rbm} Utilization Management`
    : `To: ${payer} — Medical Director, Prior Authorization Appeals`;

  const reBlock = [
    `RE: ${memberName} | Member ID: ${patient.memberId}`,
    `Date of Service: ${serviceDate}`,
    `Requested Study: CPT ${order.cptCode} — ${order.cptDescription ?? order.imagingType}`,
    `Primary Diagnosis: ${dx.description} (ICD-10: ${dx.code})`,
    `Authorization / Reference #: ${authNumber}`,
  ].join("\n");

  const subject =
    "Subject: Formal Appeal of Prior Authorization Denial — Request for Reconsideration";

  const signature = [
    "Respectfully submitted,",
    "",
    provider.name,
    `${provider.specialty} | NPI ${provider.npi}`,
    provider.facility,
    provider.phone ? `Tel: ${provider.phone}` : "",
    provider.fax ? `Fax: ${provider.fax}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const letterContent = [
    "ARKA-INS · Utilization Management",
    letterDate,
    "",
    payerBlock,
    "",
    reBlock,
    "",
    subject,
    "",
    ...scenario.bodyParagraphs,
    "",
    signature,
  ].join("\n\n");

  return {
    orderId: order.id,
    appealType: "first-level",
    letterContent,
    citedGuidelines: scenario.citedGuidelines,
    supportingLiterature: scenario.supportingLiterature,
    peerToPeerRequested: true,
    generatedAt: new Date().toISOString(),
    denialReason: scenario.denialReason,
    denialDate: new Date(Date.now() - 86_400_000).toISOString().split("T")[0],
    originalAuthNumber: authNumber,
  };
}
