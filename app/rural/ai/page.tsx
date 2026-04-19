"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ruralRoutes } from "@/lib/demos/rural/constants";
import { routes } from "@/lib/constants";
import { AIDiagnosticsDashboard } from "@/components/demos/rural/ai/AIDiagnosticsDashboard";

export default function RuralAiPage() {
  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm font-medium text-arka-text-dark-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={routes.home} className="hover:text-arka-teal transition-colors">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4" aria-hidden />
            <Link href={ruralRoutes.hub} className="hover:text-arka-teal transition-colors">
              Rural
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4" aria-hidden />
            <span className="text-arka-teal">AI Diagnostics</span>
          </li>
        </ol>
      </nav>
      <header>
        <h1 className="font-heading text-2xl font-semibold text-arka-text-dark sm:text-3xl">AI Diagnostics</h1>
        <p className="mt-2 max-w-3xl text-arka-text-dark-muted">
          AI marketplace cards, rural priority selection, preliminary reads, and POCUS protocols with tele workflow.
        </p>
      </header>
      <AIDiagnosticsDashboard />
    </div>
  );
}
