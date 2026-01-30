"use client";

import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";

interface FieldErrorProps {
  id: string;
  message: string;
  className?: string;
}

export function FieldError({ id, message, className }: FieldErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={clsx(
        "mt-1 flex items-start gap-1.5 text-[13px] leading-snug text-red-300",
        className
      )}
    >
      <AlertCircle
        className="mt-0.5 h-4 w-4 flex-shrink-0"
        aria-hidden
      />
      <span>{message}</span>
    </div>
  );
}
