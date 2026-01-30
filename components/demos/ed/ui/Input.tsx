"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-lg border border-arka-primary/30 bg-arka-bg-medium/80 px-3 py-2 text-arka-text placeholder:text-arka-text-soft/60 focus:border-arka-cyan focus:ring-2 focus:ring-arka-cyan/20 focus:outline-none transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
