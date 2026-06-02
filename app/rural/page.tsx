import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Stethoscope,
  Radio,
  GraduationCap,
  DollarSign,
  Network,
  Brain,
  BarChart3,
  ArrowRight,
  AlertTriangle,
  MapPin,
  Users,
} from "lucide-react";
import { RURAL_CRISIS_STATS, RURAL_ROUTES } from "@/lib/demos/rural/constants";

export const metadata: Metadata = {
  title: "Rural Imaging Solutions | ARKA Health",
  description:
    "ARKA for rural sites: right-order imaging guidance, remote reads, clinician training, and tools to keep local imaging programs viable.",
};

const pillars = [
  {
    href: RURAL_ROUTES.cds,
    icon: Stethoscope,
    title: "ARKA-RURAL CDS",
    description:
      "Resource-aware clinical decision support with dual-score appropriateness (CAS + RAAS) and smart triage pathways.",
    tag: "Pillar 1",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    href: RURAL_ROUTES.tele,
    icon: Radio,
    title: "ARKA-TELE",
    description:
      "Teleradiology orchestration with clinical context packaging, AI triage, and multi-provider routing.",
    tag: "Pillar 2",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    href: RURAL_ROUTES.training,
    icon: GraduationCap,
    title: "Rural Training",
    description:
      "Resource-constrained case library with CME credits and certification tracks for rural providers.",
    tag: "Pillar 3",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    href: RURAL_ROUTES.reimbursement,
    icon: DollarSign,
    title: "Reimbursement Optimizer",
    description:
      "Rural exemption detection, batch authorization for mobile units, and REH payment optimization.",
    tag: "Pillar 4",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    href: RURAL_ROUTES.network,
    icon: Network,
    title: "Network Manager",
    description:
      "Hub-and-spoke configuration with equipment registry, mobile unit scheduling, and transfer automation.",
    tag: "Pillar 5",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    href: RURAL_ROUTES.ai,
    icon: Brain,
    title: "AI Diagnostics",
    description:
      "Curated AI marketplace, POCUS protocol library, and AI-assisted preliminary reads.",
    tag: "Pillar 6",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    href: RURAL_ROUTES.intelligence,
    icon: BarChart3,
    title: "Rural Intelligence",
    description:
      "Imaging desert mapping, outcome correlation engine, and predictive facility risk scoring.",
    tag: "Pillar 7",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
];

export default function RuralHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-arka-teal/10">
            <Building2 className="h-8 w-8 text-arka-teal" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading-bold text-arka-text-dark mb-4">
          Rural Imaging Crisis Platform
        </h1>
        <p className="text-lg text-arka-text-dark-muted max-w-2xl mx-auto leading-relaxed">
          Extends ARKA to rural hospitals and clinics — right-order imaging guidance, remote reads,
          clinician training, and tools to keep local imaging programs viable where access is scarce.
        </p>
      </section>

      {/* Crisis Stats Banner */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          {
            value: RURAL_CRISIS_STATS.hospitalsAtRisk.toLocaleString(),
            label: "Rural Hospitals at Risk",
            icon: AlertTriangle,
            color: "text-red-600",
          },
          {
            value: RURAL_CRISIS_STATS.currentREHs.toString(),
            label: "Rural Emergency Hospitals",
            icon: Building2,
            color: "text-blue-600",
          },
          {
            value: `${RURAL_CRISIS_STATS.ruralAmericansUnderserved / 1_000_000}M+`,
            label: "Rural Americans Underserved",
            icon: Users,
            color: "text-amber-600",
          },
          {
            value: `$${RURAL_CRISIS_STATS.teleradiologyMarket2030 / 1e9}B`,
            label: "Teleradiology Market by 2030",
            icon: MapPin,
            color: "text-emerald-600",
          },
        ].map(({ value, label, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-card text-center"
          >
            <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
            <p className="text-2xl font-heading-bold text-arka-text-dark">{value}</p>
            <p className="text-xs text-arka-text-dark-muted mt-1">{label}</p>
          </div>
        ))}
      </section>

      {/* Seven Pillars Grid */}
      <section>
        <h2 className="text-2xl font-heading text-arka-text-dark mb-8 text-center">Seven Strategic Pillars</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Link
                key={pillar.href}
                href={pillar.href}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:shadow-card-hover hover:border-arka-teal/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${pillar.bg}`}>
                    <Icon className={`h-5 w-5 ${pillar.color}`} />
                  </div>
                  <span className="text-xs font-body-medium text-arka-text-dark-soft uppercase tracking-wide">
                    {pillar.tag}
                  </span>
                </div>
                <h3 className="text-lg font-heading text-arka-text-dark mb-2">{pillar.title}</h3>
                <p className="text-sm text-arka-text-dark-muted leading-relaxed mb-4">{pillar.description}</p>
                <span className="flex items-center gap-1 text-sm font-body-medium text-arka-teal group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
