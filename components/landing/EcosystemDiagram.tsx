"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useCallback, useId } from "react";
import { routes } from "@/lib/constants";

const ARKA_TEAL = "#14b8a6";
const ARKA_TEAL_GLOW = "rgba(20, 184, 166, 0.4)";
const GLASS_FILL = "rgba(255, 255, 255, 0.9)";
const GLASS_STROKE = "rgba(20, 184, 166, 0.35)";

type NodeId = "arka" | "clin" | "ed" | "ins" | "rural" | null;

const nodes = [
  {
    id: "clin" as const,
    label: "CLIN",
    fullName: "ARKA-CLIN",
    href: routes.clinSuite,
    tooltip:
      "Clinical decision support for imaging appropriateness. Evidence-based ordering guidance at the point of care.",
  },
  {
    id: "ed" as const,
    label: "ED",
    fullName: "ARKA-ED",
    href: routes.ed,
    tooltip:
      "Medical education and ED workflow. Trains clinicians and integrates CDS into emergency imaging workflows.",
  },
  {
    id: "ins" as const,
    label: "INS",
    fullName: "ARKA-INS",
    href: routes.ins,
    tooltip:
      "Utilization management and prior authorization. Ensures appropriate imaging across the care continuum.",
  },
  {
    id: "rural" as const,
    label: "RURAL",
    fullName: "Rural Platform",
    href: routes.rural,
    tooltip:
      "Rural imaging crisis hub — resource-aware CDS, teleradiology, training, reimbursement, network, AI, and population intelligence.",
  },
] as const;

/** Desktop layout — diamond: CLIN top, ED right, INS left, Rural bottom. */
const DESKTOP_RADIUS = 160;
const DESKTOP_CX = 360;
const DESKTOP_CY = 220;
const DESKTOP = {
  width: 720,
  height: 460,
  center: { x: DESKTOP_CX, y: DESKTOP_CY },
  clin: { x: DESKTOP_CX, y: DESKTOP_CY - DESKTOP_RADIUS },
  ed: { x: DESKTOP_CX + DESKTOP_RADIUS, y: DESKTOP_CY },
  ins: { x: DESKTOP_CX - DESKTOP_RADIUS, y: DESKTOP_CY },
  rural: { x: DESKTOP_CX, y: DESKTOP_CY + DESKTOP_RADIUS },
};

const DESKTOP_NODE_POSITIONS = {
  clin: DESKTOP.clin,
  ed: DESKTOP.ed,
  ins: DESKTOP.ins,
  rural: DESKTOP.rural,
} as const;

/**
 * Endpoints on circle perimeters so lines are visible (not buried in nodes)
 * and paths can be ordered without center overlap hiding a segment.
 */
function getEdgeEndpoints(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromRadius: number,
  toRadius: number
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) {
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  }
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: from.x + ux * fromRadius,
    y1: from.y + uy * fromRadius,
    x2: to.x - ux * toRadius,
    y2: to.y - uy * toRadius,
  };
}

function connectionPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromRadius: number,
  toRadius: number
): string {
  const { x1, y1, x2, y2 } = getEdgeEndpoints(from, to, fromRadius, toRadius);
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

/** Mobile layout — scaled diamond; rural anchor at y = 380 per design spec. */
const MOBILE_RADIUS = 100;
const MOBILE_CX = 140;
const MOBILE_CY = 280;
const MOBILE = {
  width: 280,
  height: 500,
  center: { x: MOBILE_CX, y: MOBILE_CY },
  clin: { x: MOBILE_CX, y: MOBILE_CY - MOBILE_RADIUS },
  ed: { x: MOBILE_CX + MOBILE_RADIUS, y: MOBILE_CY },
  ins: { x: MOBILE_CX - MOBILE_RADIUS, y: MOBILE_CY },
  rural: { x: MOBILE_CX, y: 380 },
};

const MOBILE_NODE_POSITIONS = {
  clin: MOBILE.clin,
  ed: MOBILE.ed,
  ins: MOBILE.ins,
  rural: MOBILE.rural,
} as const;

function TargetingGridPattern({ idPrefix }: { idPrefix: string }) {
  return (
    <defs>
      <pattern
        id={`${idPrefix}-targeting-grid`}
        width="60"
        height="60"
        patternUnits="userSpaceOnUse"
      >
        {/* Concentric circles */}
        <circle
          cx="30"
          cy="30"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.25"
          opacity="0.12"
        />
        <circle
          cx="30"
          cy="30"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.2"
          opacity="0.1"
        />
        <circle
          cx="30"
          cy="30"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.2"
          opacity="0.08"
        />
        {/* Cross lines */}
        <line
          x1="30"
          y1="0"
          x2="30"
          y2="60"
          stroke="currentColor"
          strokeWidth="0.2"
          opacity="0.1"
        />
        <line
          x1="0"
          y1="30"
          x2="60"
          y2="30"
          stroke="currentColor"
          strokeWidth="0.2"
          opacity="0.1"
        />
      </pattern>
      <linearGradient
        id={`${idPrefix}-line-glow`}
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
      >
        <stop offset="0%" stopColor={ARKA_TEAL} stopOpacity="0.3" />
        <stop offset="50%" stopColor={ARKA_TEAL} stopOpacity="1" />
        <stop offset="100%" stopColor={ARKA_TEAL} stopOpacity="0.3" />
      </linearGradient>
      <filter id={`${idPrefix}-glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function AnimatedDashedPath({
  d,
  isHighlighted,
  dashLength = 12,
  idPrefix,
}: {
  d: string;
  isHighlighted: boolean;
  dashLength?: number;
  idPrefix: string;
}) {
  return (
    <g filter={`url(#${idPrefix}-glow)`}>
      {/* Solid underlay — keeps vertical (CLIN) leg visible against grid crosshairs */}
      <motion.path
        d={d}
        fill="none"
        stroke={ARKA_TEAL}
        strokeWidth={isHighlighted ? 5 : 3}
        strokeLinecap="round"
        initial={{ strokeOpacity: 0.45 }}
        animate={{
          strokeOpacity: isHighlighted ? 0.6 : 0.55,
          strokeWidth: isHighlighted ? 5 : 3,
        }}
        transition={{ duration: 0.2 }}
        style={{
          filter: `drop-shadow(0 0 6px ${ARKA_TEAL_GLOW})`,
        }}
      />
      {/* Static glow track */}
      <motion.path
        d={d}
        fill="none"
        stroke={ARKA_TEAL}
        strokeWidth={isHighlighted ? 4 : 2}
        strokeLinecap="round"
        strokeDasharray={`${dashLength} ${dashLength}`}
        initial={{ strokeOpacity: 0.15 }}
        animate={{
          strokeOpacity: isHighlighted ? 0.5 : 0.2,
          strokeWidth: isHighlighted ? 4 : 2,
        }}
        transition={{ duration: 0.2 }}
        style={{
          filter: isHighlighted ? `drop-shadow(0 0 8px ${ARKA_TEAL_GLOW})` : undefined,
        }}
      />
      {/* Flowing dashed line (data/insight flow) */}
      <motion.path
        d={d}
        fill="none"
        stroke={`url(#${idPrefix}-line-glow)`}
        strokeWidth={isHighlighted ? 3 : 1.5}
        strokeLinecap="round"
        strokeDasharray={`${dashLength} ${dashLength}`}
        animate={{
          strokeDashoffset: [0, dashLength * 2],
          strokeOpacity: isHighlighted ? 1 : 0.6,
        }}
        transition={{
          strokeDashoffset: { duration: 1.2, repeat: Infinity, ease: "linear" },
          strokeOpacity: { duration: 0.2 },
        }}
      />
    </g>
  );
}

function NodeCircle({
  cx,
  cy,
  r,
  label,
  isCenter,
  isHighlighted,
  onClick,
  onMouseEnter,
  onMouseLeave,
  href,
}: {
  cx: number;
  cy: number;
  r: number;
  label: string;
  isCenter?: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  href: string;
  tooltip: string;
}) {
  return (
    <g
      role={isCenter ? undefined : "link"}
      tabIndex={isCenter ? undefined : 0}
      aria-label={isCenter ? undefined : `Go to ${label} demo`}
      cursor="pointer"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      onKeyDown={(e) => {
        if (!isCenter && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Glassmorphism circle */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill={GLASS_FILL}
        stroke={isHighlighted ? ARKA_TEAL : GLASS_STROKE}
        strokeWidth={isHighlighted ? 2.5 : 1.5}
        animate={{
          filter: isHighlighted ? `drop-shadow(0 0 12px ${ARKA_TEAL_GLOW})` : "none",
        }}
        transition={{ duration: 0.2 }}
        style={{ backdropFilter: "blur(8px)" }}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        className="select-none font-semibold fill-[var(--arka-text-dark)]"
        style={{ fontSize: isCenter ? 14 : 12 }}
      >
        {label}
      </text>
    </g>
  );
}

export function EcosystemDiagram() {
  const router = useRouter();
  const [hoveredNode, setHoveredNode] = useState<NodeId>(null);
  const idBase = useId().replace(/:/g, "");
  const desktopId = `${idBase}-d`;
  const mobileId = `${idBase}-m`;

  const handleNodeClick = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  const isPathHighlighted = useCallback(
    (nodeId: "clin" | "ed" | "ins" | "rural") => {
      if (!hoveredNode) return true;
      return hoveredNode === "arka" || hoveredNode === nodeId;
    },
    [hoveredNode]
  );

  return (
    <section
      id="ecosystem"
      className="scroll-mt-14 relative border-t border-arka-light bg-arka-bg-alt px-4 py-24 sm:px-6 lg:px-8"
      aria-labelledby="ecosystem-heading"
    >
      <div className="relative mx-auto max-w-4xl">
        <motion.h2
          id="ecosystem-heading"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-2xl font-bold text-arka-text-dark sm:text-3xl"
        >
          One Ecosystem. Four Solutions.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-arka-text-dark-muted sm:text-base"
        >
          ARKA integrates clinical decision support, medical education, and
          utilization management into a unified platform. Insights from one phase
          inform and improve the others — creating a Cutting-Edge and evolving
          healthcare ecosystem.
        </motion.p>

        {/* Desktop diagram */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="relative z-10 mx-auto mt-12 hidden w-full max-w-[720px] md:block"
        >
          <svg
            viewBox={`0 0 ${DESKTOP.width} ${DESKTOP.height}`}
            className="w-full"
            style={{ minHeight: 460 }}
            role="img"
            aria-labelledby={`${desktopId}-diagram-title`}
          >
            <title id={`${desktopId}-diagram-title`}>
              ARKA ecosystem diagram: CLIN, ED, INS, and Rural Platform connected to a shared knowledge base
            </title>
            <TargetingGridPattern idPrefix={desktopId} />
            <rect
              width="100%"
              height="100%"
              fill={`url(#${desktopId}-targeting-grid)`}
              className="text-arka-teal"
              opacity="0.15"
            />

            <AnimatedDashedPath
              idPrefix={desktopId}
              d={connectionPath(DESKTOP.center, DESKTOP.ed, 44, 34)}
              isHighlighted={isPathHighlighted("ed")}
            />
            <AnimatedDashedPath
              idPrefix={desktopId}
              d={connectionPath(DESKTOP.center, DESKTOP.ins, 44, 34)}
              isHighlighted={isPathHighlighted("ins")}
            />
            <AnimatedDashedPath
              idPrefix={desktopId}
              d={connectionPath(DESKTOP.center, DESKTOP.rural, 44, 34)}
              isHighlighted={isPathHighlighted("rural")}
            />
            <AnimatedDashedPath
              idPrefix={desktopId}
              d={connectionPath(DESKTOP.center, DESKTOP.clin, 44, 34)}
              isHighlighted={isPathHighlighted("clin")}
            />

            {/* Shared knowledge base label */}
            <text
              x={DESKTOP.center.x}
              y={DESKTOP.center.y + 12}
              textAnchor="middle"
              className="fill-arka-teal/80 text-[10px] font-medium uppercase tracking-wider"
            >
              Shared knowledge base
            </text>

            {/* Nodes */}
            <NodeCircle
              cx={DESKTOP.center.x}
              cy={DESKTOP.center.y}
              r={44}
              label="ARKA"
              isCenter
              isHighlighted={hoveredNode === "arka" || hoveredNode === null}
              onClick={() => {}}
              onMouseEnter={() => setHoveredNode("arka")}
              onMouseLeave={() => setHoveredNode(null)}
              href="#"
              tooltip="Unified platform connecting clinical, education, and utilization."
            />
            {nodes.map((node) => (
              <NodeCircle
                key={node.id}
                cx={DESKTOP_NODE_POSITIONS[node.id].x}
                cy={DESKTOP_NODE_POSITIONS[node.id].y}
                r={34}
                label={node.label}
                isHighlighted={hoveredNode === node.id || hoveredNode === null}
                onClick={() => handleNodeClick(node.href)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                href={node.href}
                tooltip={node.tooltip}
              />
            ))}
          </svg>
        </motion.div>

        {/* Mobile diagram: diamond layout, scrollable if content overflows */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="relative z-10 mx-auto mt-12 w-full max-w-[min(280px,100%)] overflow-x-hidden md:hidden"
        >
          <div className="u-scroll-touch max-h-[70dvh] overflow-y-auto overflow-x-hidden rounded-xl">
            <svg
              viewBox={`0 0 ${MOBILE.width} ${MOBILE.height}`}
              className="w-full"
              style={{ minHeight: 500 }}
              role="img"
              aria-labelledby={`${mobileId}-diagram-title`}
            >
            <title id={`${mobileId}-diagram-title`}>
              ARKA ecosystem diagram: CLIN, ED, INS, and Rural Platform connected to a shared knowledge base
            </title>
            <TargetingGridPattern idPrefix={mobileId} />
            <rect
              width="100%"
              height="100%"
              fill={`url(#${mobileId}-targeting-grid)`}
              className="text-arka-teal"
              opacity="0.15"
            />

            <AnimatedDashedPath
              idPrefix={mobileId}
              d={connectionPath(MOBILE.center, MOBILE.ed, 32, 24)}
              isHighlighted={isPathHighlighted("ed")}
            />
            <AnimatedDashedPath
              idPrefix={mobileId}
              d={connectionPath(MOBILE.center, MOBILE.ins, 32, 24)}
              isHighlighted={isPathHighlighted("ins")}
            />
            <AnimatedDashedPath
              idPrefix={mobileId}
              d={connectionPath(MOBILE.center, MOBILE.rural, 32, 24)}
              isHighlighted={isPathHighlighted("rural")}
            />
            <AnimatedDashedPath
              idPrefix={mobileId}
              d={connectionPath(MOBILE.center, MOBILE.clin, 32, 24)}
              isHighlighted={isPathHighlighted("clin")}
            />

            <text
              x={MOBILE.center.x}
              y={MOBILE.center.y + 12}
              textAnchor="middle"
              className="fill-arka-teal/80 text-[9px] font-medium uppercase tracking-wider"
            >
              Shared knowledge base
            </text>

            <NodeCircle
              cx={MOBILE.center.x}
              cy={MOBILE.center.y}
              r={32}
              label="ARKA"
              isCenter
              isHighlighted={hoveredNode === "arka" || hoveredNode === null}
              onClick={() => {}}
              onMouseEnter={() => setHoveredNode("arka")}
              onMouseLeave={() => setHoveredNode(null)}
              href="#"
              tooltip="Unified platform."
            />
            {nodes.map((node) => (
              <NodeCircle
                key={node.id}
                cx={MOBILE_NODE_POSITIONS[node.id].x}
                cy={MOBILE_NODE_POSITIONS[node.id].y}
                r={24}
                label={node.label}
                isHighlighted={hoveredNode === node.id || hoveredNode === null}
                onClick={() => handleNodeClick(node.href)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                href={node.href}
                tooltip={node.tooltip}
              />
            ))}
            </svg>
          </div>
        </motion.div>

        {/* Single tooltip below both diagrams: one description only, does not overlap content */}
        {hoveredNode && hoveredNode !== "arka" && (
          <div
            className="relative z-0 mx-auto mt-4 max-w-md rounded-lg border border-arka-teal/30 bg-arka-navy px-4 py-3 text-center text-sm text-arka-text shadow-lg"
            role="tooltip"
            aria-live="polite"
          >
            {nodes.find((n) => n.id === hoveredNode)?.tooltip}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-arka-text-dark-soft">
          <span className="hidden sm:inline">Hover to highlight connections · </span>
          Click a phase to open its demo
        </p>
      </div>
    </section>
  );
}
