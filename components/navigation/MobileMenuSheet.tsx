"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  FileSearch,
  FileText,
  GraduationCap,
  LayoutGrid,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TreePine,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/lib/navigation/nav-appearance";
import {
  DEMO_BOOKING_MAILTO,
  phaseNavItems,
} from "@/lib/navigation/routes";
import { routes } from "@/lib/constants";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { buttonVariants } from "@/components/ui/Button";

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
  { id: "platform" as const, href: "/#platform", label: "Platform", icon: LayoutGrid },
  { id: "aiie" as const, href: "/#aiie", label: "AIIE Technology", icon: Sparkles },
  { id: "evidence" as const, href: routes.evidence, label: "Evidence", icon: FileSearch },
  { id: "roi" as const, href: routes.roi, label: "ROI", icon: BookOpen },
  { id: "security" as const, href: routes.security, label: "Security", icon: ShieldCheck },
  { id: "docs" as const, href: routes.featureCatalog, label: "Docs", icon: FileText },
] as const;

function mobileNavLinkClasses(active: boolean): string {
  return cn(
    "group relative flex min-h-[44px] touch-manipulation items-center gap-3 rounded-radius-md px-3 py-2",
    "text-base font-semibold tracking-tight transition-colors duration-200 motion-reduce:transition-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500",
    active ? "text-arka-teal-300" : "text-white/90 hover:bg-white/10 hover:text-white",
  );
}

/**
 * Full-screen mobile navigation with focus trap, scroll lock, and staggered entry.
 */
export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { user, signOut } = useAuthSession();
  const [signingOut, setSigningOut] = React.useState(false);

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
            <DialogPrimitive.Title className="text-base font-semibold uppercase tracking-wider text-white/80">
              Menu
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-radius-md text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <nav className="relative flex-1 overflow-y-auto px-4 pb-8">
            <ul className="space-y-1">
              {secondaryLinks.map((link, index) => {
                const Icon = link.icon;
                const active = isNavItemActive(link.id, pathname);
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
                      aria-current={active ? "page" : undefined}
                      className={mobileNavLinkClasses(active)}
                      onClick={() => onOpenChange(false)}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-arka-teal-300" aria-hidden />
                      <span className="relative inline-flex items-center">
                        {link.label}
                        <span
                          className={cn(
                            "absolute -bottom-0.5 left-0 h-0.5 w-full origin-left bg-arka-teal-400 transition-transform duration-200 motion-reduce:transition-none",
                            active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                          )}
                          aria-hidden
                        />
                      </span>
                    </Link>
                  </motion.li>
                );
              })}

            </ul>

            <p className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wider text-white/50">
              Phases
            </p>
            <ul className="space-y-1">
              {phaseNavItems.map((phase, index) => {
                const Icon = phaseIcons[phase.id as keyof typeof phaseIcons];
                const itemIndex = secondaryLinks.length + 1 + index;
                const active = pathname.startsWith(phase.href);
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
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-[44px] touch-manipulation items-center gap-3 rounded-radius-md px-3 py-2 transition-colors duration-200 motion-reduce:transition-none",
                        active ? "bg-white/10" : "hover:bg-white/10",
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-radius-md bg-arka-teal-50/10 text-arka-teal-300">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span>
                        <span
                          className={cn(
                            "block text-base font-semibold tracking-tight",
                            active ? "text-arka-teal-300" : "text-white",
                          )}
                        >
                          {phase.name}
                        </span>
                        <span className="block text-sm text-white/60">{phase.description}</span>
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          <div className="relative border-t border-white/10 px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              {user ? (
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={async () => {
                    setSigningOut(true);
                    try {
                      await signOut();
                      onOpenChange(false);
                    } finally {
                      setSigningOut(false);
                    }
                  }}
                  className="inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-radius-md px-6 text-base font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-slate-900 disabled:opacity-50"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              ) : (
                <Link
                  href={routes.signin}
                  prefetch
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "min-h-[44px] w-full touch-manipulation text-base font-semibold text-white hover:bg-white/10 hover:text-white",
                  )}
                >
                  Sign in
                </Link>
              )}
              <a
                href={DEMO_BOOKING_MAILTO}
                className="inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-radius-md bg-arka-slate-900 px-6 text-base font-semibold text-white shadow-elevation-1 hover:shadow-elevation-2 hover:shadow-glow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-arka-slate-900"
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
