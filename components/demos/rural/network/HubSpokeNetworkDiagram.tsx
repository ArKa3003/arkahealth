"use client";

import { motion } from "framer-motion";
import type { FacilityProfile } from "@/lib/demos/rural/types";
import { cn } from "@/lib/utils";

export type NetworkLayoutNode = {
  facility: FacilityProfile;
  x: number;
  y: number;
  linkToHub: "solid" | "dashed" | "none";
};

type HubSpokeNetworkDiagramProps = {
  nodes: NetworkLayoutNode[];
  hubId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const VIEW_W = 420;
const VIEW_H = 320;

function roleLabel(role: FacilityProfile["networkRole"]): string {
  switch (role) {
    case "hub":
      return "Hub";
    case "spoke":
      return "Spoke";
    case "independent":
      return "Independent";
    default:
      return role;
  }
}

export function HubSpokeNetworkDiagram({ nodes, hubId, selectedId, onSelect }: HubSpokeNetworkDiagramProps) {
  const hub = nodes.find((n) => n.facility.id === hubId);
  if (!hub) return null;

  const edges = nodes
    .filter((n) => n.facility.id !== hubId && n.linkToHub !== "none")
    .map((n) => ({
      id: `${hubId}-${n.facility.id}`,
      x1: hub.x,
      y1: hub.y,
      x2: n.x,
      y2: n.y,
      style: n.linkToHub,
    }));

  return (
    <figure className="relative w-full overflow-hidden rounded-lg bg-gradient-to-b from-arka-teal/[0.06] to-transparent">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-auto max-h-[min(420px,70vh)] w-full"
        role="img"
        aria-label="Hub-and-spoke network diagram. Select a facility node to view details."
      >
        <defs>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(20 184 166)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(20 184 166)" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {edges.map((e) => {
          const d = `M ${e.x1} ${e.y1} L ${e.x2} ${e.y2}`;
          return (
            <motion.path
              key={e.id}
              d={d}
              fill="none"
              stroke="url(#edgeGrad)"
              strokeWidth={e.style === "dashed" ? 1.5 : 2}
              strokeDasharray={e.style === "dashed" ? "7 5" : undefined}
              strokeOpacity={e.style === "dashed" ? 0.55 : 0.9}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}

        {nodes.map((n) => {
          const isHub = n.facility.networkRole === "hub";
          const isSelected = selectedId === n.facility.id;
          const r = isHub ? 38 : 32;
          const label = n.facility.name.length > 20 ? `${n.facility.name.slice(0, 18)}…` : n.facility.name;

          return (
            <g key={n.facility.id}>
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={r}
                className={cn(
                  "cursor-pointer stroke-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-arka-bg-medium",
                  isHub
                    ? "fill-arka-teal/20 stroke-arka-teal"
                    : n.facility.networkRole === "spoke"
                      ? "fill-white stroke-arka-teal/80 dark:fill-arka-bg-medium/80"
                      : "fill-arka-bg-medium/60 stroke-arka-primary/40 dark:stroke-white/30"
                )}
                onClick={() => onSelect(n.facility.id)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    onSelect(n.facility.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`${n.facility.name}, ${roleLabel(n.facility.networkRole)}. ${isSelected ? "Selected." : "Select for details."}`}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{
                  scale: isSelected ? 1.06 : 1,
                  opacity: 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                style={{
                  filter: isSelected ? "drop-shadow(0 0 10px rgba(20,184,166,0.45))" : undefined,
                }}
              />
              <text
                x={n.x}
                y={n.y - (isHub ? 4 : 2)}
                textAnchor="middle"
                className="pointer-events-none fill-arka-text-dark text-[11px] font-semibold sm:text-xs"
              >
                {label}
              </text>
              <text
                x={n.x}
                y={n.y + (isHub ? 12 : 10)}
                textAnchor="middle"
                className="pointer-events-none fill-arka-text-dark-muted text-[9px] sm:text-[10px]"
              >
                {roleLabel(n.facility.networkRole)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        Interactive diagram: {nodes.length} facilities. Hub is {hub.facility.name}. Use Tab and Enter to select nodes.
      </figcaption>
    </figure>
  );
}
