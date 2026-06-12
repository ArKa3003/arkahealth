"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { Menu } from "lucide-react";

import { ArkaAnimatedLogo } from "@/components/ArkaAnimatedLogo";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/constants";
import { AuthNavActions } from "@/components/auth/AuthNavActions";
import { DEMO_BOOKING_MAILTO } from "@/lib/navigation/routes";
import {
  isNavItemActive,
  NAV_HEADER_CLASSES,
  navItemClasses,
  navLabelClasses,
  navMenuButtonClasses,
  navUnderlineClasses,
  resolveNavAppearance,
  type NavAppearance,
} from "@/lib/navigation/nav-appearance";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { PhasesMegaMenu } from "./PhasesMegaMenu";

/** Stable logo instance — same component, props, size, and animation as before. */
const NavLogo = (
  <Link
    href={routes.home}
    className="group flex shrink-0 items-center no-underline"
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

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  appearance: NavAppearance;
  active: boolean;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  motionIndex?: number;
};

function NavLink({ href, children, appearance, active, onClick, motionIndex = 0 }: NavLinkProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.li
      initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { delay: motionIndex * 0.06, duration: 0.35, ease: "easeOut" }
      }
    >
      <Link
        href={href}
        prefetch
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={navItemClasses(appearance, active)}
      >
        <span className={navLabelClasses()}>{children}</span>
        <span className={navUnderlineClasses(active)} aria-hidden />
      </Link>
    </motion.li>
  );
}

/**
 * Global sticky header — overlay over dark hero, solid on scroll or light pages.
 */
export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const appearance = resolveNavAppearance(pathname, scrolled);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 16);
  });

  const handlePlatformClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (pathname === routes.home) {
        event.preventDefault();
        document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push("/#platform");
      }
    },
    [pathname, router],
  );

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 safe-area-top pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
          "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200 motion-reduce:transition-none",
          NAV_HEADER_CLASSES[appearance],
        )}
      >
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
          aria-label="Main"
        >
          <div className="flex min-w-0 shrink-0 items-center">{NavLogo}</div>

          <ul className="hidden items-center gap-0.5 lg:flex">
            <NavLink
              href="/#platform"
              appearance={appearance}
              active={isNavItemActive("platform", pathname)}
              onClick={handlePlatformClick}
              motionIndex={0}
            >
              Platform
            </NavLink>
            <motion.li
              initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { delay: 0.06, duration: 0.35, ease: "easeOut" }
              }
            >
              <PhasesMegaMenu
                appearance={appearance}
                active={isNavItemActive("phases", pathname)}
              />
            </motion.li>
            <NavLink
              href={routes.evidence}
              appearance={appearance}
              active={isNavItemActive("evidence", pathname)}
              motionIndex={2}
            >
              Evidence
            </NavLink>
            <NavLink
              href={routes.roi}
              appearance={appearance}
              active={isNavItemActive("roi", pathname)}
              motionIndex={3}
            >
              ROI
            </NavLink>
            <NavLink
              href={routes.security}
              appearance={appearance}
              active={isNavItemActive("security", pathname)}
              motionIndex={4}
            >
              Security
            </NavLink>
            <NavLink
              href={routes.featureCatalog}
              appearance={appearance}
              active={isNavItemActive("docs", pathname)}
              motionIndex={5}
            >
              Docs
            </NavLink>
          </ul>

          <div className="flex shrink-0 items-center gap-2">
            <AuthNavActions appearance={appearance} motionDelay={0.3} />
            <motion.a
              href={DEMO_BOOKING_MAILTO}
              initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { delay: 0.36, duration: 0.35, ease: "easeOut" }
              }
              className={cn(
                buttonVariants({ variant: "premium", size: "md" }),
                "hidden min-h-[44px] touch-manipulation text-base sm:inline-flex",
              )}
            >
              Book a demo
            </motion.a>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={cn("lg:hidden", navMenuButtonClasses(appearance))}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenuSheet open={mobileOpen} onOpenChange={setMobileOpen} />
    </>
  );
}
