import * as React from "react";

import { cn } from "@/lib/utils";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Shimmer placeholder for loading content blocks.
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-radius-md bg-shimmer animate-shimmer motion-reduce:animate-none",
        className,
      )}
      aria-hidden
      {...props}
    />
  );
}

export { Skeleton };
