"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-start gap-1 overflow-x-auto rounded-radius-md",
      "border-b border-border-subtle bg-surface-sunken/60 p-1 text-arka-slate-600",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * Animated underline indicator shared across triggers via framer-motion layoutId.
 */
function TabActiveIndicator() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      layoutId="arka-tabs-indicator"
      className="absolute inset-x-1 -bottom-px z-0 h-0.5 rounded-full bg-arka-teal-600"
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 420, damping: 32 }
      }
    />
  );
}

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const localRef = React.useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = React.useState(false);

  const setRefs = React.useCallback(
    (node: HTMLButtonElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  React.useEffect(() => {
    const el = localRef.current;
    if (!el) return;

    const sync = () => setIsActive(el.getAttribute("data-state") === "active");
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(el, { attributes: true, attributeFilter: ["data-state"] });
    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={setRefs}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center whitespace-nowrap",
        "rounded-radius-sm px-3 py-1.5 text-sm font-medium text-arka-slate-600",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-arka-slate-900",
        className,
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {isActive ? <TabActiveIndicator /> : null}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 min-h-0 flex-1 overflow-y-auto rounded-radius-lg border border-border-subtle",
      "bg-surface p-4 text-body text-arka-slate-800",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500 focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
