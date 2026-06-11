"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, GraduationCap, Shield, Stethoscope, TreePine } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { phaseNavItems } from "@/lib/navigation/routes";

const phaseIcons = {
  clin: Stethoscope,
  ed: GraduationCap,
  ins: Shield,
  rural: TreePine,
} as const;

type PhasesMegaMenuProps = {
  /** Light text when header is transparent over dark hero. */
  inverted?: boolean;
};

/**
 * Radix popover mega-menu for ARKA phase pillars (2-column grid).
 */
export function PhasesMegaMenu({ inverted = false }: PhasesMegaMenuProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-radius-sm px-2 py-1.5 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
            inverted
              ? "text-white/90 hover:text-white hover:bg-white/10"
              : "text-arka-slate-700 hover:text-arka-slate-900 hover:bg-arka-slate-100",
          )}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          Phases
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={12}
        className="w-[min(calc(100vw-2rem),520px)] p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-arka-slate-500">
          ARKA phases
        </p>
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {phaseNavItems.map((phase) => {
            const Icon = phaseIcons[phase.id as keyof typeof phaseIcons];
            return (
              <li key={phase.id}>
                <Link
                  href={phase.href}
                  prefetch
                  onMouseEnter={() => router.prefetch(phase.href)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex gap-3 rounded-radius-md p-2.5 transition-colors",
                    "hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-radius-md bg-arka-teal-50 text-arka-teal-600">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-arka-slate-900">
                      {phase.name}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-arka-slate-500">
                      {phase.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
