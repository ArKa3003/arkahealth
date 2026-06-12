"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";

import { ComplianceBar } from "@/components/shared/ComplianceBar";
import {
  INS_PERSONAS,
  insBreadcrumbs,
  isInsMarketingLanding,
  resolveInsPersona,
} from "@/components/ins/ins-personas";
import { cn } from "@/lib/utils";

export interface InsShellProps {
  children: React.ReactNode;
}

/**
 * ARKA-INS app shell — collapsible sidebar, persona switcher, compliance band, breadcrumbs.
 */
export function InsShell({ children }: InsShellProps) {
  const pathname = usePathname() ?? "";
  const [expanded, setExpanded] = React.useState(true);
  const activePersona = resolveInsPersona(pathname);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1279px)");
    const sync = () => setExpanded(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (isInsMarketingLanding(pathname)) {
    return <>{children}</>;
  }

  const crumbs = insBreadcrumbs(pathname);

  return (
    <div className="flex min-h-full flex-1 bg-surface-sunken">
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border-subtle bg-surface transition-[width] duration-200",
          expanded ? "w-56 xl:w-60" : "w-[4.25rem]",
        )}
        aria-label="ARKA-INS navigation"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-3">
          {expanded ? (
            <Link href="/ins" className="text-sm font-semibold text-arka-slate-900 hover:text-arka-teal-700">
              ARKA-INS
            </Link>
          ) : (
            <Link
              href="/ins"
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-radius-md bg-arka-teal-50 text-xs font-bold text-arka-teal-700"
              title="ARKA-INS"
            >
              IN
            </Link>
          )}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-radius-md text-arka-slate-500 hover:bg-surface-sunken hover:text-arka-slate-900",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500",
              !expanded && "mx-auto",
            )}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Persona switcher">
          {INS_PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const active = activePersona === persona.id;
            return (
              <Link
                key={persona.id}
                href={persona.href}
                title={persona.label}
                className={cn(
                  "flex items-center gap-3 rounded-radius-md px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500",
                  active
                    ? "bg-arka-teal-50 text-arka-teal-800"
                    : "text-arka-slate-600 hover:bg-surface-sunken hover:text-arka-slate-900",
                  !expanded && "justify-center px-2",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {expanded ? <span className="truncate">{persona.shortLabel}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={cn("border-t border-border-subtle p-2", !expanded && "px-1")}>
          <ComplianceBar mode="embedded" className={cn(!expanded && "hidden")} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border-subtle bg-surface px-4 py-3 sm:px-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-caption text-arka-slate-500">
              {crumbs.map((crumb, i) => (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                  {i > 0 ? <ChevronRight className="h-3.5 w-3.5 text-arka-slate-500" aria-hidden /> : null}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-arka-teal-700">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-arka-slate-800">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
