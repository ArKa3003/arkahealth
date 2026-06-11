"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { Menu } from "lucide-react";

import { ArkaAnimatedLogo } from "@/components/ArkaAnimatedLogo";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/constants";
import {
  DEMO_BOOKING_MAILTO,
  isLightTopPage,
  SIGN_IN_MAILTO,
} from "@/lib/navigation/routes";
import { useEvidenceModalOptional } from "@/components/shared/compliance/evidence-modal-context";
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
  inverted: boolean;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

function NavLink({ href, children, inverted, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      prefetch
      onClick={onClick}
      className={cn(
        "rounded-radius-sm px-2 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
        inverted
          ? "text-white/90 hover:bg-white/10 hover:text-white"
          : "text-arka-slate-700 hover:bg-arka-slate-100 hover:text-arka-slate-900",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Global sticky header — transparent over dark hero, solid on scroll or light pages.
 */
export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const evidenceModal = useEvidenceModalOptional();

  const lightTop = isLightTopPage(pathname);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 16);
  });

  const isSolid = lightTop || scrolled;
  const inverted = !isSolid;

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
          "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200",
          isSolid
            ? "border-b border-border-subtle bg-white/80 shadow-elevation-1 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
          aria-label="Main"
        >
          <div className="flex min-w-0 shrink-0 items-center">{NavLogo}</div>

          <ul className="hidden items-center gap-1 lg:flex">
            <li>
              <NavLink href="/#platform" inverted={inverted} onClick={handlePlatformClick}>
                Platform
              </NavLink>
            </li>
            <li>
              <PhasesMegaMenu inverted={inverted} />
            </li>
            <li>
              <button
                type="button"
                onClick={() => evidenceModal?.setOpen(true)}
                className={cn(
                  "rounded-radius-sm px-2 py-1.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
                  inverted
                    ? "text-white/90 hover:bg-white/10 hover:text-white"
                    : "text-arka-slate-700 hover:bg-arka-slate-100 hover:text-arka-slate-900",
                )}
              >
                Evidence
              </button>
            </li>
            <li>
              <NavLink href={routes.roi} inverted={inverted}>
                ROI
              </NavLink>
            </li>
            <li>
              <NavLink href={routes.featureCatalog} inverted={inverted}>
                Docs
              </NavLink>
            </li>
          </ul>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={SIGN_IN_MAILTO}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden sm:inline-flex",
                inverted && "text-white/90 hover:bg-white/10 hover:text-white",
              )}
            >
              Sign in
            </a>
            <a
              href={DEMO_BOOKING_MAILTO}
              className={cn(buttonVariants({ variant: "premium", size: "sm" }), "hidden sm:inline-flex")}
            >
              Book a demo
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-radius-md lg:hidden",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
                inverted
                  ? "text-white hover:bg-white/10"
                  : "text-arka-slate-700 hover:bg-arka-slate-100",
              )}
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
