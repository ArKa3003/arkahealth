"use client";

import { clsx } from "clsx";
import { User } from "lucide-react";
import type { PatientSex } from "@/lib/demos/ed/types";

interface PatientCardProps {
  age: number;
  sex: PatientSex;
  chiefComplaint: string;
  className?: string;
}

export function PatientCard({
  age,
  sex,
  chiefComplaint,
  className,
}: PatientCardProps) {
  const sexLabel = sex === "male" ? "male" : "female";

  return (
    <div className={clsx("flex items-start gap-4", className)}>
      <div
        className={clsx(
          "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0",
          sex === "male" ? "bg-arka-cyan/20" : "bg-arka-primary/20"
        )}
      >
        <User
          className={clsx(
            "w-7 h-7",
            sex === "male" ? "text-arka-cyan" : "text-arka-primary"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-semibold text-arka-text">
          {age}-year-old {sexLabel}
        </p>
        <p className="mt-2 text-arka-text-muted italic leading-relaxed">
          &ldquo;{chiefComplaint}&rdquo;
        </p>
      </div>
    </div>
  );
}
