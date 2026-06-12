"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, GraduationCap, Shield, Sparkles, Stethoscope, TreePine } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  navItemClasses,
  navLabelClasses,
  navUnderlineClasses,
  type NavAppearance,
} from "@/lib/navigation/nav-appearance";
import { phaseNavItems } from "@/lib/navigation/routes";

const phaseIcons = {
  clin: Stethoscope,
  ed: GraduationCap,
  ins: Shield,
  rural: TreePine,
} as const;

type PhasesMegaMenuProps = {
  appearance: NavAppearance;
  active?: boolean;
};

/**
 * Radix popover mega-menu for ARKA phase pillars (2-column grid).
 */
export function PhasesMegaMenu({ appearance, active = false }: PhasesMegaMenuProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-current={active ? "page" : undefined}
          className={navItemClasses(appearance, active || open)}
        >
          <span className={navLabelClasses()}>
            Phases
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
              aria-hidden
            />
          </span>
          <span className={navUnderlineClasses(active || open)} aria-hidden />
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
        <div className="mt-2 border-t border-border-subtle pt-2">
          <Link
            href="/#aiie"
            prefetch
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-[44px] items-center gap-2 rounded-radius-md px-2.5 py-2 text-sm font-medium text-arka-teal-700 transition-colors",
              "hover:bg-arka-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500",
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            AIIE Technology
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
