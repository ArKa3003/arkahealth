"use client";

import { useState, useCallback } from "react";
import type { ClinicalScenario, ImagingModality, RedFlag } from "@/lib/demos/clin/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { FieldError } from "./ui/FieldError";

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

interface ClinicalScenarioFormProps {
  onEvaluate: (scenario: ClinicalScenario) => void;
}

interface FormErrors {
  age?: string;
  sex?: string;
  chiefComplaint?: string;
  duration?: string;
  bodyPart?: string;
  clinicalIndication?: string;
}

export function ClinicalScenarioForm({ onEvaluate }: ClinicalScenarioFormProps) {
  const [age, setAge] = useState<string>("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [duration, setDuration] = useState("");
  const [clinicalHistory, setClinicalHistory] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [redFlags, setRedFlags] = useState<Record<string, boolean>>(
    Object.fromEntries(RED_FLAG_LABELS.map((l) => [l, false]))
  );
  const [contrastAllergy, setContrastAllergy] = useState(false);
  const [egfr, setEgfr] = useState<string>("");
  const [renalImpairment, setRenalImpairment] = useState(false);
  const [onAnticoagulation, setOnAnticoagulation] = useState(false);
  const [onMetformin, setOnMetformin] = useState(false);
  const [modality, setModality] = useState<ImagingModality>("MRI");
  const [bodyPart, setBodyPart] = useState("");
  const [clinicalIndication, setClinicalIndication] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [priorImagingExists, setPriorImagingExists] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const toggleRedFlag = useCallback((label: string) => {
    setRedFlags((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (age.trim() === "" || isNaN(Number(age)) || Number(age) < 0 || Number(age) > 150)
      next.age = "This field cannot be empty";
    if (sex === "") next.sex = "This field cannot be empty";
    if (chiefComplaint.trim() === "") next.chiefComplaint = "This field cannot be empty";
    if (duration.trim() === "") next.duration = "This field cannot be empty";
    if (bodyPart.trim() === "") next.bodyPart = "This field cannot be empty";
    if (clinicalIndication.trim() === "") next.clinicalIndication = "This field cannot be empty";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [age, sex, chiefComplaint, duration, bodyPart, clinicalIndication]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const redFlagList: RedFlag[] = RED_FLAG_LABELS.map((flag) => ({
        flag,
        present: redFlags[flag] ?? false,
      }));

      const scenario: ClinicalScenario = {
        patientId: `FORM-${Date.now()}`,
        age: Number(age),
        sex: sex as "male" | "female",
        chiefComplaint: chiefComplaint.trim().slice(0, 500),
        clinicalHistory: clinicalHistory.trim().slice(0, 2000),
        symptoms: symptoms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        duration: duration.trim(),
        redFlags: redFlagList,
        proposedImaging: {
          modality,
          bodyPart: bodyPart.trim(),
          indication: clinicalIndication.trim(),
          urgency,
        },
        priorImaging: priorImagingExists
          ? [
              {
                modality,
                bodyPart: bodyPart.trim(),
                date: new Date().toISOString(),
                daysAgo: 90,
              },
            ]
          : undefined,
      };

      if (contrastAllergy)
        scenario.contrastAllergy = { hasAllergy: true, allergyType: "unknown" };
      const egfrNum = egfr.trim() !== "" ? Number(egfr) : undefined;
      if (egfrNum !== undefined || renalImpairment)
        scenario.renalFunction = {
          egfr: egfrNum,
          hasImpairment: renalImpairment,
        };
      if (onAnticoagulation || onMetformin)
        scenario.medications = {
          onAnticoagulation: onAnticoagulation || undefined,
          onMetformin: onMetformin || undefined,
        };

      onEvaluate(scenario);
    },
    [
      validate,
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
      onAnticoagulation,
      onMetformin,
      modality,
      bodyPart,
      clinicalIndication,
      urgency,
      priorImagingExists,
      onEvaluate,
    ]
  );

  return (
    <Card className="mt-6 sm:mt-8">
      <CardHeader>
        <CardTitle className="text-arka-text-dark">Clinical Scenario Input</CardTitle>
        <p className="text-sm text-arka-text-dark-muted mt-1">
          Enter patient and imaging details to evaluate appropriateness.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clin-age" className="block text-sm font-medium text-arka-text-dark mb-1">
                Age <span className="text-red-600">*</span>
              </label>
              <input
                id="clin-age"
                type="number"
                min={0}
                max={150}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
                aria-required
                aria-invalid={!!errors.age}
              />
              {errors.age && (
                <FieldError id="clin-age-error" message={errors.age} className="text-red-600" />
              )}
            </div>
            <div>
              <label htmlFor="clin-sex" className="block text-sm font-medium text-arka-text-dark mb-1">
                Sex <span className="text-red-600">*</span>
              </label>
              <select
                id="clin-sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as "male" | "female" | "")}
                className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
                aria-required
                aria-invalid={!!errors.sex}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.sex && (
                <FieldError id="clin-sex-error" message={errors.sex} className="text-red-600" />
              )}
            </div>
          </div>

          <div>
            <label htmlFor="clin-complaint" className="block text-sm font-medium text-arka-text-dark mb-1">
              Chief Complaint <span className="text-red-600">*</span>
            </label>
            <input
              id="clin-complaint"
              type="text"
              maxLength={500}
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Lower back pain"
              className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
              aria-required
              aria-invalid={!!errors.chiefComplaint}
            />
            <p className="mt-1 text-xs text-arka-text-dark-soft">{chiefComplaint.length}/500</p>
            {errors.chiefComplaint && (
              <FieldError
                id="clin-complaint-error"
                message={errors.chiefComplaint}
                className="text-red-600"
              />
            )}
          </div>

          <div>
            <label htmlFor="clin-duration" className="block text-sm font-medium text-arka-text-dark mb-1">
              Duration of Symptoms <span className="text-red-600">*</span>
            </label>
            <input
              id="clin-duration"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 3 days, 2 weeks"
              className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
              aria-required
              aria-invalid={!!errors.duration}
            />
            {errors.duration && (
              <FieldError
                id="clin-duration-error"
                message={errors.duration}
                className="text-red-600"
              />
            )}
          </div>

          <div>
            <label htmlFor="clin-history" className="block text-sm font-medium text-arka-text-dark mb-1">
              Clinical History <span className="text-arka-text-dark-soft">(optional)</span>
            </label>
            <textarea
              id="clin-history"
              rows={3}
              maxLength={2000}
              value={clinicalHistory}
              onChange={(e) => setClinicalHistory(e.target.value)}
              placeholder="Relevant medical history, prior workup..."
              className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
            />
            <p className="mt-1 text-xs text-arka-text-dark-soft">{clinicalHistory.length}/2000</p>
          </div>

          <div>
            <label htmlFor="clin-symptoms" className="block text-sm font-medium text-arka-text-dark mb-1">
              Symptoms <span className="text-arka-text-dark-soft">(comma-separated)</span>
            </label>
            <input
              id="clin-symptoms"
              type="text"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. pain, numbness, weakness"
              className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
            />
          </div>

          {/* Red Flags */}
          <div>
            <p className="text-sm font-medium text-arka-text-dark mb-2">Red Flags</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RED_FLAG_LABELS.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-2 cursor-pointer rounded-lg border border-arka-primary/15 px-3 py-2 hover:bg-arka-pale"
                >
                  <input
                    type="checkbox"
                    checked={redFlags[label] ?? false}
                    onChange={() => toggleRedFlag(label)}
                    className="h-4 w-4 rounded border-arka-primary/30 text-arka-teal focus:ring-arka-teal"
                  />
                  <span className="text-sm text-arka-text-dark">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Patient Safety */}
          <div className="space-y-3 rounded-xl border border-arka-primary/15 p-4 bg-arka-bg-alt/50">
            <p className="text-sm font-medium text-arka-text-dark">Patient Safety Factors</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contrastAllergy}
                onChange={(e) => setContrastAllergy(e.target.checked)}
                className="h-4 w-4 rounded border-arka-primary/30 text-arka-teal focus:ring-arka-teal"
              />
              <span className="text-sm text-arka-text-dark">Known contrast allergy</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="clin-egfr" className="text-sm text-arka-text-dark">
                eGFR:
              </label>
              <input
                id="clin-egfr"
                type="number"
                min={0}
                max={200}
                value={egfr}
                onChange={(e) => setEgfr(e.target.value)}
                placeholder="Optional"
                className="arka-input w-24 rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={renalImpairment}
                  onChange={(e) => setRenalImpairment(e.target.checked)}
                  className="h-4 w-4 rounded border-arka-primary/30 text-arka-teal focus:ring-arka-teal"
                />
                <span className="text-sm text-arka-text-dark">Known renal impairment</span>
              </label>
            </div>
          </div>

          {/* Medications */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-arka-text-dark">Relevant Medications</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onAnticoagulation}
                  onChange={(e) => setOnAnticoagulation(e.target.checked)}
                  className="h-4 w-4 rounded border-arka-primary/30 text-arka-teal focus:ring-arka-teal"
                />
                <span className="text-sm text-arka-text-dark">On anticoagulation</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onMetformin}
                  onChange={(e) => setOnMetformin(e.target.checked)}
                  className="h-4 w-4 rounded border-arka-primary/30 text-arka-teal focus:ring-arka-teal"
                />
                <span className="text-sm text-arka-text-dark">On metformin</span>
              </label>
            </div>
          </div>

          {/* Proposed Imaging */}
          <div className="space-y-4 rounded-xl border border-arka-primary/15 p-4 bg-arka-bg-alt/50">
            <p className="text-sm font-medium text-arka-text-dark">Proposed Imaging Order</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="clin-modality" className="block text-sm font-medium text-arka-text-dark mb-1">
                  Imaging Modality
                </label>
                <select
                  id="clin-modality"
                  value={modality}
                  onChange={(e) => setModality(e.target.value as ImagingModality)}
                  className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
                >
                  {IMAGING_MODALITIES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="clin-urgency" className="block text-sm font-medium text-arka-text-dark mb-1">
                  Urgency
                </label>
                <select
                  id="clin-urgency"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as "routine" | "urgent" | "stat")}
                  className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
                >
                  {URGENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="clin-body-part" className="block text-sm font-medium text-arka-text-dark mb-1">
                Body Part <span className="text-red-600">*</span>
              </label>
              <input
                id="clin-body-part"
                type="text"
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                placeholder="e.g. lumbar spine, head"
                className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
                aria-required
                aria-invalid={!!errors.bodyPart}
              />
              {errors.bodyPart && (
                <FieldError
                  id="clin-body-part-error"
                  message={errors.bodyPart}
                  className="text-red-600"
                />
              )}
            </div>
            <div>
              <label htmlFor="clin-indication" className="block text-sm font-medium text-arka-text-dark mb-1">
                Clinical Indication <span className="text-red-600">*</span>
              </label>
              <input
                id="clin-indication"
                type="text"
                value={clinicalIndication}
                onChange={(e) => setClinicalIndication(e.target.value)}
                placeholder="e.g. rule out disc herniation"
                className="arka-input w-full rounded-lg border border-arka-primary/20 bg-white px-3 py-2 text-arka-text-dark"
                aria-required
                aria-invalid={!!errors.clinicalIndication}
              />
              {errors.clinicalIndication && (
                <FieldError
                  id="clin-indication-error"
                  message={errors.clinicalIndication}
                  className="text-red-600"
                />
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={priorImagingExists}
                onChange={(e) => setPriorImagingExists(e.target.checked)}
                className="h-4 w-4 rounded border-arka-primary/30 text-arka-teal focus:ring-arka-teal"
              />
              <span className="text-sm text-arka-text-dark">Prior imaging exists</span>
            </label>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
              Evaluate Appropriateness
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
