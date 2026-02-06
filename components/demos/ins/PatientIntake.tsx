"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User, CreditCard, Building2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/demos/ins/ui/Card";
import { Badge } from "@/components/demos/ins/ui/Badge";
import { Button } from "@/components/demos/ins/ui/Button";
import { useInsDemoStore } from "@/lib/demos/ins/demo-store";
import { patients } from "@/lib/demos/ins/mock-data";
import type { Patient, MedicalHistoryItem } from "@/lib/demos/ins/types";

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function calculateAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getPrimaryDiagnosis(patient: Patient): MedicalHistoryItem | null {
  return patient.medicalHistory.find((h) => h.status === "active") || patient.medicalHistory[0] || null;
}

function isComplexCase(patient: Patient): boolean {
  const active = patient.medicalHistory.filter((h) => h.status === "active" || h.status === "chronic");
  return active.length >= 3;
}

const avatarColors = ["bg-arka-deep", "bg-arka-cyan", "bg-emerald-600"];

function PatientCard({
  patient,
  isSelected,
  onSelect,
  index,
}: {
  patient: Patient;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const age = calculateAge(patient.dateOfBirth);
  const isComplex = isComplexCase(patient);
  const primaryDiagnosis = getPrimaryDiagnosis(patient);
  const color = avatarColors[index % avatarColors.length] ?? "bg-arka-deep";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}>
      <Card
        variant="interactive"
        className={cn(
          "relative cursor-pointer transition-all duration-300",
          isSelected && "border-2 border-arka-deep ring-2 ring-arka-deep/20"
        )}
        onClick={onSelect}
      >
        <AnimatePresence>
          {isSelected && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -top-2 -right-2 z-10">
              <div className="h-6 w-6 rounded-full bg-arka-deep flex items-center justify-center shadow-lg">
                <Check className="h-4 w-4 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {isComplex && (
          <div className="absolute top-3 right-3">
            <Badge status="warning" variant="subtle" size="sm">
              <AlertTriangle className="h-3 w-3 mr-1" /> Complex
            </Badge>
          </div>
        )}
        <CardContent className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className={cn("h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0", color)}>
              {getInitials(patient.firstName, patient.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-lg font-semibold text-slate-900 truncate">
                {patient.firstName} {patient.lastName}
              </h3>
              <p className="text-sm text-slate-800">{age} years old • {patient.gender === "male" ? "Male" : "Female"}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                <CreditCard className="h-3 w-3" />
                <span className="font-mono">{patient.memberId}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-600" />
              <span className="text-sm text-slate-700">{patient.insurancePlan.name}</span>
            </div>
            <Badge status="info" variant="subtle" size="sm">
              {patient.insurancePlan.rbmVendor}
            </Badge>
          </div>
          {primaryDiagnosis && (
            <div className="bg-arka-deep rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-200 mb-1">Primary Diagnosis</p>
              <p className="text-sm font-medium text-white">{primaryDiagnosis.condition}</p>
              <p className="text-xs text-slate-300 font-mono">{primaryDiagnosis.icdCode}</p>
            </div>
          )}
          <Button variant={isSelected ? "success" : "secondary"} size="sm" fullWidth>
            {isSelected ? <><Check className="h-4 w-4 mr-2" /> Selected</> : "Select Patient"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PatientIntake() {
  const { selectedPatientId, setSelectedPatient, completeStep, nextStep } = useInsDemoStore();

  const handleContinue = () => {
    if (selectedPatientId) {
      completeStep(1);
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-slate-900 mb-1">Patient & Payer Selection</h2>
        <p className="text-slate-600 text-sm">Select a patient scenario to run through the utilization management workflow.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {patients.map((patient, i) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            isSelected={selectedPatientId === patient.id}
            onSelect={() => setSelectedPatient(patient.id)}
            index={i}
          />
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleContinue} disabled={!selectedPatientId}>
          Continue to Order Entry
        </Button>
      </div>
    </div>
  );
}
