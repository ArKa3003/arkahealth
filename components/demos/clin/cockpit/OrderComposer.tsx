"use client";

import * as React from "react";
import { useCallback, useMemo } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClinicalScenario, ImagingModality, RedFlag } from "@/lib/demos/clin/types";
import { buildClinDemoRecordSnapshot } from "@/lib/demos/clin/clin-record-snapshot";
import { clinicalScenarioToAIIEInput } from "@/lib/demos/clin/clin-aiie-input";
import { proposeAutofill } from "@/lib/aiie/requisition-autofill";
import type { AutofillProposalField } from "@/lib/aiie/requisition-autofill";
import type { AIIERedFlags } from "@/lib/types/aiie";
import { isSwallowStudyOrder } from "@/lib/aiie/swallow-triage";
import { RequisitionAutofillCard } from "../RequisitionAutofillCard";
import { DocumentationAssistantCard } from "../DocumentationAssistantCard";
import { SwallowTriageCard } from "../SwallowTriageCard";
import { FieldError } from "../ui/FieldError";
import { ClinCombobox } from "./ClinCombobox";
import { EvaluationStepTracker } from "./EvaluationStepTracker";
import { ClinEmptyState } from "./ClinEmptyState";

const IMAGING_MODALITIES: ImagingModality[] = [
  "X-ray",
  "CT",
  "CT with contrast",
  "MRI",
  "MRI with contrast",
  "Ultrasound",
  "Nuclear Medicine",
  "PET-CT",
];

const BODY_PART_OPTIONS = [
  "lumbar spine",
  "cervical spine",
  "head",
  "chest",
  "abdomen",
  "abdomen and pelvis",
  "pelvis",
  "knee",
  "shoulder",
  "neck",
].map((v) => ({ value: v }));

const INDICATION_OPTIONS = [
  "rule out disc herniation",
  "evaluate chronic headaches",
  "rule out subarachnoid hemorrhage",
  "evaluate for appendicitis",
  "rule out pulmonary embolism",
  "lung cancer screening per USPSTF guidelines",
  "rule out aortic dissection or PE",
  "evaluate for metastatic disease vs disc herniation",
].map((v) => ({ value: v }));

const RED_FLAG_LABELS: string[] = [
  "History of cancer",
  "Unexplained weight loss",
  "Fever",
  "Neurological deficit",
  "Trauma",
  "Age > 50 with new symptoms",
  "Progressive symptoms",
  "Immunocompromised",
  "IV drug use",
  "Anticoagulation therapy",
];

const URGENCY_OPTIONS: { value: "routine" | "urgent" | "stat"; label: string }[] = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "stat", label: "Emergent" },
];

interface FormErrors {
  age?: string;
  sex?: string;
  chiefComplaint?: string;
  bodyPart?: string;
  clinicalIndication?: string;
}

export interface OrderComposerProps {
  scenario: ClinicalScenario | null;
  onScenarioDraftChange: (scenario: ClinicalScenario | null) => void;
  onEvaluate: (scenario: ClinicalScenario) => void;
  isEvaluating: boolean;
  evaluationStep: number;
  showEmptyState: boolean;
  onLoadExample: () => void;
  onStartNew: () => void;
}

/**
 * Center panel — keyboard-first order composer with large comboboxes.
 */
export function OrderComposer({
  scenario,
  onScenarioDraftChange,
  onEvaluate,
  isEvaluating,
  evaluationStep,
  showEmptyState,
  onLoadExample,
  onStartNew,
}: OrderComposerProps) {
  const [age, setAge] = React.useState("");
  const [sex, setSex] = React.useState<"male" | "female" | "">("");
  const [chiefComplaint, setChiefComplaint] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [clinicalHistory, setClinicalHistory] = React.useState("");
  const [symptoms, setSymptoms] = React.useState("");
  const [redFlags, setRedFlags] = React.useState<Record<string, boolean>>(
    Object.fromEntries(RED_FLAG_LABELS.map((l) => [l, false])),
  );
  const [contrastAllergy, setContrastAllergy] = React.useState(false);
  const [egfr, setEgfr] = React.useState("");
  const [renalImpairment, setRenalImpairment] = React.useState(false);
  const [modality, setModality] = React.useState<string>("MRI");
  const [bodyPart, setBodyPart] = React.useState("");
  const [clinicalIndication, setClinicalIndication] = React.useState("");
  const [urgency, setUrgency] = React.useState<"routine" | "urgent" | "stat">("routine");
  const [priorImagingExists, setPriorImagingExists] = React.useState(false);
  const [conservativeManagementTried, setConservativeManagementTried] = React.useState(false);
  const [conservativeManagementDuration, setConservativeManagementDuration] = React.useState("");
  const [resolvedAutofillPaths, setResolvedAutofillPaths] = React.useState<Set<string>>(new Set());
  const [errors, setErrors] = React.useState<FormErrors>({});

  const applyScenario = useCallback((next: ClinicalScenario) => {
    setAge(String(next.age));
    setSex(next.sex === "other" ? "male" : next.sex);
    setChiefComplaint(next.chiefComplaint);
    setDuration(next.duration);
    setClinicalHistory(next.clinicalHistory);
    setSymptoms(next.symptoms.join(", "));
    setRedFlags(
      Object.fromEntries(
        RED_FLAG_LABELS.map((label) => [
          label,
          next.redFlags.some((r) => r.flag === label && r.present),
        ]),
      ),
    );
    setContrastAllergy(next.contrastAllergy?.hasAllergy ?? false);
    setEgfr(next.renalFunction?.egfr != null ? String(next.renalFunction.egfr) : "");
    setRenalImpairment(next.renalFunction?.hasImpairment ?? false);
    setModality(next.proposedImaging.modality);
    setBodyPart(next.proposedImaging.bodyPart);
    setClinicalIndication(next.proposedImaging.indication);
    setUrgency(next.proposedImaging.urgency);
    setPriorImagingExists(!!next.priorImaging?.length);
    setErrors({});
  }, []);

  React.useEffect(() => {
    if (!scenario) return;
    const t = window.setTimeout(() => applyScenario(scenario), 0);
    return () => window.clearTimeout(t);
  }, [scenario, applyScenario]);

  const buildDraftScenario = useCallback((): ClinicalScenario | null => {
    if (age.trim() === "" || sex === "" || chiefComplaint.trim() === "") {
      return null;
    }
    const ageNum = Number(age);
    if (Number.isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      return null;
    }
    return {
      patientId: scenario?.patientId ?? "FORM-DRAFT",
      age: ageNum,
      sex: sex as "male" | "female",
      chiefComplaint: chiefComplaint.trim().slice(0, 500),
      clinicalHistory: clinicalHistory.trim().slice(0, 2000),
      symptoms: symptoms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      duration: duration.trim(),
      redFlags: RED_FLAG_LABELS.map((flag) => ({
        flag,
        present: redFlags[flag] ?? false,
      })),
      pregnancyStatus: scenario?.pregnancyStatus,
      contrastAllergy: contrastAllergy
        ? { hasAllergy: true, allergyType: scenario?.contrastAllergy?.allergyType ?? "unknown" }
        : undefined,
      renalFunction:
        egfr.trim() !== "" || renalImpairment
          ? {
              egfr: egfr.trim() !== "" ? Number(egfr) : undefined,
              hasImpairment: renalImpairment,
            }
          : undefined,
      proposedImaging: {
        modality: modality as ImagingModality,
        bodyPart: bodyPart.trim(),
        indication: clinicalIndication.trim(),
        urgency,
      },
      priorImaging: priorImagingExists
        ? [
            {
              modality: modality as ImagingModality,
              bodyPart: bodyPart.trim(),
              date: new Date().toISOString(),
              daysAgo: scenario?.priorImaging?.[0]?.daysAgo ?? 90,
            },
          ]
        : scenario?.priorImaging,
    };
  }, [
    age,
    sex,
    chiefComplaint,
    clinicalHistory,
    symptoms,
    duration,
    redFlags,
    contrastAllergy,
    egfr,
    renalImpairment,
    modality,
    bodyPart,
    clinicalIndication,
    urgency,
    priorImagingExists,
    scenario,
  ]);

  React.useEffect(() => {
    onScenarioDraftChange(buildDraftScenario());
  }, [buildDraftScenario, onScenarioDraftChange]);

  const autofillContext = useMemo(() => {
    const draft = buildDraftScenario();
    if (!draft) return null;
    const snapshot = buildClinDemoRecordSnapshot(draft);
    const factorOverrides = {
      conservativeManagementTried,
      conservativeManagementDuration: conservativeManagementDuration.trim() || undefined,
    };
    const baseInput = clinicalScenarioToAIIEInput(draft, factorOverrides);
    const proposal = proposeAutofill({
      snapshot,
      order: baseInput.order,
      existing: baseInput.clinicalFactors,
    });
    return { snapshot, baseInput, proposal };
  }, [buildDraftScenario, conservativeManagementTried, conservativeManagementDuration]);

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (age.trim() === "" || Number.isNaN(Number(age)) || Number(age) < 0 || Number(age) > 150) {
      next.age = "Required — enter age 0–150";
    }
    if (sex === "") next.sex = "Required";
    if (chiefComplaint.trim() === "") next.chiefComplaint = "Required";
    if (bodyPart.trim() === "") next.bodyPart = "Required";
    if (clinicalIndication.trim() === "") next.clinicalIndication = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [age, sex, chiefComplaint, bodyPart, clinicalIndication]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const redFlagList: RedFlag[] = RED_FLAG_LABELS.map((flag) => ({
        flag,
        present: redFlags[flag] ?? false,
      }));

      const built: ClinicalScenario = {
        patientId: scenario?.patientId ?? `FORM-${Date.now()}`,
        age: Number(age),
        sex: sex as "male" | "female",
        chiefComplaint: chiefComplaint.trim().slice(0, 500),
        clinicalHistory: [
          clinicalHistory.trim(),
          conservativeManagementTried
            ? `Conservative management tried${conservativeManagementDuration.trim() ? `: ${conservativeManagementDuration.trim()}` : ""}.`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
          .slice(0, 2000),
        symptoms: symptoms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        duration: duration.trim(),
        redFlags: redFlagList,
        pregnancyStatus: scenario?.pregnancyStatus,
        proposedImaging: {
          modality: modality as ImagingModality,
          bodyPart: bodyPart.trim(),
          indication: clinicalIndication.trim(),
          urgency,
        },
        priorImaging: priorImagingExists
          ? [
              {
                modality: modality as ImagingModality,
                bodyPart: bodyPart.trim(),
                date: new Date().toISOString(),
                daysAgo: scenario?.priorImaging?.[0]?.daysAgo ?? 90,
              },
            ]
          : scenario?.priorImaging,
      };

      if (contrastAllergy) {
        built.contrastAllergy = {
          hasAllergy: true,
          allergyType: scenario?.contrastAllergy?.allergyType ?? "unknown",
        };
      }
      const egfrNum = egfr.trim() !== "" ? Number(egfr) : undefined;
      if (egfrNum !== undefined || renalImpairment) {
        built.renalFunction = { egfr: egfrNum, hasImpairment: renalImpairment };
      }

      onEvaluate(built);
    },
    [
      validate,
      scenario,
      age,
      sex,
      chiefComplaint,
      clinicalHistory,
      symptoms,
      duration,
      redFlags,
      contrastAllergy,
      egfr,
      renalImpairment,
      modality,
      bodyPart,
      clinicalIndication,
      urgency,
      priorImagingExists,
      conservativeManagementTried,
      conservativeManagementDuration,
      onEvaluate,
    ],
  );

  const applyConfirmedField = useCallback((field: AutofillProposalField) => {
    switch (field.path) {
      case "clinicalFactors.duration":
        setDuration(field.value);
        break;
      case "clinicalFactors.symptoms":
        setSymptoms(field.value);
        break;
      case "clinicalFactors.conservativeManagementTried":
        setConservativeManagementTried(field.value === "true");
        break;
      case "clinicalFactors.conservativeManagementDuration":
        setConservativeManagementDuration(field.value);
        break;
      default:
        break;
    }
    setResolvedAutofillPaths((prev) => new Set(prev).add(field.path));
  }, []);

  if (isEvaluating) {
    return (
      <Card className="flex-1 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-base">Running AIIE evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <EvaluationStepTracker activeStep={evaluationStep} />
        </CardContent>
      </Card>
    );
  }

  if (showEmptyState && !scenario) {
    return (
      <div className="flex-1">
        <ClinEmptyState onLoadExample={onLoadExample} onStartNew={onStartNew} />
      </div>
    );
  }

  return (
    <Card className="flex-1 animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-base">Order composer</CardTitle>
        <p className="text-caption text-arka-slate-500">
          Keyboard-first imaging order entry with inline validation.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="cockpit-age" className="block text-sm font-medium text-arka-slate-800 mb-1">
                Age <span className="text-danger">*</span>
              </label>
              <input
                id="cockpit-age"
                type="number"
                min={0}
                max={150}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                aria-invalid={!!errors.age}
                className="h-10 w-full rounded-radius-md border border-border-subtle bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              />
              {errors.age ? <FieldError id="cockpit-age-error" message={errors.age} className="text-danger" /> : null}
            </div>
            <div>
              <label htmlFor="cockpit-sex" className="block text-sm font-medium text-arka-slate-800 mb-1">
                Sex <span className="text-danger">*</span>
              </label>
              <select
                id="cockpit-sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as "male" | "female" | "")}
                aria-invalid={!!errors.sex}
                className="h-10 w-full rounded-radius-md border border-border-subtle bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              >
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.sex ? <FieldError id="cockpit-sex-error" message={errors.sex} className="text-danger" /> : null}
            </div>
            <div className="col-span-2">
              <label htmlFor="cockpit-complaint" className="block text-sm font-medium text-arka-slate-800 mb-1">
                Chief complaint <span className="text-danger">*</span>
              </label>
              <input
                id="cockpit-complaint"
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                aria-invalid={!!errors.chiefComplaint}
                className="h-10 w-full rounded-radius-md border border-border-subtle bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              />
              {errors.chiefComplaint ? (
                <FieldError id="cockpit-complaint-error" message={errors.chiefComplaint} className="text-danger" />
              ) : null}
            </div>
          </div>

          <DocumentationAssistantCard
            onConfirmDuration={(v) => setDuration(v)}
            onConfirmSymptoms={(ids) =>
              setSymptoms((prev) => [...new Set([...prev.split(",").map((s) => s.trim()).filter(Boolean), ...ids])].join(", "))
            }
            onConfirmRedFlag={(_flag: keyof AIIERedFlags, demoLabel: string) =>
              setRedFlags((prev) => ({ ...prev, [demoLabel]: true }))
            }
            onConfirmConservativeTried={setConservativeManagementTried}
            onConfirmConservativeDuration={setConservativeManagementDuration}
            onAuditNote={(text) =>
              setClinicalHistory((prev) => (prev.includes(text) ? prev : `${prev.trim()}\n\n${text}`.trim().slice(0, 2000)))
            }
          />

          <div className="space-y-4 rounded-radius-lg border border-border-subtle bg-surface-sunken/40 p-4">
            <p className="text-sm font-semibold text-arka-slate-900">Imaging order</p>
            <ClinCombobox
              id="cockpit-modality"
              label="Modality"
              value={modality}
              onChange={setModality}
              options={IMAGING_MODALITIES.map((m) => ({ value: m }))}
              required
              allowCustom={false}
            />
            <ClinCombobox
              id="cockpit-body-part"
              label="Body part"
              value={bodyPart}
              onChange={setBodyPart}
              options={BODY_PART_OPTIONS}
              required
              error={errors.bodyPart}
            />
            <ClinCombobox
              id="cockpit-indication"
              label="Clinical indication"
              value={clinicalIndication}
              onChange={setClinicalIndication}
              options={INDICATION_OPTIONS}
              required
              error={errors.clinicalIndication}
            />
            <div>
              <label htmlFor="cockpit-urgency" className="block text-sm font-medium text-arka-slate-800 mb-1">
                Urgency
              </label>
              <select
                id="cockpit-urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as "routine" | "urgent" | "stat")}
                className="h-10 w-full rounded-radius-md border border-border-subtle bg-surface px-3 text-sm"
              >
                {URGENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {autofillContext && autofillContext.proposal.fields.length > 0 ? (
            <RequisitionAutofillCard
              proposal={autofillContext.proposal}
              baseInput={autofillContext.baseInput}
              onConfirmField={applyConfirmedField}
              onRejectField={(path) => setResolvedAutofillPaths((prev) => new Set(prev).add(path))}
              resolvedPaths={resolvedAutofillPaths}
            />
          ) : null}

          {autofillContext && isSwallowStudyOrder(autofillContext.baseInput.order.procedure) ? (
            <SwallowTriageCard
              snapshot={autofillContext.snapshot}
              order={autofillContext.baseInput.order}
              complaint={`${chiefComplaint} ${clinicalHistory}`.trim()}
              patientHash={autofillContext.snapshot.patientHash}
              onUseFeesBedside={() => {
                setBodyPart("FEES bedside");
                setClinicalIndication((prev) =>
                  prev.toLowerCase().includes("fees") ? prev : `Fiberoptic endoscopic evaluation of swallowing — ${prev}`.trim(),
                );
              }}
            />
          ) : null}

          <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
            Evaluate appropriateness
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
