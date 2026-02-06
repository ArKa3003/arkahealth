"use client";

import {
  type ButtonHTMLAttributes,
  forwardRef,
  type ReactNode,
} from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-arka-cyan focus:ring-offset-2 focus:ring-offset-arka-bg-dark disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation",
          variant === "primary" && "arka-button-primary",
          variant === "secondary" && "arka-button-secondary",
          variant === "outline" &&
            "border-2 border-arka-cyan/50 bg-transparent text-arka-cyan hover:bg-arka-cyan/10",
          variant === "ghost" &&
            "text-arka-text-dark-muted hover:bg-arka-pale hover:text-arka-cyan",
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2 text-base",
          size === "lg" && "px-6 py-3 text-lg",
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
