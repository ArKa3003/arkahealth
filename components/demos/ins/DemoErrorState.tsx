"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Database, MousePointerClick, AlertCircle, RotateCcw, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/demos/ins/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/demos/ins/ui/Card";
import { cn } from "@/lib/utils";

export type DemoErrorVariant = "demo-data-unavailable" | "scenario-required" | "invalid-data";

export interface DemoErrorStateProps {
  variant: DemoErrorVariant;
  onResetDemo?: () => void;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}

const variantConfig: Record<
  DemoErrorVariant,
  {
    icon: React.ElementType;
    title: string;
    description: string;
    steps: string[];
    primaryAction?: { label: string };
    secondaryAction?: { label: string };
    iconClassName?: string;
  }
> = {
  "demo-data-unavailable": {
    icon: Database,
    title: "Demo data unavailable",
    description: "The demo scenario data could not be loaded. Try Reset Demo or refresh the page.",
    steps: ["Click **Reset Demo** to reload.", "If the problem continues, refresh the page."],
    primaryAction: { label: "Reset Demo" },
    secondaryAction: { label: "Go to Home" },
    iconClassName: "text-amber-400",
  },
  "scenario-required": {
    icon: MousePointerClick,
    title: "Please select a scenario to continue",
    description: "Choose one of the demo modes above to load a patient and order.",
    steps: ["Select **Standard Flow**, **High-Risk Case**, or **Gold Card Provider**.", "Use the sidebar or **Next** to move through the workflow."],
    primaryAction: { label: "Select a scenario above" },
    iconClassName: "text-arka-deep",
  },
  "invalid-data": {
    icon: AlertCircle,
    title: "Invalid or missing data",
    description: "The data for this step could not be used. Go back and run the analysis again.",
    steps: ["Click **Go Back** and run the analysis again.", "Or **Reset Demo** to start over."],
    primaryAction: { label: "Go Back" },
    secondaryAction: { label: "Reset Demo" },
    iconClassName: "text-red-400",
  },
};

export function DemoErrorState({
  variant,
  onResetDemo,
  onRetry,
  onGoBack,
  className,
}: DemoErrorStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handlePrimary = () => {
    if (variant === "demo-data-unavailable" && onResetDemo) onResetDemo();
    else if (variant === "invalid-data" && onGoBack) onGoBack();
  };

  const handleSecondary = () => {
    if (variant === "demo-data-unavailable" && typeof window !== "undefined") window.location.href = "/";
    else if (variant === "invalid-data" && onResetDemo) onResetDemo();
  };

  const showPrimary = config.primaryAction && variant !== "scenario-required";
  const showSecondary = config.secondaryAction;

  return (
    <motion.div
      className={cn("w-full max-w-xl mx-auto", className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card variant="default" className="border-2 border-arka-deep/30 overflow-hidden">
        <CardHeader className="border-b border-white/10 bg-arka-bg-medium/60">
          <div className="flex items-start gap-3">
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-arka-bg-dark", config.iconClassName)}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg text-arka-text">{config.title}</CardTitle>
              <p className="text-sm text-arka-text-soft mt-1">{config.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex items-start gap-2 mb-5">
            <HelpCircle className="h-5 w-5 text-arka-deep flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-arka-text-muted mb-2">Next steps</p>
              <ul className="space-y-1.5 text-sm text-arka-text-soft">
                {config.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-arka-deep flex-shrink-0 mt-0.5" />
                    <span
                      dangerouslySetInnerHTML={{
                        __html: step.replace(/\*\*(.+?)\*\*/g, "<strong class='text-arka-text'>$1</strong>"),
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {showPrimary && (
              <Button variant="primary" size="md" onClick={handlePrimary} leftIcon={<RotateCcw className="h-4 w-4" />}>
                {config.primaryAction!.label}
              </Button>
            )}
            {variant === "invalid-data" && onRetry && (
              <Button variant="secondary" size="md" onClick={onRetry}>Try Again</Button>
            )}
            {showSecondary && (
              <Button variant="secondary" size="md" onClick={handleSecondary}>
                {config.secondaryAction!.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
