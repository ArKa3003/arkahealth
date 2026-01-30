"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export function ArkaSpinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizePx = size === "sm" ? 32 : size === "md" ? 48 : 64;

  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      role="img"
      aria-hidden
    >
      <Image
        src="/arka-spinner.svg"
        alt=""
        width={sizePx}
        height={sizePx}
        className="arka-spinner-img h-auto w-auto"
        unoptimized
      />
    </span>
  );
}
