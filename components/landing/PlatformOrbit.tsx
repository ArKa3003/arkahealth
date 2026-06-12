"use client";

import Link from "next/link";
import {
  GraduationCap,
  MapPin,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

type OrbitNode = {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  /** Position on the orbit ring (degrees, 0 = top). */
  angle: number;
};

const NODES: OrbitNode[] = [
  {
    id: "clin",
    label: "ARKA-CLIN",
    shortLabel: "CLIN",
    href: routes.clinSuite,
    icon: Stethoscope,
    angle: 0,
  },
  {
    id: "ed",
    label: "ARKA-ED",
    shortLabel: "ED",
    href: routes.ed,
    icon: GraduationCap,
    angle: 90,
  },
  {
    id: "ins",
    label: "ARKA-INS",
    shortLabel: "INS",
    href: routes.ins,
    icon: ShieldCheck,
    angle: 180,
  },
  {
    id: "rural",
    label: "Rural Platform",
    shortLabel: "RURAL",
    href: routes.rural,
    icon: MapPin,
    angle: 270,
  },
];

const CX = 200;
const CY = 200;
const ORBIT_R = 130;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * SVG orbital layout — central ARKA core with four clickable phase nodes.
 */
export function PlatformOrbit() {
  const description =
    "ARKA platform diagram: ARKA Knowledge Core at center, connected to four phases — CLIN for clinicians, ED for learners, INS for payers, and RURAL for rural sites. Each node links to its phase page.";

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <p className="sr-only">{description}</p>

      <svg
        viewBox="0 0 400 400"
        width={400}
        height={400}
        className="mx-auto block h-auto w-full max-w-[min(400px,90vw)]"
        role="img"
        aria-hidden
      >
        {/* Orbit ring */}
        <circle
          cx={CX}
          cy={CY}
          r={ORBIT_R}
          fill="none"
          stroke="rgb(226 232 240)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Spokes to center */}
        {NODES.map((node) => {
          const pos = polarToCartesian(CX, CY, ORBIT_R, node.angle);
          return (
            <line
              key={`spoke-${node.id}`}
              x1={CX}
              y1={CY}
              x2={pos.x}
              y2={pos.y}
              stroke="rgb(20 184 166 / 0.35)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              className="orbital-path-animate"
            />
          );
        })}

        {/* Central core */}
        <circle cx={CX} cy={CY} r={52} fill="rgb(15 23 42)" />
        <circle
          cx={CX}
          cy={CY}
          r={52}
          fill="none"
          stroke="rgb(20 184 166 / 0.5)"
          strokeWidth="2"
        />
        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="600"
          fontFamily="ui-monospace, monospace"
        >
          ARKA
        </text>
        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          fill="rgb(148 163 184)"
          fontSize="9"
          fontFamily="system-ui, sans-serif"
        >
          Knowledge Core
        </text>
      </svg>

      {/* Interactive nodes overlaid on SVG positions */}
      <ul className="absolute inset-0 m-0 list-none p-0">
        {NODES.map((node) => {
          const pos = polarToCartesian(CX, CY, ORBIT_R, node.angle);
          const leftPct = (pos.x / 400) * 100;
          const topPct = (pos.y / 400) * 100;
          const Icon = node.icon;

          return (
            <li
              key={node.id}
              className="absolute"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <Link
                href={node.href}
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-radius-lg border border-border-subtle bg-surface px-3 py-2.5 shadow-elevation-2",
                  "transition-[box-shadow,transform,border-color] duration-200",
                  "hover:-translate-y-0.5 hover:border-arka-teal-300 hover:shadow-elevation-3",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
                  "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                )}
                aria-label={`${node.label} — enter ${node.shortLabel} phase demo`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-radius-md bg-arka-teal-500 text-white">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-arka-slate-700">
                  {node.shortLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
