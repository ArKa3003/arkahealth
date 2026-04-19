"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      {children}
    </TabsPrimitive.Root>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-lg border border-arka-primary/15 bg-arka-bg-medium/30 p-1",
        className
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex min-h-[40px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-arka-text-dark-muted transition data-[state=active]:bg-white data-[state=active]:text-arka-teal data-[state=active]:shadow-sm dark:data-[state=active]:bg-arka-bg-dark/80",
        className
      )}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn("mt-4 outline-none", className)} {...props} />;
});
