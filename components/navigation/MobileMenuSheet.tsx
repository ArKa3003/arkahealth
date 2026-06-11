"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  FileText,
  GraduationCap,
  LayoutGrid,
  Shield,
  Stethoscope,
  TreePine,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DEMO_BOOKING_MAILTO,
  phaseNavItems,
  SIGN_IN_MAILTO,
} from "@/lib/navigation/routes";
import { routes } from "@/lib/constants";
import { useEvidenceModalOptional } from "@/components/shared/compliance/evidence-modal-context";

const phaseIcons = {
  clin: Stethoscope,
  ed: GraduationCap,
  ins: Shield,
  rural: TreePine,
} as const;

type MobileMenuSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const secondaryLinks = [
  { href: "/#platform", label: "Platform", icon: LayoutGrid },
  { href: routes.roi, label: "ROI", icon: BookOpen },
  { href: routes.featureCatalog, label: "Docs", icon: FileText },
] as const;

/**
 * Full-screen mobile navigation with focus trap, scroll lock, and staggered entry.
 */
export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const evidenceModal = useEvidenceModalOptional();

  React.useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  const stagger = (index: number) =>
    prefersReducedMotion
      ? { duration: 0 }
      : { delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-arka-slate-950/60 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:opacity-0 lg:hidden" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-[90] flex flex-col bg-surface-dark text-white outline-none lg:hidden",
            "data-[state=open]:animate-fade-in data-[state=closed]:opacity-0",
            "safe-area-insets",
          )}
          aria-label="Mobile navigation"
        >
          <div className="bg-grain pointer-events-none absolute inset-0 opacity-30" aria-hidden />

          <div className="relative flex items-center justify-between px-4 py-4">
            <DialogPrimitive.Title className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Menu
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="inline-flex h-10 w-10 items-center justify-center rounded-radius-md text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <nav className="relative flex-1 overflow-y-auto px-4 pb-8">
            <ul className="space-y-1">
              {secondaryLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.li
                    key={link.href}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={stagger(index)}
                  >
                    <Link
                      href={link.href}
                      prefetch
                      className="flex min-h-[44px] items-center gap-3 rounded-radius-md px-3 py-2 text-base font-medium text-white/90 hover:bg-white/10"
                      onClick={() => onOpenChange(false)}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-arka-teal-300" aria-hidden />
                      {link.label}
                    </Link>
                  </motion.li>
                );
              })}

              <motion.li
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={stagger(secondaryLinks.length)}
              >
                <button
                  type="button"
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-radius-md px-3 py-2 text-left text-base font-medium text-white/90 hover:bg-white/10"
                  onClick={() => {
                    evidenceModal?.setOpen(true);
                    onOpenChange(false);
                  }}
                >
                  <Shield className="h-5 w-5 shrink-0 text-arka-teal-300" aria-hidden />
                  Evidence
                </button>
              </motion.li>
            </ul>

            <p className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wider text-white/50">
              Phases
            </p>
            <ul className="space-y-1">
              {phaseNavItems.map((phase, index) => {
                const Icon = phaseIcons[phase.id as keyof typeof phaseIcons];
                const itemIndex = secondaryLinks.length + 1 + index;
                return (
                  <motion.li
                    key={phase.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={stagger(itemIndex)}
                  >
                    <Link
                      href={phase.href}
                      prefetch
                      onMouseEnter={() => router.prefetch(phase.href)}
                      onClick={() => onOpenChange(false)}
                      className="flex min-h-[44px] items-center gap-3 rounded-radius-md px-3 py-2 hover:bg-white/10"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-radius-md bg-arka-teal-50/10 text-arka-teal-300">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">{phase.name}</span>
                        <span className="block text-xs text-white/60">{phase.description}</span>
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          <div className="relative border-t border-white/10 px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={SIGN_IN_MAILTO}
                className="inline-flex h-11 w-full items-center justify-center rounded-radius-md px-6 text-base font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-slate-900"
              >
                Sign in
              </a>
              <a
                href={DEMO_BOOKING_MAILTO}
                className="inline-flex h-11 w-full items-center justify-center rounded-radius-md bg-arka-slate-900 px-6 text-base font-medium text-white shadow-elevation-1 hover:shadow-elevation-2 hover:shadow-glow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-slate-900"
              >
                Book a demo
              </a>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
