"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArkaAnimatedLogo } from "@/components/ArkaAnimatedLogo";
import { complianceLinks, demoNavLinks, routes } from "@/lib/constants";
import { RURAL_NAV_LINKS } from "@/lib/demos/rural/constants";
import {
  Stethoscope,
  GraduationCap,
  Shield,
  TreePine,
  Radio,
  DollarSign,
  Network,
  Brain,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  LayoutGrid,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  Stethoscope,
  GraduationCap,
  Shield,
  TreePine,
  Network,
} as const;

/** Seven strategic pillars (excludes rural hub). */
const RURAL_PILLAR_LINKS = RURAL_NAV_LINKS.slice(1);

const ruralPillarIconMap = {
  Stethoscope,
  Radio,
  GraduationCap,
  DollarSign,
  Network,
  Brain,
  BarChart3,
} as const;

const DEMO_PATHS = [
  routes.clinSuite,
  routes.clin,
  routes.ed,
  routes.ins,
  routes.rural,
  routes.cdsHooksDemo,
] as const;
const pathToLabel: Record<string, string> = {
  [routes.clinSuite]: "ARKA-CLIN Suite",
  [routes.clin]: "ARKA-CLIN",
  [routes.ed]: "ARKA-ED",
  [routes.ins]: "ARKA-INS",
  [routes.rural]: "Rural Platform",
  [routes.cdsHooksDemo]: "CDS Hooks Demo",
};

/** Stable logo instance — avoids re-mounting (and replaying entrance) on route changes. */
const NavLogo = (
  <Link
    href={routes.home}
    className="group flex shrink-0 items-center text-arka-text no-underline"
    aria-label="ARKA Health — Home"
  >
    <span className="block h-10 w-10 sm:h-11 sm:w-11 [&_svg]:h-full [&_svg]:w-full">
      <ArkaAnimatedLogo
        width={120}
        height={135}
        animate={true}
        idleAnimations={true}
        className="h-full w-full cursor-pointer"
      />
    </span>
  </Link>
);

function NavLinkWithHoverUnderline({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch
      onClick={onClick}
      className="group relative flex items-center gap-2 py-1"
    >
      <Icon className="h-4 w-4 shrink-0 text-arka-text-soft transition-colors group-hover:text-arka-cyan" />
      <span className="relative text-sm font-medium text-arka-text-muted transition-colors group-hover:text-arka-text">
        {label}
        <span
          className={`absolute -bottom-0.5 left-0 h-0.5 transition-all duration-200 ${
            isActive ? "w-full bg-arka-cyan" : "w-0 bg-arka-cyan group-hover:w-full"
          }`}
        />
      </span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const isDemoPage = DEMO_PATHS.some((p) => pathname.startsWith(p));
  const currentDemo = isDemoPage
    ? DEMO_PATHS.find((p) => pathname.startsWith(p))
    : null;
  const otherDemos = currentDemo
    ? demoNavLinks.filter((l) => l.href !== currentDemo)
    : [];
  const isRuralDemo = pathname.startsWith(routes.rural);

  const handleEcosystemClick = useCallback(() => {
    if (pathname === routes.home) {
      const el = document.getElementById("ecosystem");
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#ecosystem");
    }
  }, [pathname, router]);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 8);
        lastScrollY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 safe-area-top pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] transition-all duration-200 ${
          scrolled
            ? "border-b border-arka-navy/10 bg-arka-navy/95 shadow-md backdrop-blur-md"
            : "border-b border-white/10 bg-arka-navy/90 backdrop-blur-xl"
        }`}
      >
        <nav className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left */}
          <div className="flex min-w-0 flex-1 items-center gap-4 lg:flex-initial">
            {isDemoPage && currentDemo ? (
              <>
                {NavLogo}
                <span className="truncate font-semibold text-arka-text">
                  {pathToLabel[currentDemo]}
                </span>
                <div className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-sm text-arka-text-soft transition hover:bg-white/5 hover:text-arka-cyan"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    Other demos
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full z-50 mt-1 min-w-[220px] max-h-[min(70vh,520px)] overflow-y-auto rounded-lg border border-white/10 bg-arka-bg-medium/95 py-1 shadow-xl backdrop-blur-xl"
                      >
                        {otherDemos.map(({ href, label, icon }) => {
                          const Icon = iconMap[icon];
                          return (
                            <li key={href} onMouseEnter={() => router.prefetch(href)}>
                              <Link
                                href={href}
                                prefetch
                                className="flex items-center gap-2 px-3 py-2 text-sm text-arka-text-muted transition hover:bg-white/5 hover:text-arka-cyan"
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                {label}
                              </Link>
                            </li>
                          );
                        })}
                        {isRuralDemo && (
                          <>
                            <li
                              className="mx-2 my-1 border-t border-white/10 pt-2"
                              role="presentation"
                            />
                            <li className="px-3 pb-1 pt-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-arka-text-soft">
                                Rural pillars
                              </span>
                            </li>
                            {RURAL_PILLAR_LINKS.map(({ href, label, icon }) => {
                              const Icon =
                                ruralPillarIconMap[
                                  icon as keyof typeof ruralPillarIconMap
                                ];
                              const active = pathname === href;
                              return (
                                <li key={href} onMouseEnter={() => router.prefetch(href)}>
                                  <Link
                                    href={href}
                                    prefetch
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm transition hover:bg-white/5 hover:text-arka-cyan ${
                                      active
                                        ? "text-arka-cyan"
                                        : "text-arka-text-muted"
                                    }`}
                                  >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span className="leading-snug">{label}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </>
                        )}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              NavLogo
            )}
          </div>

          {/* Center — desktop nav links (only on landing) */}
          {!isDemoPage && (
            <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 lg:flex">
              {demoNavLinks.map(({ href, label, icon }) => {
                const Icon = iconMap[icon];
                const isActive = pathname === href;
                return (
                  <li key={href}>
                    <NavLinkWithHoverUnderline
                      href={href}
                      label={label}
                      icon={Icon}
                      isActive={isActive}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {/* Right — mobile menu trigger only */}
          <div className="flex items-center justify-end lg:flex-initial">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-arka-text-muted transition hover:text-arka-cyan active:text-arka-cyan lg:hidden touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile overlay */}
      {/* Full-screen mobile overlay: smooth open/close, touch-friendly */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-0 z-[60] bg-arka-bg-dark/98 backdrop-blur-xl lg:hidden safe-area-insets"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="pointer-events-none fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 lg:hidden safe-area-insets"
              aria-modal="true"
              role="dialog"
              aria-label="Mobile menu"
            >
              <div className="pointer-events-auto flex flex-col items-center gap-6">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-arka-text-muted transition hover:bg-white/5 hover:text-arka-cyan active:bg-white/10 touch-manipulation"
                  aria-label="Close menu"
                >
                  <X className="h-7 w-7" aria-hidden />
                </button>
                <ul className="flex max-h-[min(75vh,560px)] flex-col items-center gap-1 overflow-y-auto">
                  {demoNavLinks.map(({ href, label, icon }) => {
                    const Icon = iconMap[icon];
                    const isActive = pathname === href;
                    return (
                      <li key={href} className="w-full max-w-[280px]">
                        <Link
                          href={href}
                          prefetch
                          onClick={() => setMobileOpen(false)}
                          className={`flex min-h-[44px] w-full items-center justify-center gap-3 rounded-xl px-6 py-3 text-lg font-medium transition active:bg-white/5 touch-manipulation ${
                            isActive ? "text-arka-cyan" : "text-arka-text-muted hover:text-arka-cyan"
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" aria-hidden />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                  {isRuralDemo && (
                    <>
                      <li className="my-2 w-full max-w-[280px] border-t border-white/10 pt-4" role="presentation" />
                      <li className="mb-1 w-full max-w-[280px] text-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-arka-text-soft">
                          Rural pillars
                        </span>
                      </li>
                      {RURAL_PILLAR_LINKS.map(({ href, label, icon }) => {
                        const Icon =
                          ruralPillarIconMap[
                            icon as keyof typeof ruralPillarIconMap
                          ];
                        const isActive = pathname === href;
                        return (
                          <li key={href} className="w-full max-w-[280px]">
                            <Link
                              href={href}
                              prefetch
                              onClick={() => setMobileOpen(false)}
                              className={`flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-base font-medium transition active:bg-white/5 touch-manipulation ${
                                isActive
                                  ? "text-arka-cyan"
                                  : "text-arka-text-muted hover:text-arka-cyan"
                              }`}
                            >
                              <Icon className="h-4 w-4 shrink-0" aria-hidden />
                              <span className="text-center leading-snug">{label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </>
                  )}
                  <li className="w-full max-w-[280px]">
                    <button
                      type="button"
                      onClick={() => {
                        handleEcosystemClick();
                        setMobileOpen(false);
                      }}
                      className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-xl px-6 py-3 text-lg font-medium text-arka-text-muted transition hover:text-arka-cyan active:bg-white/5 touch-manipulation"
                    >
                      <LayoutGrid className="h-5 w-5 shrink-0" aria-hidden />
                      Ecosystem Overview
                    </button>
                  </li>
                  <li className="my-2 w-full max-w-[280px] border-t border-white/10 pt-4" role="presentation" />
                  <li className="mb-1 w-full max-w-[280px] text-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-arka-text-soft">
                      Compliance &amp; Validation
                    </span>
                  </li>
                  {complianceLinks.map((link) => {
                    const { href, label } = link;
                    const external = "external" in link && link.external === true;
                    const isActive = !external && pathname === href;
                    const linkClassName = `flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-base font-medium transition active:bg-white/5 touch-manipulation ${
                      isActive ? "text-arka-cyan" : "text-arka-text-muted hover:text-arka-cyan"
                    }`;
                    return (
                      <li key={href} className="w-full max-w-[280px]">
                        {external ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileOpen(false)}
                            className={linkClassName}
                          >
                            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="inline-flex items-center gap-1 text-center leading-snug">
                              {label}
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            </span>
                          </a>
                        ) : (
                          <Link
                            href={href}
                            prefetch
                            onClick={() => setMobileOpen(false)}
                            className={linkClassName}
                          >
                            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="text-center leading-snug">{label}</span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
