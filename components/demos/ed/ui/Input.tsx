"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
