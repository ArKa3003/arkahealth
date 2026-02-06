"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { demoNavLinks, routes } from "@/lib/constants";
import {
  Stethoscope,
  GraduationCap,
  Shield,
  Menu,
  X,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  Stethoscope,
  GraduationCap,
  Shield,
} as const;

const DEMO_PATHS = [routes.clin, routes.ed, routes.ins] as const;
const pathToLabel: Record<string, string> = {
  [routes.clin]: "ARKA-CLIN",
  [routes.ed]: "ARKA-ED",
  [routes.ins]: "ARKA-INS",
};

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
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left */}
          <div className="flex min-w-0 flex-1 items-center gap-4 lg:flex-initial">
            {isDemoPage && currentDemo ? (
              <>
                <Link
                  href={routes.home}
                  className="flex shrink-0 items-center gap-2 text-arka-text no-underline"
                  aria-label="ARKA Home"
                >
                  <Image
                    src="/arka-icon.svg"
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                    unoptimized
                  />
                </Link>
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
                        className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-white/10 bg-arka-bg-medium/95 py-1 shadow-xl backdrop-blur-xl"
                      >
                        {otherDemos.map(({ href, label, icon }) => {
                          const Icon = iconMap[icon];
                          return (
                            <li key={href}>
                              <Link
                                href={href}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-arka-text-muted transition hover:bg-white/5 hover:text-arka-cyan"
                              >
                                <Icon className="h-4 w-4" />
                                {label}
                              </Link>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                href={routes.home}
                className="flex items-center gap-2 font-semibold text-arka-text no-underline"
                aria-label="ARKA Health – Home"
              >
                <Logo variant="full" size="md" />
              </Link>
            )}
          </div>

          {/* Center — desktop nav links (only on landing) */}
          {!isDemoPage && (
            <ul className="hidden items-center gap-8 lg:flex">
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

          {/* Right */}
          <div className="flex flex-1 items-center justify-end gap-2 lg:flex-initial">
            <button
              type="button"
              onClick={handleEcosystemClick}
              className="hidden items-center gap-2 rounded-lg border border-arka-cyan/40 bg-arka-cyan/5 px-4 py-2 text-sm font-medium text-arka-cyan transition hover:border-arka-cyan/60 hover:bg-arka-cyan/10 sm:flex"
            >
              <LayoutGrid className="h-4 w-4" />
              Ecosystem Overview
            </button>
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
                <ul className="flex flex-col items-center gap-1">
                  {demoNavLinks.map(({ href, label, icon }) => {
                    const Icon = iconMap[icon];
                    const isActive = pathname === href;
                    return (
                      <li key={href} className="w-full max-w-[280px]">
                        <Link
                          href={href}
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
                </ul>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
