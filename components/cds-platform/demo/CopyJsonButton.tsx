"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CopyJsonButtonProps {
  text: string;
  className?: string;
  label?: string;
}

/**
 * Copy-to-clipboard control for JSON blocks and curl examples.
 */
export function CopyJsonButton({ text, className, label = "Copy" }: CopyJsonButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={cn(
          "inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center gap-1.5 rounded-md border border-slate-600 bg-slate-800/90 px-3 text-xs text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500",
          className,
        )}
        aria-label={copied ? "Copied" : label}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-400" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        <span className="sr-only sm:not-sr-only">{copied ? "Copied" : label}</span>
      </button>
      {copied ? (
        <span className="sr-only" role="status" aria-live="polite">
          Copied to clipboard
        </span>
      ) : null}
    </>
  );
}
