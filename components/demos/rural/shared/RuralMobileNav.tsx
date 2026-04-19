"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RURAL_NAV_ITEMS, ruralRoutes } from "@/lib/demos/rural/constants";
import { cn } from "@/lib/utils";

export function RuralMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-14 z-30 -mx-4 flex gap-1 overflow-x-auto border-b border-arka-primary/15 bg-arka-bg-light/95 px-4 py-2 backdrop-blur md:hidden"
      aria-label="Rural sections"
    >
      {RURAL_NAV_ITEMS.map(({ href, shortLabel }) => {
        const isHub = href === ruralRoutes.hub;
        const isActive = isHub ? pathname === href : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
              isActive ? "bg-arka-teal text-white" : "bg-white/80 text-arka-text-dark-muted ring-1 ring-arka-primary/15"
            )}
          >
            {shortLabel}
          </Link>
        );
      })}
    </nav>
  );
}
