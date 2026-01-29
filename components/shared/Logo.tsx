"use client";

import { useId } from "react";

const sizeMap = {
  sm: { icon: 24, wordmark: 14, tagline: 11, gap: 6 },
  md: { icon: 36, wordmark: 18, tagline: 13, gap: 8 },
  lg: { icon: 48, wordmark: 24, tagline: 16, gap: 10 },
} as const;

type Size = "sm" | "md" | "lg";
type Variant = "full" | "icon" | "wordmark";

export type LogoProps = {
  size?: Size;
  variant?: Variant;
  className?: string;
  hideTagline?: boolean;
};

function EmblemSvg({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-4 -4 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color: "white" }}
      role="img"
      aria-hidden
      shapeRendering="geometricPrecision"
    >
      {/* Emblem from /public/arka-logo.svg */}
      <rect width="40" height="40" rx="8" fill="var(--arka-primary)" />
      <path
        d="M12 28V12h4l6 10 6-10h4v16h-4V18l-4 6h-4l-4-6v10h-4z"
        fill="currentColor"
      />
      {/* Cyan gem – subtle pulse */}
      <circle
        cx="20"
        cy="18"
        r="2.5"
        fill="var(--arka-cyan)"
        className="logo-gem"
      />
      {/* Rings – outside emblem; glow on hover via wrapper drop-shadow */}
      <g className="logo-rings" stroke="var(--arka-cyan)" strokeWidth="0.8" fill="none">
        <circle cx="20" cy="20" r="22" />
        <circle cx="20" cy="20" r="24" />
      </g>
    </svg>
  );
}

function WordmarkSvg({
  height,
  gradientId,
  className,
}: {
  height: number;
  gradientId: string;
  className?: string;
}) {
  return (
    <svg
      width={height * 2.4}
      height={height}
      viewBox="0 0 96 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-hidden
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="var(--arka-primary)" />
          <stop offset="100%" stopColor="var(--arka-cyan)" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="28"
        fontSize="32"
        fontWeight="700"
        fill={`url(#${gradientId})`}
        fontFamily="var(--font-sans), Inter, system-ui, sans-serif"
      >
        ARKA
      </text>
    </svg>
  );
}

export function Logo({
  size = "md",
  variant = "full",
  className = "",
  hideTagline = false,
}: LogoProps) {
  const id = useId();
  const gradientId = `logo-wordmark-${id.replace(/:/g, "")}`;
  const { icon, wordmark, tagline, gap } = sizeMap[size];

  return (
    <span
      className={`logo-root group inline-flex shrink-0 cursor-default items-center transition-transform duration-300 ease-out hover:scale-[1.02] ${className}`.trim()}
      style={{ gap: variant === "full" ? gap : 0 }}
      role="img"
      aria-label="ARKA Health"
    >
      {variant === "icon" && (
        <span className="logo-icon-wrapper inline-flex transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_12px_var(--arka-cyan))]">
          <EmblemSvg size={icon} />
        </span>
      )}
      {variant === "wordmark" && (
        <span className="logo-wordmark-wrapper inline-flex transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_12px_var(--arka-cyan))]">
          <WordmarkSvg height={icon} gradientId={gradientId} />
        </span>
      )}
      {variant === "full" && (
        <>
          <span className="logo-icon-wrapper inline-flex transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_12px_var(--arka-cyan))]">
            <EmblemSvg size={icon} />
          </span>
          <span className="flex flex-col items-start justify-center gap-0.5">
            <WordmarkSvg height={wordmark * 2} gradientId={gradientId} />
            {!hideTagline && (
              <span
                className="font-accent font-normal italic text-arka-text-soft"
                style={{ fontSize: `${tagline}px` }}
              >
                remARKAbly precise
              </span>
            )}
          </span>
        </>
      )}
    </span>
  );
}
