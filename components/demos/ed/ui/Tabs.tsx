"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { clsx } from "clsx";

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      className={clsx("w-full", className)}
    >
      {children}
    </TabsPrimitive.Root>
  );
}

export function TabsList({
  className,
  children,
  variant = "segmented",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "segmented";
}) {
  return (
    <TabsPrimitive.List
      className={clsx(
        "inline-flex items-center justify-center rounded-lg border border-arka-primary/20 bg-arka-bg-medium/50 p-1",
        variant === "segmented" && "gap-0",
        className
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  TabsPrimitive.TabsTriggerProps & { className?: string }
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={clsx(
        "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-arka-bg-dark disabled:pointer-events-none disabled:opacity-50 touch-manipulation",
        "data-[state=inactive]:text-arka-text-soft data-[state=inactive]:hover:text-arka-text",
        "data-[state=active]:bg-arka-cyan data-[state=active]:text-white data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  TabsPrimitive.TabsContentProps & { className?: string }
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={clsx("mt-2 focus-visible:outline-none", className)}
      {...props}
    />
  );
});
