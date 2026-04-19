"use client";

import { evaluateRAAS } from "@/lib/demos/rural/scoring/raas-engine";
import type { FacilityProfile, RAASInput } from "@/lib/demos/rural/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/rural/shared/ui/Card";
import { DualScoreDisplay } from "@/components/demos/rural/cds/DualScoreDisplay";

function buildDemoInput(facility: FacilityProfile): RAASInput {
  return {
    facilityProfile: facility,
    patientContext: {
      distanceToFacilityMiles: Math.min(85, facility.location.distanceToUrbanCenter),
      transportationAccess: "own-vehicle",
      employmentImpact: "half-day",
      childcareNeeded: false,
      insuranceType: "Medicare",
      preferredLanguage: "English",
      mobilityLimitations: false,
    },
    clinicalScenario: {
      patientId: "demo-rural-cds",
      age: 62,
      sex: "female",
      chiefComplaint: "Chronic low back pain with radiculopathy",
      clinicalHistory: "Progressive symptoms; conservative therapy incomplete",
      symptoms: ["radiating pain", "paresthesias"],
      duration: "8 weeks",
      redFlags: [
        { flag: "Cauda equina symptoms", present: false },
        { flag: "Fever or infection", present: false },
      ],
      proposedImaging: {
        modality: "MRI",
        bodyPart: "lumbar spine",
        indication: "Evaluate disc vs stenosis",
        urgency: "routine",
      },
    },
  };
}

export function ResourceAwareScoring({ facility }: { facility: FacilityProfile }) {
  const result = evaluateRAAS(buildDemoInput(facility));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource-adjusted appropriateness (RAAS)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DualScoreDisplay
          cas={result.clinicalAppropriatenessScore}
          raas={result.resourceAdjustedScore}
          resourceFactors={result.resourceFactors}
          urgency={result.urgencyClassification}
        />
        <p className="text-sm text-arka-text-dark-muted">{result.resourceAdjustedScore.adjustmentReason}</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-arka-text-dark-muted">
          <li>Urgency: {result.urgencyClassification}</li>
          <li>Triage: {result.triageRecommendation.tier.replace(/-/g, " ")}</li>
          <li>{result.overallRecommendation}</li>
        </ul>
      </CardContent>
    </Card>
  );
}
