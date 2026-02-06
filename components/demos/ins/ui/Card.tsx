"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "elevated" | "glass" | "interactive";

export interface InsCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: "arka-card border border-arka-deep/20",
  elevated: "arka-card border border-arka-deep/30 shadow-xl hover:shadow-arka-deep/10 hover:-translate-y-0.5 transition-all duration-300",
  glass: "bg-arka-bg-medium/60 backdrop-blur-xl border border-white/10",
  interactive:
    "arka-card border border-arka-deep/20 cursor-pointer hover:border-arka-deep/40 hover:shadow-arka-deep/10 hover:-translate-y-1 active:translate-y-0 transition-all duration-200",
};

const Card = React.forwardRef<HTMLDivElement, InsCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const isInteractive = variant === "interactive";
    return (
      <motion.div
        ref={ref}
        className={cn("rounded-xl overflow-hidden", variantStyles[variant], className)}
        whileHover={isInteractive ? { scale: 1.01 } : undefined}
        whileTap={isInteractive ? { scale: 0.99 } : undefined}
        transition={{ duration: 0.2, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = "InsCard";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, compact = false, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5", compact ? "p-4" : "p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = "h3", ...props }, ref) => (
    <Component ref={ref} className={cn("font-heading text-xl font-semibold leading-none tracking-tight text-slate-900", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-slate-600 leading-relaxed", className)} {...props} />
);
CardDescription.displayName = "CardDescription";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  noPadding?: boolean;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, compact = false, noPadding = false, ...props }, ref) => (
    <div ref={ref} className={cn(noPadding ? "p-0" : compact ? "px-4 pb-4" : "px-6 pb-6", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  bordered?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, compact = false, bordered = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center", compact ? "px-4 pb-4" : "px-6 pb-6", bordered && "pt-4 mt-2 border-t border-white/10", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
