"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { motion, useReducedMotion } from "framer-motion";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import statesTopology from "us-atlas/states-10m.json";

import {
  getAccessMarkerRadius,
  getAccessSeverityColors,
  IMAGING_ACCESS_HUB,
  IMAGING_MAP_STATE_FIPS,
  imagingDesertPoints,
  imagingAccessMapAriaLabel,
} from "@/lib/demos/rural/intelligence/imaging-desert-data";
import { cn } from "@/lib/utils";

const MAP_WIDTH = 800;
const MAP_HEIGHT = 450;
const MAP_PADDING = 28;

const RADAR_PULSE_DURATION = 1.2;
const RADAR_PULSE_REPEAT_DELAY = 1.3;

type StateFeature = Feature<Geometry, { id: string }>;

interface ImagingAccessMapProps {
  activeId: string | null;
  pinnedId: string | null;
  onRegionHover: (id: string | null) => void;
  onRegionSelect: (id: string) => void;
}

interface ProjectedPoint {
  id: string;
  label: string;
  accessScore: number;
  modalityGapSummary: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelAnchor: "start" | "middle" | "end";
}

const LABEL_OFFSETS: Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  "id-001": { dx: -88, dy: -52, anchor: "end" },
  "id-002": { dx: 0, dy: -64, anchor: "middle" },
  "id-003": { dx: 96, dy: -8, anchor: "start" },
};

/**
 * Builds a quadratic arc between two projected coordinates for hub connection lines.
 */
function buildConnectionArc(
  source: [number, number],
  target: [number, number],
  curvature = 0.18,
): string {
  const [x0, y0] = source;
  const [x1, y1] = target;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  return `M${x0},${y0} Q${cx},${cy} ${x1},${y1}`;
}

function RadarPulseRing({
  cx,
  cy,
  r,
  stroke,
  animate,
}: {
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  animate: boolean;
}) {
  if (!animate) return null;

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      initial={{ scale: 1, opacity: 0.5 }}
      animate={{ scale: 2, opacity: 0 }}
      transition={{
        duration: RADAR_PULSE_DURATION,
        repeat: Infinity,
        repeatDelay: RADAR_PULSE_REPEAT_DELAY,
        ease: "easeOut",
      }}
      style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "fill-box" }}
    />
  );
}

/**
 * Geographic imaging-access map for tracked rural desert regions (d3-geo + TopoJSON).
 */
export function ImagingAccessMap({
  activeId,
  pinnedId,
  onRegionHover,
  onRegionSelect,
}: ImagingAccessMapProps) {
  const uid = useId().replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = prefersReducedMotion !== true;

  const [tooltipCoords, setTooltipCoords] = useState<{ x: number; y: number } | null>(null);
  const displayId = pinnedId ?? activeId;

  const { statePaths, hubPoint, regionPoints } = useMemo(() => {
    const topology = statesTopology as unknown as Topology;
    const statesGeo = feature(
      topology,
      topology.objects.states as GeometryCollection,
    ) as FeatureCollection<Geometry, { id: string }>;

    const visibleStates = statesGeo.features.filter((f) =>
      IMAGING_MAP_STATE_FIPS.has(String(f.id)),
    ) as StateFeature[];

    const projection = geoAlbersUsa().fitExtent(
      [
        [MAP_PADDING, MAP_PADDING],
        [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
      ],
      { type: "FeatureCollection", features: visibleStates },
    );

    const pathGen = geoPath(projection);

    const paths = visibleStates.map((stateFeature) => ({
      id: String(stateFeature.id),
      d: pathGen(stateFeature) ?? "",
    }));

    const hub = projection([IMAGING_ACCESS_HUB.lng, IMAGING_ACCESS_HUB.lat]);
    const hubPoint = hub ? { x: hub[0], y: hub[1] } : { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };

    const regionPoints: ProjectedPoint[] = imagingDesertPoints
      .map((point) => {
        const projected = projection([point.lng, point.lat]);
        if (!projected) return null;

        const offset = LABEL_OFFSETS[point.id] ?? { dx: 0, dy: -48, anchor: "middle" as const };
        return {
          id: point.id,
          label: point.label,
          accessScore: point.accessScore,
          modalityGapSummary: point.modalityGapSummary,
          x: projected[0],
          y: projected[1],
          labelX: projected[0] + offset.dx,
          labelY: projected[1] + offset.dy,
          labelAnchor: offset.anchor,
        };
      })
      .filter((p): p is ProjectedPoint => p !== null);

    return { statePaths: paths, hubPoint, regionPoints };
  }, []);

  const handleRegionFocus = useCallback(
    (id: string, x: number, y: number) => {
      onRegionHover(id);
      setTooltipCoords({ x, y });
    },
    [onRegionHover],
  );

  const handleRegionBlur = useCallback(() => {
    if (!pinnedId) {
      onRegionHover(null);
      setTooltipCoords(null);
    }
  }, [onRegionHover, pinnedId]);

  const activePoint = regionPoints.find((p) => p.id === displayId) ?? null;

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border-subtle bg-arka-bg-alt">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="h-full w-full touch-manipulation"
        role="img"
        aria-label={imagingAccessMapAriaLabel}
      >
        <title>Imaging access map for Northwest Kansas, Oklahoma Panhandle, and Mississippi Delta</title>

        <defs>
          <filter id={`${uid}-marker-glow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="var(--arka-bg-alt)" />

        {statePaths.map((state) => {
          const hostFips =
            state.id === "20" || state.id === "40" || state.id === "28";
          return (
            <path
              key={state.id}
              d={state.d}
              fill={hostFips ? "var(--arka-slate-200)" : "var(--arka-bg-alt)"}
              stroke="var(--arka-slate-300)"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {regionPoints.map((point) => {
          const arcPath = buildConnectionArc([point.x, point.y], [hubPoint.x, hubPoint.y]);
          return (
            <g key={`arc-${point.id}`} aria-hidden="true">
              <path
                d={arcPath}
                fill="none"
                stroke="var(--arka-teal-200)"
                strokeWidth={1.5}
                strokeOpacity={0.45}
              />
              <path
                d={arcPath}
                fill="none"
                stroke="var(--arka-teal-500)"
                strokeWidth={2}
                strokeOpacity={0.4}
                strokeDasharray="6 10"
                className={shouldAnimate ? "rural-map-path-animate" : undefined}
              />
            </g>
          );
        })}

        <g aria-hidden="true">
          <circle
            cx={hubPoint.x}
            cy={hubPoint.y}
            r={8}
            fill="var(--arka-teal-500)"
            stroke="#ffffff"
            strokeWidth={2}
            filter={`url(#${uid}-marker-glow)`}
          />
          <g className="hidden min-[480px]:block">
            <text
              x={hubPoint.x}
              y={hubPoint.y - 14}
              textAnchor="middle"
              fill="var(--arka-teal-700)"
              className="font-mono text-[10px]"
            >
              ARKA Hub
            </text>
          </g>
        </g>

        {regionPoints.map((point) => {
          const colors = getAccessSeverityColors(point.accessScore);
          const radius = getAccessMarkerRadius(point.accessScore);
          const isActive = displayId === point.id;

          return (
            <g key={point.id}>
              <g className="hidden min-[480px]:block" aria-hidden="true">
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.labelX}
                  y2={point.labelY}
                  stroke="var(--arka-slate-300)"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                <rect
                  x={
                    point.labelAnchor === "end"
                      ? point.labelX - 148
                      : point.labelAnchor === "start"
                        ? point.labelX
                        : point.labelX - 74
                  }
                  y={point.labelY - 14}
                  width={148}
                  height={22}
                  rx={4}
                  fill="var(--surface)"
                  stroke="var(--arka-slate-300)"
                  strokeWidth={0.75}
                />
                <text
                  x={
                    point.labelAnchor === "end"
                      ? point.labelX - 8
                      : point.labelAnchor === "start"
                        ? point.labelX + 8
                        : point.labelX
                  }
                  y={point.labelY}
                  textAnchor={point.labelAnchor}
                  className="fill-arka-slate-900 font-mono text-[11px]"
                >
                  {`${point.label} · ${point.accessScore}/100`}
                </text>
              </g>

              <RadarPulseRing
                cx={point.x}
                cy={point.y}
                r={radius}
                stroke={colors.stroke}
                animate={shouldAnimate}
              />

              <circle
                cx={point.x}
                cy={point.y}
                r={radius}
                fill={colors.fill}
                stroke="#ffffff"
                strokeWidth={2}
                filter={isActive ? `url(#${uid}-marker-glow)` : undefined}
                pointerEvents="none"
              />

              <foreignObject
                x={point.x - 22}
                y={point.y - 22}
                width={44}
                height={44}
                className="overflow-visible"
              >
                <button
                  type="button"
                  className={cn(
                    "h-11 w-11 min-h-[44px] min-w-[44px] rounded-full",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
                  )}
                  aria-label={`${point.label}, access score ${point.accessScore} out of 100. ${point.modalityGapSummary}`}
                  aria-pressed={pinnedId === point.id}
                  onMouseEnter={() => handleRegionFocus(point.id, point.x, point.y)}
                  onMouseLeave={() => {
                    if (!pinnedId) {
                      onRegionHover(null);
                      setTooltipCoords(null);
                    }
                  }}
                  onFocus={() => handleRegionFocus(point.id, point.x, point.y)}
                  onBlur={handleRegionBlur}
                  onClick={() => onRegionSelect(point.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRegionSelect(point.id);
                    }
                  }}
                >
                  <span className="sr-only">
                    {point.label}, {point.accessScore} out of 100
                  </span>
                </button>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {activePoint && tooltipCoords ? (
        <div
          className="pointer-events-none absolute z-10 max-w-[220px] rounded-radius-md border border-border-subtle bg-surface px-3 py-2 shadow-elevation-2"
          style={{
            left: `${(tooltipCoords.x / MAP_WIDTH) * 100}%`,
            top: `${(tooltipCoords.y / MAP_HEIGHT) * 100}%`,
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
          role="tooltip"
          id={`imaging-access-tooltip-${activePoint.id}`}
        >
          <p className="font-mono text-xs font-semibold text-arka-slate-900">{activePoint.label}</p>
          <p className="mt-0.5 font-mono text-xs text-arka-slate-600">
            Access {activePoint.accessScore}/100
          </p>
          <p className="mt-1 text-xs text-arka-slate-600">{activePoint.modalityGapSummary}</p>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {displayId
          ? (() => {
              const point = regionPoints.find((p) => p.id === displayId);
              return point
                ? `${point.label} selected. Access score ${point.accessScore}. ${point.modalityGapSummary}`
                : "";
            })()
          : ""}
      </p>
    </div>
  );
}
