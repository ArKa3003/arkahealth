"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useCallback, useId } from "react";
import { routes } from "@/lib/constants";

const ARKA_TEAL = "#14b8a6";
const ARKA_TEAL_GLOW = "rgba(20, 184, 166, 0.4)";
const GLASS_FILL = "rgba(255, 255, 255, 0.9)";
const GLASS_STROKE = "rgba(20, 184, 166, 0.35)";

type NodeId = "arka" | "clin" | "ed" | "ins" | null;

const nodes = [
  {
    id: "clin" as const,
    label: "CLIN",
    fullName: "ARKA-CLIN",
    href: routes.clin,
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
] as const;

/* Desktop layout: center (ARKA), CLIN/ED/INS equidistant at 120° (triangle) */
const DESKTOP_RADIUS = 115;
const DESKTOP = {
  width: 640,
  height: 320,
  center: { x: 220, y: 160 },
  clin: {
    x: 220 - DESKTOP_RADIUS,
    y: 160,
  },
  ed: {
    x: 220 + DESKTOP_RADIUS * 0.5,
    y: 160 - DESKTOP_RADIUS * (Math.sqrt(3) / 2),
  },
  ins: {
    x: 220 + DESKTOP_RADIUS * 0.5,
    y: 160 + DESKTOP_RADIUS * (Math.sqrt(3) / 2),
  },
};

/* Mobile layout: vertical stack — ARKA center, CLIN above, ED/INS below */
const MOBILE = {
  width: 280,
  height: 420,
  center: { x: 140, y: 140 },
  clin: { x: 140, y: 40 },
  ed: { x: 140, y: 260 },
  ins: { x: 140, y: 380 },
};

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
    (nodeId: "clin" | "ed" | "ins") => {
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
          One Ecosystem. Three Solutions.
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
          className="relative z-10 mx-auto mt-12 hidden w-full max-w-[640px] md:block"
        >
          <svg
            viewBox={`0 0 ${DESKTOP.width} ${DESKTOP.height}`}
            className="w-full"
            style={{ minHeight: 320 }}
            role="img"
            aria-labelledby={`${desktopId}-diagram-title`}
          >
            <title id={`${desktopId}-diagram-title`}>
              ARKA ecosystem diagram: CLIN, ED, and INS solutions connected to shared knowledge base
            </title>
            <TargetingGridPattern idPrefix={desktopId} />
            <rect
              width="100%"
              height="100%"
              fill={`url(#${desktopId}-targeting-grid)`}
              className="text-arka-teal"
              opacity="0.15"
            />

            {/* Connection paths */}
            <AnimatedDashedPath
              idPrefix={desktopId}
              d={`M ${DESKTOP.center.x} ${DESKTOP.center.y} L ${DESKTOP.clin.x} ${DESKTOP.clin.y}`}
              isHighlighted={isPathHighlighted("clin")}
            />
            <AnimatedDashedPath
              idPrefix={desktopId}
              d={`M ${DESKTOP.center.x} ${DESKTOP.center.y} L ${DESKTOP.ed.x} ${DESKTOP.ed.y}`}
              isHighlighted={isPathHighlighted("ed")}
            />
            <AnimatedDashedPath
              idPrefix={desktopId}
              d={`M ${DESKTOP.center.x} ${DESKTOP.center.y} L ${DESKTOP.ins.x} ${DESKTOP.ins.y}`}
              isHighlighted={isPathHighlighted("ins")}
            />

            {/* Shared knowledge base label */}
            <text
              x={DESKTOP.center.x}
              y={DESKTOP.center.y + 48}
              textAnchor="middle"
              className="fill-arka-teal/80 text-[10px] font-medium uppercase tracking-wider"
            >
              Shared knowledge base
            </text>

            {/* Nodes */}
            <NodeCircle
              cx={DESKTOP.center.x}
              cy={DESKTOP.center.y}
              r={36}
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
                cx={
                  node.id === "clin"
                    ? DESKTOP.clin.x
                    : node.id === "ed"
                      ? DESKTOP.ed.x
                      : DESKTOP.ins.x
                }
                cy={
                  node.id === "clin"
                    ? DESKTOP.clin.y
                    : node.id === "ed"
                      ? DESKTOP.ed.y
                      : DESKTOP.ins.y
                }
                r={28}
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

        {/* Mobile diagram: vertical layout, scrollable if content overflows */}
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
              style={{ minHeight: 420 }}
              role="img"
              aria-labelledby={`${mobileId}-diagram-title`}
            >
            <title id={`${mobileId}-diagram-title`}>
              ARKA ecosystem diagram: CLIN, ED, and INS solutions connected to shared knowledge base
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
              d={`M ${MOBILE.center.x} ${MOBILE.center.y} L ${MOBILE.clin.x} ${MOBILE.clin.y}`}
              isHighlighted={isPathHighlighted("clin")}
            />
            <AnimatedDashedPath
              idPrefix={mobileId}
              d={`M ${MOBILE.center.x} ${MOBILE.center.y} L ${MOBILE.ed.x} ${MOBILE.ed.y}`}
              isHighlighted={isPathHighlighted("ed")}
            />
            <AnimatedDashedPath
              idPrefix={mobileId}
              d={`M ${MOBILE.center.x} ${MOBILE.center.y} L ${MOBILE.ins.x} ${MOBILE.ins.y}`}
              isHighlighted={isPathHighlighted("ins")}
            />

            <text
              x={MOBILE.center.x}
              y={MOBILE.center.y + 44}
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
                cx={
                  node.id === "clin"
                    ? MOBILE.clin.x
                    : node.id === "ed"
                      ? MOBILE.ed.x
                      : MOBILE.ins.x
                }
                cy={
                  node.id === "clin"
                    ? MOBILE.clin.y
                    : node.id === "ed"
                      ? MOBILE.ed.y
                      : MOBILE.ins.y
                }
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
          Hover to highlight connections · Click a phase to open its demo
        </p>
      </div>
    </section>
  );
}
