"use client";

import Image from "next/image";

const sizeMap = {
  sm: { fullW: 120, fullH: 135, icon: 24 },
  md: { fullW: 160, fullH: 180, icon: 36 },
  lg: { fullW: 240, fullH: 270, icon: 48 },
} as const;

type Size = "sm" | "md" | "lg";
type Variant = "full" | "icon" | "wordmark";

export type LogoProps = {
  size?: Size;
  variant?: Variant;
  className?: string;
  hideTagline?: boolean;
};

export function Logo({
  size = "md",
  variant = "full",
  className = "",
  hideTagline = false,
}: LogoProps) {
  const { fullW, fullH, icon } = sizeMap[size];

  return (
    <span
      className={`logo-root group inline-flex shrink-0 cursor-default items-center transition-transform duration-300 ease-out hover:scale-[1.02] ${className}`.trim()}
      role="img"
      aria-label="ARKA Health"
    >
      {variant === "icon" && (
        <span className="logo-icon-wrapper inline-flex transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_12px_var(--arka-cyan))]">
          <Image
            src="/arka-icon.svg"
            alt=""
            width={icon}
            height={icon}
            className="h-auto w-auto"
            unoptimized
          />
        </span>
      )}
      {variant === "wordmark" && (
        <span className="logo-wordmark-wrapper inline-flex transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_12px_var(--arka-cyan))]">
          <Image
            src="/arka-logo.svg"
            alt=""
            width={fullW}
            height={fullH}
            className="h-auto w-auto object-contain"
            unoptimized
          />
        </span>
      )}
      {variant === "full" && (
        <span className="logo-icon-wrapper inline-flex transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_12px_var(--arka-cyan))]">
          <Image
            src="/arka-logo.svg"
            alt=""
            width={fullW}
            height={fullH}
            className="h-auto w-auto object-contain"
            unoptimized
          />
        </span>
      )}
    </span>
  );
}
