"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { RURAL_NAV_ITEMS, ruralRoutes } from "@/lib/demos/rural/constants";
import { routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function RuralSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-56 shrink-0 border-r border-arka-primary/15 bg-white/90 backdrop-blur md:flex md:flex-col"
      aria-label="Rural platform navigation"
    >
      <div className="border-b border-arka-primary/10 px-3 py-4">
        <Link
          href={routes.home}
          className="text-xs font-medium uppercase tracking-wide text-arka-text-dark-muted hover:text-arka-teal"
        >
          ← ARKA Home
        </Link>
        <p className="mt-2 font-heading text-sm font-semibold text-arka-text-dark">Rural Imaging Crisis</p>
        <p className="mt-0.5 text-xs text-arka-text-dark-muted">Demo navigation</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {RURAL_NAV_ITEMS.map(({ href, shortLabel, icon: Icon }) => {
            const isHub = href === ruralRoutes.hub;
            const isActive = isHub ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex min-h-[44px] items-center gap-2 rounded-lg px-2 py-2 text-sm transition",
                    isActive
                      ? "bg-arka-teal/10 font-medium text-arka-teal"
                      : "text-arka-text-dark-muted hover:bg-arka-primary/5 hover:text-arka-text-dark"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{shortLabel}</span>
                  <ChevronRight
                    className={cn("h-4 w-4 shrink-0 opacity-0 transition", isActive && "opacity-60")}
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
